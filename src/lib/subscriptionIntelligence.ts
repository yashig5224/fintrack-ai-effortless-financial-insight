// Phase 8 — Subscription Intelligence Engine
// Detects recurring charges, duplicates, unused subs, price hikes from
// real transaction history. No hardcoded data.

import type { Tx } from "@/components/dashboard/CommandCenter";

export interface SubCharge {
  date: string;
  amount: number;
}

export interface DetectedSubscription {
  id: string;
  name: string;
  category: string | null;
  charges: SubCharge[];
  monthlyCost: number;        // avg per month over observed window
  yearlyCost: number;         // monthlyCost * 12
  lastSeen: string;
  firstSeen: string;
  cadenceDays: number;        // average gap between charges
  count: number;
  unused: boolean;            // no charge in last 45 days
  priceIncreased: boolean;
  priceChangePct: number;     // last vs first (positive = increase)
  lastAmount: number;
  firstAmount: number;
  confidence: "high" | "medium" | "low";
}

export interface DuplicateGroup {
  key: string;
  subs: DetectedSubscription[];
  totalMonthly: number;
  potentialSavings: number;   // monthly savings if all but cheapest cancelled
}

export interface SavingsOpportunity {
  id: string;
  kind: "unused" | "duplicate" | "price_hike" | "high_cost";
  title: string;
  detail: string;
  monthlySavings: number;
  yearlySavings: number;
  severity: "info" | "warning" | "critical";
  subId?: string;
}

export interface SubscriptionIntelligence {
  subscriptions: DetectedSubscription[];
  duplicates: DuplicateGroup[];
  opportunities: SavingsOpportunity[];
  totals: {
    monthly: number;
    yearly: number;
    activeCount: number;
    unusedCount: number;
    potentialMonthlySavings: number;
    potentialYearlySavings: number;
  };
}

const DAY = 86_400_000;
const today = () => new Date();
const daysBetween = (a: string, b: string) =>
  Math.abs((new Date(a).getTime() - new Date(b).getTime()) / DAY);
const isoDaysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString().slice(0, 10);

function normalizeName(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(monthly|yearly|subscription|sub|plan|recurring|auto pay|autopay|renewal|premium)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;
  const sa = new Set(a.split(" "));
  const sb = new Set(b.split(" "));
  const inter = [...sa].filter(x => sb.has(x)).length;
  const uni = new Set([...sa, ...sb]).size;
  return uni ? inter / uni : 0;
}

export function detectSubscriptions(transactions: Tx[]): DetectedSubscription[] {
  const expense = transactions.filter(t => t.type !== "income" && Number(t.amount || 0) > 0);
  const buckets = new Map<string, Tx[]>();

  for (const t of expense) {
    const key = normalizeName(t.title || "");
    if (!key) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(t);
  }

  const out: DetectedSubscription[] = [];

  buckets.forEach((arr, key) => {
    const sorted = [...arr].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
    const flagged = sorted.some(t => t.recurring);
    if (sorted.length < 2 && !flagged) return;

    // gaps
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(daysBetween(sorted[i - 1].transaction_date, sorted[i].transaction_date));
    }
    const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 30;

    // Recurring filter: 7d (weekly) / 14d / 28-32d (monthly) / 90d / 365d windows
    const recurringLike = flagged ||
      (sorted.length >= 2 && avgGap >= 6 && avgGap <= 400 &&
        gaps.every(g => Math.abs(g - avgGap) <= Math.max(7, avgGap * 0.35)));
    if (!recurringLike) return;

    const amounts = sorted.map(t => Number(t.amount || 0));
    const firstAmount = amounts[0];
    const lastAmount = amounts[amounts.length - 1];
    const total = amounts.reduce((a, b) => a + b, 0);

    // monthly cost
    const monthlyMultiplier =
      avgGap <= 9 ? (30 / 7) :
      avgGap <= 20 ? 2 :
      avgGap <= 45 ? 1 :
      avgGap <= 120 ? 1 / 3 :
      avgGap <= 200 ? 1 / 6 :
      1 / 12;
    const avgCharge = total / amounts.length;
    const monthlyCost = avgCharge * monthlyMultiplier;

    const lastSeen = sorted[sorted.length - 1].transaction_date;
    const firstSeen = sorted[0].transaction_date;
    const unused = daysBetween(lastSeen, today().toISOString()) > 45 && avgGap < 60;

    const priceChangePct = firstAmount > 0 ? ((lastAmount - firstAmount) / firstAmount) * 100 : 0;
    const priceIncreased = priceChangePct >= 5 && amounts.length >= 3;

    const confidence: DetectedSubscription["confidence"] =
      flagged || sorted.length >= 4 ? "high" :
      sorted.length >= 3 ? "medium" : "low";

    out.push({
      id: `sub-${key.replace(/\s+/g, "-")}`,
      name: sorted[sorted.length - 1].title,
      category: sorted[sorted.length - 1].category ?? null,
      charges: sorted.map(t => ({ date: t.transaction_date, amount: Number(t.amount || 0) })),
      monthlyCost,
      yearlyCost: monthlyCost * 12,
      lastSeen,
      firstSeen,
      cadenceDays: Math.round(avgGap),
      count: amounts.length,
      unused,
      priceIncreased,
      priceChangePct: Math.round(priceChangePct * 10) / 10,
      lastAmount,
      firstAmount,
      confidence,
    });
  });

  return out.sort((a, b) => b.monthlyCost - a.monthlyCost);
}

