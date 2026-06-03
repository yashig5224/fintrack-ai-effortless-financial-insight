// Phase 4 — Financial Health Engine
// Computes a 0–100 Financial Health Score from live user data.
// All inputs are real Supabase rows; no hardcoded values.

import type { Tx, Goal, Budget } from "@/components/dashboard/CommandCenter";

export type Grade = "Excellent" | "Good" | "Fair" | "Poor";

export interface FactorScore {
  key: string;
  label: string;
  score: number;        // 0–100
  weight: number;       // 0–1, sums to 1
  detail: string;
  status: "good" | "warn" | "bad" | "neutral";
}

export interface HealthScore {
  score: number;        // 0–100
  grade: Grade;
  factors: FactorScore[];
  monthlyChange: number;          // delta vs prior 30d
  trend: { date: string; score: number }[]; // last 6 months
  recommendations: string[];
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function sumBy<T>(arr: T[], f: (t: T) => number) {
  return arr.reduce((s, t) => s + (Number(f(t)) || 0), 0);
}

function txInRange(txs: Tx[], startISO: string, endISO: string) {
  return txs.filter((t) => t.transaction_date >= startISO && t.transaction_date <= endISO);
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

// ─── individual factor scorers ──────────────────────────────────────────────

function scoreSavingsRate(income: number, expense: number): FactorScore {
  const rate = income > 0 ? ((income - expense) / income) * 100 : 0;
  // 20% savings = ideal (100). 0% = 40. Negative = 0–30.
  let s = 0;
  if (rate >= 30) s = 100;
  else if (rate >= 20) s = 90 + (rate - 20);
  else if (rate >= 10) s = 60 + (rate - 10) * 3;
  else if (rate >= 0) s = 30 + rate * 3;
  else s = clamp(30 + rate, 0, 30);
  return {
    key: "savings_rate",
    label: "Savings Rate",
    score: clamp(s),
    weight: 0.22,
    detail: `${rate.toFixed(1)}% of income saved`,
    status: rate >= 20 ? "good" : rate >= 10 ? "warn" : "bad",
  };
}

function scoreBudgetAdherence(budgets: Budget[]): FactorScore {
  if (!budgets.length) {
    return {
      key: "budget_adherence", label: "Budget Adherence", score: 60, weight: 0.15,
      detail: "No budgets set yet", status: "neutral",
    };
  }
  let total = 0;
  let breached = 0;
  for (const b of budgets) {
    const lim = Number(b.monthly_limit || 0);
    const sp = Number(b.spent_amount || 0);
    if (lim <= 0) continue;
    total++;
    const usage = (sp / lim) * 100;
    if (usage > 100) breached++;
  }
  if (total === 0) {
    return { key: "budget_adherence", label: "Budget Adherence", score: 60, weight: 0.15, detail: "No active limits", status: "neutral" };
  }
  const ok = total - breached;
  const s = clamp((ok / total) * 100);
  return {
    key: "budget_adherence", label: "Budget Adherence", score: s, weight: 0.15,
    detail: `${ok}/${total} budgets within limit`,
    status: breached === 0 ? "good" : breached / total > 0.4 ? "bad" : "warn",
  };
}

function scoreGoalProgress(goals: Goal[]): FactorScore {
  if (!goals.length) {
    return { key: "goal_progress", label: "Goal Progress", score: 50, weight: 0.12, detail: "No goals set", status: "neutral" };
  }
  let pctSum = 0;
  for (const g of goals) {
    const tgt = Number(g.target_amount || 0);
    const cur = Number(g.current_amount || 0);
    pctSum += tgt > 0 ? clamp((cur / tgt) * 100) : 0;
  }
  const avg = pctSum / goals.length;
  return {
    key: "goal_progress", label: "Goal Progress", score: clamp(avg + 10),
    weight: 0.12,
    detail: `${avg.toFixed(0)}% avg across ${goals.length} goal${goals.length > 1 ? "s" : ""}`,
    status: avg >= 50 ? "good" : avg >= 25 ? "warn" : "bad",
  };
}

function scoreIncomeStability(txs: Tx[]): FactorScore {
  // Compare monthly income over last 3 months — lower variance = higher score.
  const buckets = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== "income") continue;
    const k = t.transaction_date.slice(0, 7);
    buckets.set(k, (buckets.get(k) || 0) + Number(t.amount || 0));
  }
  const arr = [...buckets.values()];
  if (arr.length < 2) {
    return { key: "income_stability", label: "Income Stability", score: arr.length === 1 ? 70 : 50, weight: 0.12, detail: arr.length ? "Limited history" : "No income recorded", status: "neutral" };
  }
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  const s = clamp(100 - cv * 120);
  return {
    key: "income_stability", label: "Income Stability", score: s, weight: 0.12,
    detail: `${(cv * 100).toFixed(0)}% variability`,
    status: cv < 0.15 ? "good" : cv < 0.35 ? "warn" : "bad",
  };
}

