// AI Automation Engine — evaluates IF/THEN rules against real Supabase data.
import { supabase } from "@/integrations/supabase/client";

export type ConditionType =
  | "category_spend" | "merchant_spend" | "income_received" | "goal_progress"
  | "savings_rate" | "budget_usage" | "subscription_charge" | "cash_balance"
  | "transaction_amount" | "date_time";

export type ActionType =
  | "send_notification" | "create_goal" | "increase_budget" | "reduce_budget"
  | "suggest_savings" | "generate_report" | "trigger_ai_analysis"
  | "create_reminder" | "email_summary" | "push_alert";

export type Operator = ">" | ">=" | "<" | "<=" | "==";
export type Period = "day" | "week" | "month";

export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  is_prebuilt: boolean;
  prebuilt_key: string | null;
  condition_type: ConditionType;
  condition_config: Record<string, unknown>;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  tier: "free" | "pro" | "elite";
  trigger_count: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  user_id: string;
  rule_id: string | null;
  rule_name: string;
  trigger_reason: string;
  action_taken: string;
  result: string;
  severity: "info" | "success" | "warn" | "critical";
  amount_saved: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Tx { id: string; title: string; amount: number; type: string; category: string | null; transaction_date: string; recurring?: boolean | null }
export interface GoalRow { id: string; goal_name: string; target_amount: number; current_amount: number }
export interface BudgetRow { id: string; category: string; monthly_limit: number; spent_amount: number; month: string }

export interface EngineContext {
  userId: string;
  transactions: Tx[];
  goals: GoalRow[];
  budgets: BudgetRow[];
  monthlyIncome: number;
}

// ===== Condition Catalog (for builder UI) =====
export const CONDITIONS: { type: ConditionType; label: string; description: string }[] = [
  { type: "category_spend", label: "Category Spend", description: "Spent more than X on a category in a period." },
  { type: "merchant_spend", label: "Merchant Spend", description: "Cumulative spend at a merchant exceeds threshold." },
  { type: "income_received", label: "Income Received", description: "Income transaction over X received." },
  { type: "goal_progress", label: "Goal Progress", description: "A goal crossed a progress threshold." },
  { type: "savings_rate", label: "Savings Rate", description: "Monthly savings rate compared to a target." },
  { type: "budget_usage", label: "Budget Usage", description: "Budget consumption hits a percentage." },
  { type: "subscription_charge", label: "Subscription Charge", description: "Recurring subscription charge detected." },
  { type: "cash_balance", label: "Cash Balance", description: "Net balance compared to a threshold." },
  { type: "transaction_amount", label: "Transaction Amount", description: "Any transaction above threshold." },
  { type: "date_time", label: "Date / Time", description: "Triggers on day of week or month." },
];

export const ACTIONS: { type: ActionType; label: string; description: string }[] = [
  { type: "send_notification", label: "Send Notification", description: "In-app alert." },
  { type: "push_alert", label: "Push Alert", description: "Critical notification." },
  { type: "create_goal", label: "Create Goal", description: "Auto-create a savings goal." },
  { type: "increase_budget", label: "Increase Budget", description: "Raise category budget." },
  { type: "reduce_budget", label: "Reduce Budget", description: "Lower category budget." },
  { type: "suggest_savings", label: "Suggest Savings", description: "Recommend transferring to savings." },
  { type: "generate_report", label: "Generate Report", description: "Trigger PDF report." },
  { type: "trigger_ai_analysis", label: "Trigger AI Analysis", description: "Run AI Coach analysis." },
  { type: "create_reminder", label: "Create Reminder", description: "Reminder for upcoming event." },
  { type: "email_summary", label: "Email Summary", description: "Send a summary email." },
];

// ===== Prebuilt Library =====
export interface PrebuiltDef {
  key: string;
  name: string;
  description: string;
  tier: "pro" | "elite";
  condition_type: ConditionType;
  condition_config: Record<string, unknown>;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  emoji: string;
}

