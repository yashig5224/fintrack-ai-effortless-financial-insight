// Phase 9 — Goal Intelligence Engine
// Per-goal forecasting: completion date, required monthly contribution,
// risk score, success probability, and AI-style recommendations.

import type { Tx, Goal } from "@/components/dashboard/CommandCenter";

export interface GoalIntel {
  id: string;
  name: string;
  category: string | null;
  target: number;
  current: number;
  remaining: number;
  progressPct: number;
  // Projections
  monthlyCapacity: number;          // recent net savings / active goals
  predictedEtaMonths: number | null;
  predictedEtaDate: string | null;
  requiredMonthly: number | null;   // to hit deadline
  // Scoring 0-100
  riskScore: number;                // 0 safe → 100 critical
  successProbability: number;       // 0-1
  status: "on_track" | "at_risk" | "off_track" | "completed" | "stalled";
  // Suggestions
  accelerations: string[];
  warnings: string[];
  funding: string[];
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const isoDaysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);
const fmtINR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function monthsBetween(a: Date, b: Date) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) +
    (b.getDate() - a.getDate()) / 30;
}

function recentMonthlyNet(transactions: Tx[]): number {
  const cutoff = isoDaysAgo(90);
  const recent = transactions.filter(t => t.transaction_date >= cutoff);
  const income = sum(recent.filter(t => t.type === "income").map(t => Number(t.amount || 0)));
  const expenses = sum(recent.filter(t => t.type !== "income").map(t => Number(t.amount || 0)));
  return (income - expenses) / 3; // per month
}

export function computeGoalIntelligence(opts: {
  transactions: Tx[];
  goals: Goal[];
  monthlyIncome?: number;
}): GoalIntel[] {
  const { transactions, goals } = opts;
  if (!goals.length) return [];

  const netMonthly = Math.max(0, recentMonthlyNet(transactions));
  const active = goals.filter(g => Number(g.current_amount || 0) < Number(g.target_amount || 0));
  const sharePer = active.length ? netMonthly / active.length : 0;

  return goals.map(g => {
    const target = Number(g.target_amount || 0);
    const current = Number(g.current_amount || 0);
    const remaining = Math.max(0, target - current);
    const progressPct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

    if (remaining === 0) {
      return {
        id: g.id, name: g.goal_name, category: g.category,
        target, current, remaining: 0, progressPct: 100,
        monthlyCapacity: sharePer,
        predictedEtaMonths: 0, predictedEtaDate: new Date().toISOString().slice(0, 10),
        requiredMonthly: 0, riskScore: 0, successProbability: 1,
        status: "completed",
        accelerations: [], warnings: [],
        funding: [`Goal complete — consider rolling ${fmtINR(target * 0.1)} into a new milestone.`],
      } satisfies GoalIntel;
    }

    let etaMonths: number | null = null;
    let etaDate: string | null = null;
    if (sharePer > 0) {
      etaMonths = remaining / sharePer;
      const eta = new Date(); eta.setMonth(eta.getMonth() + Math.ceil(etaMonths));
      etaDate = eta.toISOString().slice(0, 10);
    }

    let requiredMonthly: number | null = null;
    let monthsToDeadline: number | null = null;
    if (g.deadline) {
      monthsToDeadline = Math.max(0.1, monthsBetween(new Date(), new Date(g.deadline)));
      requiredMonthly = remaining / monthsToDeadline;
    }

    // Risk & probability
    let risk = 0;
    if (sharePer <= 0) risk = 90;
    else if (requiredMonthly !== null) {
      const ratio = requiredMonthly / Math.max(1, sharePer);
      risk = Math.min(100, Math.round((ratio - 1) * 60 + 20));
      if (ratio <= 1) risk = Math.max(5, 20 - Math.round((1 - ratio) * 15));
    } else {
      risk = etaMonths === null ? 80 : etaMonths > 36 ? 55 : etaMonths > 18 ? 30 : 15;
    }
    risk = Math.max(0, Math.min(100, risk));
    const successProbability = Math.max(0.02, Math.min(0.99, 1 - risk / 110));

    let status: GoalIntel["status"] = "on_track";
    if (sharePer <= 0) status = "stalled";
    else if (risk >= 70) status = "off_track";
    else if (risk >= 40) status = "at_risk";

    // Suggestions
    const accelerations: string[] = [];
    const warnings: string[] = [];
    const funding: string[] = [];

    if (status === "stalled") {
      warnings.push("No surplus detected from the last 90 days — expenses match or exceed income.");
      funding.push("Free up cash by trimming the top spending category by 10%.");
    }
    if (requiredMonthly !== null && sharePer > 0 && requiredMonthly > sharePer) {
      const gap = requiredMonthly - sharePer;
      warnings.push(`Behind by ${fmtINR(gap)}/mo to hit the deadline.`);
      accelerations.push(`Add an extra ${fmtINR(gap)} monthly contribution to stay on schedule.`);
    }
    if (etaMonths !== null && etaMonths > 24) {
      accelerations.push(`Doubling contributions cuts ETA to ${Math.ceil(etaMonths / 2)} months.`);
    }
    if (status === "on_track" && etaMonths !== null && etaMonths > 0) {
      accelerations.push(`Adding ${fmtINR(sharePer * 0.25)}/mo finishes ${Math.max(1, Math.round(etaMonths * 0.2))} months earlier.`);
    }
    if (g.deadline && etaMonths !== null && monthsToDeadline !== null && etaMonths > monthsToDeadline) {
      warnings.push(`Projected to miss deadline by ${Math.ceil(etaMonths - monthsToDeadline)} months.`);
    }
    if (progressPct >= 75) {
      funding.push("Almost there — consider a one-time top-up to close the gap.");
    } else if (progressPct < 25 && sharePer > 0) {
      funding.push(`Automate ${fmtINR(Math.max(500, sharePer * 0.5))}/mo transfers to build momentum.`);
    }

    return {
      id: g.id,
      name: g.goal_name,
      category: g.category,
      target, current, remaining, progressPct,
      monthlyCapacity: sharePer,
      predictedEtaMonths: etaMonths === null ? null : Math.round(etaMonths * 10) / 10,
      predictedEtaDate: etaDate,
      requiredMonthly,
      riskScore: risk,
      successProbability,
      status,
      accelerations, warnings, funding,
    } satisfies GoalIntel;
  });
}
