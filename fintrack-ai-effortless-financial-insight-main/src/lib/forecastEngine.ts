// Phase 5 — Forecast Engine
// Predicts next-month spending, savings, cash balance, category spend,
// goal completion dates, and subscription burn using real history.
// Uses weighted moving averages + linear regression with confidence scoring.

import type { Tx, Goal } from "@/components/dashboard/CommandCenter";

export interface Forecast {
  nextMonthSpending: { value: number; confidence: number; explanation: string };
  nextMonthSavings: { value: number; confidence: number; explanation: string };
  expectedCashBalance: { value: number; confidence: number; explanation: string };
  categorySpending: { category: string; value: number; confidence: number; trend: "up" | "down" | "flat" }[];
  goalCompletions: { name: string; etaMonths: number | null; etaDate: string | null; confidence: number; risk: "low" | "medium" | "high" }[];
  subscriptionCost: { value: number; count: number; confidence: number };
  risks: string[];
  generatedAt: string;
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const mean = (a: number[]) => (a.length ? sum(a) / a.length : 0);

function stddev(a: number[]) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length);
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

// Linear regression slope+intercept on (x,y) pairs.
function linreg(ys: number[]): { slope: number; intercept: number } {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] || 0 };
  const xs = ys.map((_, i) => i);
  const mx = mean(xs), my = mean(ys);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: my - slope * mx };
}

// Confidence: high history + low variance → high confidence.
function confidenceFor(samples: number[]): number {
  if (!samples.length) return 0.2;
  const m = mean(samples);
  if (m === 0) return 0.3;
  const cv = stddev(samples) / m;
  const histScore = Math.min(1, samples.length / 6);   // 6+ months = 1
  const stabScore = Math.max(0, 1 - cv);
  return Math.round((histScore * 0.5 + stabScore * 0.5) * 100) / 100;
}

function monthlyBuckets(txs: Tx[], predicate: (t: Tx) => boolean, months = 6): { key: string; total: number }[] {
  const buckets = new Map<string, number>();
  const cutoff = isoDaysAgo(months * 30);
  for (const t of txs) {
    if (t.transaction_date < cutoff) continue;
    if (!predicate(t)) continue;
    const k = t.transaction_date.slice(0, 7);
    buckets.set(k, (buckets.get(k) || 0) + Number(t.amount || 0));
  }
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, total]) => ({ key, total }));
}

// Weighted moving average — heavier weight on recent months.
function wma(values: number[]): number {
  if (!values.length) return 0;
  let w = 0, total = 0;
  values.forEach((v, i) => { const wt = i + 1; w += wt; total += v * wt; });
  return total / w;
}