export const PREBUILTS: PrebuiltDef[] = [
  { key: "budget_guardian", name: "Budget Guardian", description: "Alerts when any budget exceeds 80%.", tier: "pro", emoji: "🛡️", condition_type: "budget_usage", condition_config: { operator: ">=", percent: 80 }, action_type: "send_notification", action_config: { severity: "warn", message: "Budget exceeds 80%" } },
  { key: "savings_booster", name: "Savings Booster", description: "Suggests savings allocation when income arrives.", tier: "pro", emoji: "💰", condition_type: "income_received", condition_config: { min_amount: 1000, period: "month" }, action_type: "suggest_savings", action_config: { percent: 20 } },
  { key: "goal_accelerator", name: "Goal Accelerator", description: "Recommends contributing surplus to active goals.", tier: "pro", emoji: "🎯", condition_type: "savings_rate", condition_config: { operator: ">=", percent: 25 }, action_type: "trigger_ai_analysis", action_config: { topic: "goal_contribution" } },
  { key: "subscription_watcher", name: "Subscription Watcher", description: "Creates alerts for detected recurring charges.", tier: "pro", emoji: "🔁", condition_type: "subscription_charge", condition_config: {}, action_type: "send_notification", action_config: { severity: "info", message: "Recurring subscription detected" } },
  { key: "bill_reminder", name: "Bill Reminder", description: "Reminds you on the 1st of each month about bills.", tier: "pro", emoji: "🔔", condition_type: "date_time", condition_config: { day_of_month: 1 }, action_type: "create_reminder", action_config: { topic: "bills" } },
  { key: "debt_reduction", name: "Debt Reduction Assistant", description: "Triggers payoff strategy when expenses > 70% income.", tier: "elite", emoji: "📉", condition_type: "savings_rate", condition_config: { operator: "<", percent: 10 }, action_type: "trigger_ai_analysis", action_config: { topic: "debt_payoff" } },
  { key: "spike_detector", name: "Spending Spike Detection", description: "Alerts when category spending grows 30%+ vs baseline.", tier: "pro", emoji: "📈", condition_type: "category_spend", condition_config: { operator: ">", multiplier: 1.3, period: "week" }, action_type: "send_notification", action_config: { severity: "critical", message: "Spending spike detected" } },
  { key: "investment_opportunity", name: "Investment Opportunity Detector", description: "Flags idle cash for investment.", tier: "elite", emoji: "📊", condition_type: "cash_balance", condition_config: { operator: ">", amount: 50000 }, action_type: "suggest_savings", action_config: { kind: "investment" } },
  { key: "weekly_digest", name: "Weekly Financial Digest", description: "Generates a weekly summary every Sunday.", tier: "pro", emoji: "📰", condition_type: "date_time", condition_config: { day_of_week: 0 }, action_type: "email_summary", action_config: { period: "week" } },
  { key: "monthly_review", name: "Monthly Financial Review", description: "Executive report at end of every month.", tier: "elite", emoji: "📑", condition_type: "date_time", condition_config: { day_of_month: 28 }, action_type: "generate_report", action_config: { kind: "monthly" } },
];

// ===== Engine helpers =====
const periodStart = (period: Period): number => {
  const d = new Date();
  if (period === "day") d.setHours(0, 0, 0, 0);
  if (period === "week") d.setDate(d.getDate() - 7);
  if (period === "month") d.setDate(d.getDate() - 30);
  return d.getTime();
};

const cmp = (op: Operator, a: number, b: number): boolean => {
  switch (op) { case ">": return a > b; case ">=": return a >= b; case "<": return a < b; case "<=": return a <= b; case "==": return a === b; }
};

interface EvalResult { fired: boolean; reason: string; amount_saved?: number; meta?: Record<string, unknown>; }