export function detectDuplicates(subs: DetectedSubscription[]): DuplicateGroup[] {
  const visited = new Set<string>();
  const groups: DuplicateGroup[] = [];
  for (let i = 0; i < subs.length; i++) {
    if (visited.has(subs[i].id)) continue;
    const cluster = [subs[i]];
    visited.add(subs[i].id);
    const a = normalizeName(subs[i].name);
    for (let j = i + 1; j < subs.length; j++) {
      if (visited.has(subs[j].id)) continue;
      const b = normalizeName(subs[j].name);
      const sameCat = subs[i].category && subs[j].category && subs[i].category === subs[j].category;
      if (similarity(a, b) >= 0.6 || (sameCat && similarity(a, b) >= 0.4)) {
        cluster.push(subs[j]);
        visited.add(subs[j].id);
      }
    }
    if (cluster.length > 1) {
      const totalMonthly = cluster.reduce((s, x) => s + x.monthlyCost, 0);
      const cheapest = Math.min(...cluster.map(x => x.monthlyCost));
      groups.push({
        key: cluster[0].name,
        subs: cluster,
        totalMonthly,
        potentialSavings: totalMonthly - cheapest,
      });
    }
  }
  return groups;
}

export function computeSubscriptionIntelligence(transactions: Tx[]): SubscriptionIntelligence {
  const subscriptions = detectSubscriptions(transactions);
  const duplicates = detectDuplicates(subscriptions);
  const opportunities: SavingsOpportunity[] = [];

  for (const s of subscriptions) {
    if (s.unused) {
      opportunities.push({
        id: `op-unused-${s.id}`,
        kind: "unused",
        title: `Cancel "${s.name}" — looks unused`,
        detail: `No charge in ${Math.round(daysBetween(s.lastSeen, today().toISOString()))} days but billed every ~${s.cadenceDays}d.`,
        monthlySavings: s.monthlyCost,
        yearlySavings: s.yearlyCost,
        severity: "warning",
        subId: s.id,
      });
    }
    if (s.priceIncreased) {
      opportunities.push({
        id: `op-hike-${s.id}`,
        kind: "price_hike",
        title: `"${s.name}" price up ${s.priceChangePct}%`,
        detail: `Charge rose from ₹${Math.round(s.firstAmount)} to ₹${Math.round(s.lastAmount)}. Review whether it's still worth it.`,
        monthlySavings: Math.max(0, (s.lastAmount - s.firstAmount)) * (s.cadenceDays <= 9 ? 30 / 7 : s.cadenceDays <= 45 ? 1 : 1 / 12),
        yearlySavings: 0,
        severity: "info",
        subId: s.id,
      });
    }
  }
  for (const d of duplicates) {
    opportunities.push({
      id: `op-dup-${d.key}`,
      kind: "duplicate",
      title: `${d.subs.length} overlapping subscriptions: ${d.subs.map(s => s.name).join(" + ")}`,
      detail: `Consolidate to the cheapest plan and save ${`₹${Math.round(d.potentialSavings).toLocaleString("en-IN")}`}/mo.`,
      monthlySavings: d.potentialSavings,
      yearlySavings: d.potentialSavings * 12,
      severity: "critical",
    });
  }
  const sorted = [...subscriptions].sort((a, b) => b.monthlyCost - a.monthlyCost);
  if (sorted[0] && sorted[0].monthlyCost > 1500) {
    const s = sorted[0];
    opportunities.push({
      id: `op-high-${s.id}`,
      kind: "high_cost",
      title: `"${s.name}" is your most expensive subscription`,
      detail: `Costing ₹${Math.round(s.monthlyCost).toLocaleString("en-IN")}/mo (~₹${Math.round(s.yearlyCost).toLocaleString("en-IN")}/yr). Consider downgrading.`,
      monthlySavings: s.monthlyCost * 0.3,
      yearlySavings: s.yearlyCost * 0.3,
      severity: "info",
      subId: s.id,
    });
  }

  opportunities.sort((a, b) => b.monthlySavings - a.monthlySavings);

  const monthly = subscriptions.reduce((s, x) => s + x.monthlyCost, 0);
  const potentialMonthlySavings = opportunities
    .filter(o => o.kind === "unused" || o.kind === "duplicate")
    .reduce((s, o) => s + o.monthlySavings, 0);

  return {
    subscriptions,
    duplicates,
    opportunities,
    totals: {
      monthly,
      yearly: monthly * 12,
      activeCount: subscriptions.filter(s => !s.unused).length,
      unusedCount: subscriptions.filter(s => s.unused).length,
      potentialMonthlySavings,
      potentialYearlySavings: potentialMonthlySavings * 12,
    },
  };
}

export { isoDaysAgo };