function scoreSpendingStability(txs: Tx[]): FactorScore {
  const buckets = new Map<string, number>();
  for (const t of txs) {
    if (t.type === "income") continue;
    const k = t.transaction_date.slice(0, 7);
    buckets.set(k, (buckets.get(k) || 0) + Number(t.amount || 0));
  }
  const arr = [...buckets.values()];
  if (arr.length < 2) {
    return { key: "spending_stability", label: "Spending Stability", score: 60, weight: 0.1, detail: "Limited history", status: "neutral" };
  }
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  const s = clamp(100 - cv * 100);
  return {
    key: "spending_stability", label: "Spending Stability", score: s, weight: 0.1,
    detail: `${(cv * 100).toFixed(0)}% month-to-month swing`,
    status: cv < 0.2 ? "good" : cv < 0.4 ? "warn" : "bad",
  };
}

function scoreEmergencyFund(goals: Goal[], avgMonthlyExpense: number): FactorScore {
  // Emergency fund = goals tagged emergency OR sum of liquid goals.
  const ef = goals.filter((g) => /emerg|safety|rainy/i.test(g.goal_name) || /emerg/i.test(g.category || ""));
  const cur = sumBy(ef, (g) => Number(g.current_amount || 0));
  if (avgMonthlyExpense <= 0) {
    return { key: "emergency_fund", label: "Emergency Fund", score: 50, weight: 0.12, detail: "Unknown expenses", status: "neutral" };
  }
  const months = cur / avgMonthlyExpense;
  let s = 0;
  if (months >= 6) s = 100;
  else if (months >= 3) s = 70 + (months - 3) * 10;
  else if (months >= 1) s = 35 + (months - 1) * 17.5;
  else s = months * 35;
  return {
    key: "emergency_fund", label: "Emergency Fund", score: clamp(s), weight: 0.12,
    detail: `${months.toFixed(1)} months covered`,
    status: months >= 3 ? "good" : months >= 1 ? "warn" : "bad",
  };
}

function scoreSubscriptionHealth(txs: Tx[], income30: number): FactorScore {
  const subs = txs.filter((t) => t.type !== "income" && t.recurring);
  const total = sumBy(subs, (t) => Number(t.amount || 0));
  if (income30 <= 0) {
    return { key: "subscriptions", label: "Subscription Health", score: 70, weight: 0.07, detail: subs.length ? `${subs.length} recurring` : "No subscriptions", status: "neutral" };
  }
  const pct = (total / income30) * 100;
  let s = 100;
  if (pct > 30) s = 20;
  else if (pct > 20) s = 45;
  else if (pct > 10) s = 70;
  else if (pct > 5) s = 88;
  return {
    key: "subscriptions", label: "Subscription Health", score: s, weight: 0.07,
    detail: `${pct.toFixed(1)}% of income on subscriptions`,
    status: pct < 10 ? "good" : pct < 20 ? "warn" : "bad",
  };
}

function scoreDebtRatio(txs: Tx[], income30: number): FactorScore {
  const debt = txs.filter((t) => t.type !== "income" && /(loan|emi|credit|debt|mortgage|repay)/i.test(`${t.title} ${t.category ?? ""}`));
  const total = sumBy(debt, (t) => Number(t.amount || 0));
  if (income30 <= 0) {
    return { key: "debt_ratio", label: "Debt Ratio", score: 70, weight: 0.1, detail: "No income data", status: "neutral" };
  }
  if (total === 0) {
    return { key: "debt_ratio", label: "Debt Ratio", score: 95, weight: 0.1, detail: "No debt detected", status: "good" };
  }
  const pct = (total / income30) * 100;
  let s = 100;
  if (pct > 40) s = 15;
  else if (pct > 30) s = 35;
  else if (pct > 20) s = 55;
  else if (pct > 10) s = 78;
  return {
    key: "debt_ratio", label: "Debt Ratio", score: s, weight: 0.1,
    detail: `${pct.toFixed(1)}% of income to debt`,
    status: pct < 20 ? "good" : pct < 35 ? "warn" : "bad",
  };
}