export function evaluateRule(rule: AutomationRule, ctx: EngineContext): EvalResult {
  const cfg = rule.condition_config as Record<string, unknown>;
  const op = (cfg.operator as Operator) || ">";
  switch (rule.condition_type) {
    case "category_spend": {
      const category = String(cfg.category || "");
      const period = (cfg.period as Period) || "week";
      const since = periodStart(period);
      const spent = ctx.transactions.filter(t => t.type === "expense" && (!category || t.category === category) && new Date(t.transaction_date).getTime() >= since).reduce((s, t) => s + Number(t.amount), 0);
      if (cfg.multiplier) {
        // baseline = prior period
        const prevSince = since - (period === "week" ? 7 : period === "month" ? 30 : 1) * 86400000;
        const baseline = ctx.transactions.filter(t => t.type === "expense" && (!category || t.category === category) && new Date(t.transaction_date).getTime() >= prevSince && new Date(t.transaction_date).getTime() < since).reduce((s, t) => s + Number(t.amount), 0);
        if (baseline > 0 && spent / baseline >= Number(cfg.multiplier)) {
          return { fired: true, reason: `${category || "Total"} spend ${spent.toFixed(0)} is ${(spent / baseline).toFixed(1)}× baseline ${baseline.toFixed(0)}.`, meta: { spent, baseline } };
        }
        return { fired: false, reason: "" };
      }
      const amount = Number(cfg.amount || 0);
      if (cmp(op, spent, amount)) return { fired: true, reason: `${category || "Total"} spend ${spent.toFixed(0)} ${op} ${amount} this ${period}.`, meta: { spent } };
      return { fired: false, reason: "" };
    }
    case "merchant_spend": {
      const merchant = String(cfg.merchant || "").toLowerCase();
      const period = (cfg.period as Period) || "month";
      const since = periodStart(period);
      const spent = ctx.transactions.filter(t => t.type === "expense" && t.title.toLowerCase().includes(merchant) && new Date(t.transaction_date).getTime() >= since).reduce((s, t) => s + Number(t.amount), 0);
      const amount = Number(cfg.amount || 0);
      if (cmp(op, spent, amount)) return { fired: true, reason: `${merchant} spend ${spent.toFixed(0)} ${op} ${amount}.`, meta: { spent } };
      return { fired: false, reason: "" };
    }
    case "income_received": {
      const period = (cfg.period as Period) || "month";
      const since = periodStart(period);
      const min = Number(cfg.min_amount || 0);
      const incomes = ctx.transactions.filter(t => t.type === "income" && Number(t.amount) >= min && new Date(t.transaction_date).getTime() >= since);
      if (incomes.length) {
        const total = incomes.reduce((s, t) => s + Number(t.amount), 0);
        return { fired: true, reason: `Income of ${total.toFixed(0)} received this ${period}.`, meta: { total } };
      }
      return { fired: false, reason: "" };
    }
    case "goal_progress": {
      const percent = Number(cfg.percent || 50);
      const target = ctx.goals.find(g => Number(g.target_amount) > 0 && (g.current_amount / g.target_amount) * 100 >= percent);
      if (target) return { fired: true, reason: `Goal "${target.goal_name}" reached ${Math.round((target.current_amount / target.target_amount) * 100)}%.`, meta: { goal_id: target.id } };
      return { fired: false, reason: "" };
    }
    case "savings_rate": {
      const exp = ctx.transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      const inc = ctx.monthlyIncome || ctx.transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const rate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;
      const target = Number(cfg.percent || 20);
      if (cmp(op, rate, target)) return { fired: true, reason: `Savings rate ${rate.toFixed(0)}% ${op} ${target}%.`, meta: { rate } };
      return { fired: false, reason: "" };
    }
    case "budget_usage": {
      const category = String(cfg.category || "");
      const percent = Number(cfg.percent || 80);
      for (const b of ctx.budgets) {
        if (category && b.category !== category) continue;
        if (Number(b.monthly_limit) <= 0) continue;
        const pct = (Number(b.spent_amount) / Number(b.monthly_limit)) * 100;
        if (cmp(op, pct, percent)) return { fired: true, reason: `Budget "${b.category}" at ${pct.toFixed(0)}% ${op} ${percent}%.`, meta: { category: b.category, pct } };
      }
      return { fired: false, reason: "" };
    }
    case "subscription_charge": {
      const recurring = ctx.transactions.find(t => t.recurring && new Date(t.transaction_date).getTime() >= periodStart("week"));
      if (recurring) return { fired: true, reason: `Recurring charge: ${recurring.title} (${Number(recurring.amount).toFixed(0)}).`, amount_saved: 0, meta: { tx_id: recurring.id } };
      return { fired: false, reason: "" };
    }
    case "cash_balance": {
      const inc = ctx.transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const exp = ctx.transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      const bal = inc - exp;
      const amount = Number(cfg.amount || 0);
      if (cmp(op, bal, amount)) return { fired: true, reason: `Cash balance ${bal.toFixed(0)} ${op} ${amount}.`, meta: { bal } };
      return { fired: false, reason: "" };
    }
    case "transaction_amount": {
      const amount = Number(cfg.amount || 0);
      const big = ctx.transactions.filter(t => new Date(t.transaction_date).getTime() >= periodStart("week")).find(t => cmp(op, Number(t.amount), amount));
      if (big) return { fired: true, reason: `${big.title} ${Number(big.amount).toFixed(0)} ${op} ${amount}.`, meta: { tx_id: big.id } };
      return { fired: false, reason: "" };
    }
    case "date_time": {
      const now = new Date();
      const dow = cfg.day_of_week, dom = cfg.day_of_month;
      if (dow !== undefined && dow !== null && Number(dow) === now.getDay()) return { fired: true, reason: `Day-of-week matched (${now.toLocaleDateString("en", { weekday: "long" })}).` };
      if (dom !== undefined && dom !== null && Number(dom) === now.getDate()) return { fired: true, reason: `Day-of-month matched (${now.getDate()}).` };
      return { fired: false, reason: "" };
    }
  }
}

