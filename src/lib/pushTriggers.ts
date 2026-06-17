// Client-side helper to invoke send-push and send-email edge functions.
// Use these from app code (dashboard mount, automation engine, goal hits, etc.).
//
// Both functions are no-ops if the user is not authenticated. They never throw —
// notifications are best-effort and must not block UI.

import { supabase } from "@/integrations/supabase/client";

type PushType = "budget_alert" | "spending_spike" | "goal_reminder" | "subscription" | "automation" | "general";

interface PushPayload {
  title: string;
  body: string;
  type?: PushType;
  link?: string;
  data?: Record<string, string>;
}

export async function sendPush(p: PushPayload): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.functions.invoke("send-push", { body: p });
  } catch (e) {
    console.warn("sendPush failed", e);
  }
}

interface EmailPayload {
  to: string;
  templateName: "welcome" | "verification" | "upgrade-confirmation" | "payment-success" | "subscription-cancelled" | "monthly-report";
  data?: Record<string, unknown>;
}

export async function sendEmail(p: EmailPayload): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.functions.invoke("send-email", { body: p });
  } catch (e) {
    console.warn("sendEmail failed", e);
  }
}

// ── Convenience wrappers ────────────────────────────────────────────────────
export const notifyBudgetOverspend = (category: string, percent: number) =>
  sendPush({
    title: "Budget alert",
    body: `${category} is at ${Math.round(percent)}% of your monthly limit.`,
    type: "budget_alert",
    link: "/app",
  });

export const notifyGoalMilestone = (goalName: string, percent: number) =>
  sendPush({
    title: "Goal progress",
    body: `You've hit ${Math.round(percent)}% on ${goalName}. Keep going!`,
    type: "goal_reminder",
    link: "/app",
  });

export const notifyAutomationFired = (ruleName: string) =>
  sendPush({
    title: "Automation triggered",
    body: `${ruleName} just ran. Tap to review the action.`,
    type: "automation",
    link: "/app",
  });

export const notifyRenewalSoon = (planName: string, daysLeft: number) =>
  sendPush({
    title: "Renewal reminder",
    body: `Your ${planName} plan renews in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
    type: "subscription",
    link: "/billing",
  });
