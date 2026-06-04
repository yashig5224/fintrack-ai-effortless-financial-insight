// Phase 7 — Smart Notification System.
// Centralized helpers for creating, querying and acting on notifications.
// All notifications come from real events: budgets, goals, automations,
// subscriptions, AI insights and payments.

import { supabase } from "@/integrations/supabase/client";

export type NotificationType =
  | "budget"
  | "goal"
  | "automation"
  | "subscription"
  | "ai_insight"
  | "payment";

export type NotificationSeverity = "info" | "success" | "warning" | "critical";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  link: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  archived: boolean;
  created_at: string;
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  link?: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;  // if provided, skip create when an unread notification with same key exists in last 24h
}) {
  const { userId, type, title, message, severity = "info", link, metadata = {}, dedupeKey } = input;
  if (dedupeKey) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("read", false)
      .gte("created_at", since)
      .contains("metadata", { dedupeKey })
      .limit(1);
    if (existing && existing.length > 0) return null;
  }
  const meta = dedupeKey ? { ...metadata, dedupeKey } : metadata;
  const { data, error } = await supabase
    .from("notifications")
    .insert({ user_id: userId, type, title, message, severity, link: link || null, metadata: meta as never })
    .select()
    .single();
  if (error) {
    console.error("notification create failed", error);
    return null;
  }
  return data;
}

export async function markRead(id: string) {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}
export async function markAllRead(userId: string) {
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}
export async function archiveNotification(id: string) {
  await supabase.from("notifications").update({ archived: true, read: true }).eq("id", id);
}
export async function deleteNotification(id: string) {
  await supabase.from("notifications").delete().eq("id", id);
}

// ----- Event scanners — generate notifications from real Supabase data -----

interface Tx { id: string; title: string; amount: number; type: string; category: string | null; transaction_date: string; recurring?: boolean | null; }
interface Goal { id: string; goal_name: string; target_amount: number; current_amount: number; deadline: string | null; }
interface Budget { id: string; category: string; monthly_limit: number; spent_amount: number; month: string; }

/**
 * Scan budgets/goals/subscriptions/AI signals and create notifications.
 * Idempotent — uses dedupeKey to avoid duplicates within 24h.
 */
export async function runNotificationScan(opts: {
  userId: string;
  transactions: Tx[];
  goals: Goal[];
  budgets: Budget[];
}) {
  const { userId, transactions, goals, budgets } = opts;

  // Budget alerts
  for (const b of budgets) {
    const ratio = Number(b.spent_amount) / Math.max(1, Number(b.monthly_limit));
    if (ratio >= 1) {
      await createNotification({
        userId, type: "budget", severity: "critical",
        title: `Budget exceeded: ${b.category}`,
        message: `You've spent ${Math.round(ratio * 100)}% of your ${b.category} budget this month.`,
        link: "/app",
        dedupeKey: `budget-exceeded-${b.id}-${b.month}`,
        metadata: { budgetId: b.id, category: b.category, ratio },
      });
    } else if (ratio >= 0.85) {
      await createNotification({
        userId, type: "budget", severity: "warning",
        title: `${b.category} budget at ${Math.round(ratio * 100)}%`,
        message: `You're approaching your monthly ${b.category} cap.`,
        link: "/app",
        dedupeKey: `budget-warn-${b.id}-${b.month}`,
        metadata: { budgetId: b.id, category: b.category, ratio },
      });
    }
  }

  // Goal alerts
  for (const g of goals) {
    const ratio = Number(g.current_amount) / Math.max(1, Number(g.target_amount));
    if (ratio >= 1) {
      await createNotification({
        userId, type: "goal", severity: "success",
        title: `Goal achieved: ${g.goal_name}`,
        message: `You've reached 100% of your ${g.goal_name} target. Time to set the next milestone.`,
        link: "/app",
        dedupeKey: `goal-done-${g.id}`,
        metadata: { goalId: g.id },
      });
    } else if (g.deadline) {
      const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86_400_000);
      if (daysLeft > 0 && daysLeft <= 30 && ratio < 0.7) {
        await createNotification({
          userId, type: "goal", severity: "warning",
          title: `Goal behind: ${g.goal_name}`,
          message: `${daysLeft} days to deadline at ${Math.round(ratio * 100)}% complete. Lift contribution to stay on track.`,
          link: "/app",
          dedupeKey: `goal-behind-${g.id}`,
          metadata: { goalId: g.id, daysLeft, ratio },
        });
      }
    }
  }

  // Subscription alerts — detect new recurring patterns this month
  const recurring = transactions.filter((t) => t.recurring);
  if (recurring.length > 0) {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthly = recurring.filter((t) => t.transaction_date.startsWith(thisMonth));
    const total = monthly.reduce((s, t) => s + Number(t.amount), 0);
    if (total > 0) {
      await createNotification({
        userId, type: "subscription", severity: "info",
        title: `${monthly.length} subscriptions detected`,
        message: `Recurring charges total ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(total)} this month. Review to free up cashflow.`,
        link: "/app",
        dedupeKey: `subs-${thisMonth}`,
        metadata: { count: monthly.length, total },
      });
    }
  }

  // AI insight — overspending vs prior 30d
  const now = new Date().toISOString().slice(0, 10);
  const t30 = transactions.filter((t) => t.transaction_date >= isoDaysAgo(30) && t.transaction_date <= now && t.type !== "income");
  const t60 = transactions.filter((t) => t.transaction_date >= isoDaysAgo(60) && t.transaction_date < isoDaysAgo(30) && t.type !== "income");
  const cur = t30.reduce((s, t) => s + Number(t.amount), 0);
  const prev = t60.reduce((s, t) => s + Number(t.amount), 0);
  if (prev > 0 && cur > prev * 1.25) {
    await createNotification({
      userId, type: "ai_insight", severity: "warning",
      title: "Spending up sharply",
      message: `Last 30 days you spent ${Math.round(((cur - prev) / prev) * 100)}% more than the prior 30 days. Open Lumo AI for a breakdown.`,
      link: "/coach",
      dedupeKey: `ai-overspend-${now.slice(0, 7)}`,
      metadata: { cur, prev },
    });
  }
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}