export function describeAction(rule: AutomationRule): string {
  const cfg = rule.action_config as Record<string, unknown>;
  switch (rule.action_type) {
    case "send_notification": return `Sent notification: ${cfg.message || rule.name}`;
    case "push_alert": return `Pushed alert: ${cfg.message || rule.name}`;
    case "create_goal": return `Created goal "${cfg.name || rule.name}"`;
    case "increase_budget": return `Raised budget for ${cfg.category || "category"} by ${cfg.amount || "10%"}`;
    case "reduce_budget": return `Reduced budget for ${cfg.category || "category"} by ${cfg.amount || "10%"}`;
    case "suggest_savings": return `Suggested ${cfg.percent || 20}% savings transfer`;
    case "generate_report": return `Generated ${cfg.kind || "monthly"} report`;
    case "trigger_ai_analysis": return `Triggered AI analysis (${cfg.topic || "general"})`;
    case "create_reminder": return `Created reminder (${cfg.topic || "event"})`;
    case "email_summary": return `Emailed ${cfg.period || "weekly"} summary`;
  }
}

// ===== Run engine: evaluate all enabled rules, write logs for newly fired, update counts. =====
export async function runAutomationEngine(rules: AutomationRule[], ctx: EngineContext): Promise<AutomationLog[]> {
  const newLogs: Omit<AutomationLog, "id" | "created_at">[] = [];
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const result = evaluateRule(rule, ctx);
    if (!result.fired) continue;
    // Dedup: skip if same rule fired in last 12h with same reason
    const lastFire = rule.last_triggered_at ? new Date(rule.last_triggered_at).getTime() : 0;
    if (Date.now() - lastFire < 12 * 3600 * 1000) continue;
    newLogs.push({
      user_id: ctx.userId,
      rule_id: rule.id,
      rule_name: rule.name,
      trigger_reason: result.reason,
      action_taken: describeAction(rule),
      result: "success",
      severity: rule.action_type === "push_alert" ? "critical" : rule.action_type === "send_notification" ? "warn" : "info",
      amount_saved: result.amount_saved ?? 0,
      metadata: result.meta || {},
    });
  }
  if (newLogs.length === 0) return [];
  const { data, error } = await supabase.from("automation_logs").insert(newLogs as never).select();
  if (error) throw error;
  // Update rule trigger counts
  for (const log of newLogs) {
    if (!log.rule_id) continue;
    const r = rules.find(x => x.id === log.rule_id);
    if (!r) continue;
    await supabase.from("automation_rules").update({ trigger_count: r.trigger_count + 1, last_triggered_at: new Date().toISOString() }).eq("id", log.rule_id);
  }
  return data as AutomationLog[];
}