// ─── main ───────────────────────────────────────────────────────────────────

export function computeHealthScore(opts: {
  transactions: Tx[];
  goals: Goal[];
  budgets: Budget[];
}): HealthScore {
  const { transactions, goals, budgets } = opts;
  const now = new Date().toISOString().slice(0, 10);
  const t30 = txInRange(transactions, isoDaysAgo(30), now);
  const t60 = txInRange(transactions, isoDaysAgo(60), isoDaysAgo(30));

  const income30 = sumBy(t30.filter((t) => t.type === "income"), (t) => Number(t.amount || 0));
  const expense30 = sumBy(t30.filter((t) => t.type !== "income"), (t) => Number(t.amount || 0));

  const factors: FactorScore[] = [
    scoreSavingsRate(income30, expense30),
    scoreBudgetAdherence(budgets),
    scoreGoalProgress(goals),
    scoreIncomeStability(transactions),
    scoreSpendingStability(transactions),
    scoreEmergencyFund(goals, expense30),
    scoreSubscriptionHealth(t30, income30),
    scoreDebtRatio(t30, income30),
  ];

  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const score = Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight);

  // Prior-month score for monthlyChange
  const inc60 = sumBy(t60.filter((t) => t.type === "income"), (t) => Number(t.amount || 0));
  const exp60 = sumBy(t60.filter((t) => t.type !== "income"), (t) => Number(t.amount || 0));
  const priorFactors = [scoreSavingsRate(inc60, exp60), scoreSpendingStability(transactions)];
  const priorScore = Math.round(priorFactors.reduce((s, f) => s + f.score * f.weight, 0) / priorFactors.reduce((s, f) => s + f.weight, 0));
  const monthlyChange = score - priorScore;

  // 6-month trend
  const trend: { date: string; score: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const end = new Date(); end.setMonth(end.getMonth() - i);
    const endISO = end.toISOString().slice(0, 10);
    const start = new Date(end); start.setDate(start.getDate() - 30);
    const startISO = start.toISOString().slice(0, 10);
    const tt = txInRange(transactions, startISO, endISO);
    const inc = sumBy(tt.filter((t) => t.type === "income"), (t) => Number(t.amount || 0));
    const exp = sumBy(tt.filter((t) => t.type !== "income"), (t) => Number(t.amount || 0));
    const sav = scoreSavingsRate(inc, exp);
    const sub = scoreSubscriptionHealth(tt, inc);
    const stab = scoreSpendingStability(transactions);
    const monthScore = Math.round((sav.score * 0.5 + sub.score * 0.2 + stab.score * 0.3));
    trend.push({ date: endISO.slice(0, 7), score: monthScore });
  }

  const grade: Grade = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : "Poor";

  const recommendations: string[] = [];
  const worst = [...factors].sort((a, b) => a.score - b.score).slice(0, 3);
  for (const w of worst) {
    if (w.score >= 80) continue;
    if (w.key === "savings_rate") recommendations.push(`Lift savings rate above 20% — target ₹${Math.round((income30 * 0.2 - (income30 - expense30)) || 0).toLocaleString("en-IN")} more saved next month.`);
    else if (w.key === "budget_adherence") recommendations.push("Tighten breached category budgets or raise the limit if expenses are unavoidable.");
    else if (w.key === "goal_progress") recommendations.push("Automate a weekly contribution to your top goal to keep momentum.");
    else if (w.key === "income_stability") recommendations.push("Diversify income — explore a secondary or recurring revenue stream.");
    else if (w.key === "spending_stability") recommendations.push("Cap discretionary spending to a steady monthly amount.");
    else if (w.key === "emergency_fund") recommendations.push("Build emergency fund toward 3–6 months of expenses.");
    else if (w.key === "subscriptions") recommendations.push("Audit recurring subscriptions — cancel anything unused in 30 days.");
    else if (w.key === "debt_ratio") recommendations.push("Prioritize high-interest debt payoff before discretionary spend.");
  }

  return { score, grade, factors, monthlyChange, trend, recommendations };
}

export const gradeColor = (g: Grade) =>
  g === "Excellent" ? "#10b981" : g === "Good" ? "#22c55e" : g === "Fair" ? "#f59e0b" : "#ef4444";