export function computeForecast(opts: {
  transactions: Tx[];
  goals: Goal[];
  currentCash?: number;        // optional; if absent, uses 30d net savings as proxy
}): Forecast {
  const { transactions, goals } = opts;

  const spendBuckets = monthlyBuckets(transactions, (t) => t.type !== "income", 6);
  const incomeBuckets = monthlyBuckets(transactions, (t) => t.type === "income", 6);
  const spendVals = spendBuckets.map((b) => b.total);
  const incomeVals = incomeBuckets.map((b) => b.total);

  // Next-month spending — blend WMA with linreg projection.
  const reg = linreg(spendVals);
  const projectedSpend = Math.max(0, reg.slope * spendVals.length + reg.intercept);
  const blendedSpend = (wma(spendVals) * 0.6 + projectedSpend * 0.4) || 0;
  const spendConf = confidenceFor(spendVals);
  const spendTrend = reg.slope > mean(spendVals) * 0.05 ? "up" : reg.slope < -mean(spendVals) * 0.05 ? "down" : "flat";

  // Next-month income & savings.
  const regI = linreg(incomeVals);
  const projectedIncome = Math.max(0, regI.slope * incomeVals.length + regI.intercept);
  const blendedIncome = (wma(incomeVals) * 0.7 + projectedIncome * 0.3) || 0;
  const incConf = confidenceFor(incomeVals);
  const nextSavings = blendedIncome - blendedSpend;
  const savConf = Math.round(((spendConf + incConf) / 2) * 100) / 100;

  // Category-level forecasts.
  const byCatMonth = new Map<string, Map<string, number>>();
  const cutoff = isoDaysAgo(180);
  for (const t of transactions) {
    if (t.transaction_date < cutoff || t.type === "income") continue;
    const c = t.category || "Other";
    const k = t.transaction_date.slice(0, 7);
    if (!byCatMonth.has(c)) byCatMonth.set(c, new Map());
    const m = byCatMonth.get(c)!;
    m.set(k, (m.get(k) || 0) + Number(t.amount || 0));
  }
  const categorySpending = [...byCatMonth.entries()]
    .map(([category, m]) => {
      const vals = [...m.values()];
      const r = linreg(vals);
      const proj = Math.max(0, r.slope * vals.length + r.intercept);
      const v = (wma(vals) * 0.5 + proj * 0.5) || 0;
      const conf = confidenceFor(vals);
      const trend = r.slope > mean(vals) * 0.05 ? "up" : r.slope < -mean(vals) * 0.05 ? "down" : "flat";
      return { category, value: v, confidence: conf, trend: trend as "up" | "down" | "flat" };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Goal completion ETAs — uses monthly net savings share per active goal.
  const monthlyNet = blendedIncome - blendedSpend;
  const activeGoals = goals.filter((g) => Number(g.current_amount || 0) < Number(g.target_amount || 0));
  const sharePer = activeGoals.length > 0 ? Math.max(0, monthlyNet) / activeGoals.length : 0;
  const goalCompletions = goals.map((g) => {
    const tgt = Number(g.target_amount || 0);
    const cur = Number(g.current_amount || 0);
    const remaining = Math.max(0, tgt - cur);
    if (remaining === 0) return { name: g.goal_name, etaMonths: 0, etaDate: new Date().toISOString().slice(0, 10), confidence: 0.99, risk: "low" as const };
    if (sharePer <= 0) return { name: g.goal_name, etaMonths: null, etaDate: null, confidence: 0.4, risk: "high" as const };
    const months = remaining / sharePer;
    const eta = new Date(); eta.setMonth(eta.getMonth() + Math.ceil(months));
    let risk: "low" | "medium" | "high" = "low";
    if (g.deadline) {
      const deadlineMs = new Date(g.deadline).getTime();
      const etaMs = eta.getTime();
      if (etaMs > deadlineMs) risk = "high";
      else if (etaMs > deadlineMs - 30 * 86_400_000) risk = "medium";
    } else if (months > 36) risk = "medium";
    return {
      name: g.goal_name,
      etaMonths: Math.ceil(months * 10) / 10,
      etaDate: eta.toISOString().slice(0, 10),
      confidence: savConf,
      risk,
    };
  });

  // Subscription cost forecast.
  const recurring = transactions.filter((t) => t.recurring && t.type !== "income" && t.transaction_date >= isoDaysAgo(60));
  const subTotal = sum(recurring.map((t) => Number(t.amount || 0))) / Math.max(1, 60 / 30);
  const subscriptionCost = { value: subTotal, count: new Set(recurring.map((t) => (t.title || "").toLowerCase())).size, confidence: confidenceFor(recurring.map((t) => Number(t.amount || 0))) };

  // Cash balance projection (30 days ahead).
  const baseCash = opts.currentCash ?? (sum(incomeVals.slice(-3)) - sum(spendVals.slice(-3)));
  const expectedCashBalance = {
    value: baseCash + nextSavings,
    confidence: savConf,
    explanation: `Based on ${spendBuckets.length}-month history. Projects ${nextSavings >= 0 ? "+" : "−"}₹${Math.abs(Math.round(nextSavings)).toLocaleString("en-IN")} net change.`,
  };

  // Risk indicators
  const risks: string[] = [];
  if (spendTrend === "up" && spendConf > 0.5) risks.push(`Spending trending up — ${reg.slope > 0 ? `+₹${Math.round(reg.slope).toLocaleString("en-IN")}/month slope` : ""}.`);
  if (nextSavings < 0) risks.push("Forecast shows negative savings next month — expenses likely to exceed income.");
  if (subscriptionCost.value > blendedIncome * 0.15) risks.push("Subscription burn exceeds 15% of projected income.");
  for (const g of goalCompletions) if (g.risk === "high") risks.push(`Goal "${g.name}" projected to miss deadline.`);

  return {
    nextMonthSpending: {
      value: blendedSpend,
      confidence: spendConf,
      explanation: `Blends ${spendBuckets.length}-month weighted average with trend (slope ${reg.slope >= 0 ? "+" : ""}${Math.round(reg.slope).toLocaleString("en-IN")}/mo).`,
    },
    nextMonthSavings: {
      value: nextSavings,
      confidence: savConf,
      explanation: `Income forecast ₹${Math.round(blendedIncome).toLocaleString("en-IN")} − spend forecast ₹${Math.round(blendedSpend).toLocaleString("en-IN")}.`,
    },
    expectedCashBalance,
    categorySpending,
    goalCompletions,
    subscriptionCost,
    risks,
    generatedAt: new Date().toISOString(),
  };
}
