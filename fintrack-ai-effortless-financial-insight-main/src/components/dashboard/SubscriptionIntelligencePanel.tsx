// Phase 8 — Subscription Intelligence Panel
// Displays detected recurring charges, duplicates, unused subscriptions,
// price hikes, and savings opportunities — all from real Supabase transactions.

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Repeat, AlertTriangle, TrendingUp, Sparkles, XCircle, Copy, Zap, Calendar
} from "lucide-react";
import { computeSubscriptionIntelligence } from "@/lib/subscriptionIntelligence";
import type { Tx } from "@/components/dashboard/CommandCenter";

interface Props {
  transactions: Tx[];
  currency?: string;
  onCancel?: (subName: string) => void;
}

const fmt = (n: number, c = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(Math.round(Math.abs(n)));

export default function SubscriptionIntelligencePanel({ transactions, currency = "INR", onCancel }: Props) {
  const intel = useMemo(() => computeSubscriptionIntelligence(transactions), [transactions]);
  const { subscriptions, duplicates, opportunities, totals } = intel;

  if (subscriptions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Repeat className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Subscription Intelligence</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No recurring charges detected yet. As you log more transactions, Lumo will surface subscriptions, duplicates, and savings opportunities here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Monthly Cost" value={fmt(totals.monthly, currency)} icon={<Calendar className="h-4 w-4" />} tone="primary" />
        <KPI label="Yearly Cost" value={fmt(totals.yearly, currency)} icon={<TrendingUp className="h-4 w-4" />} tone="primary" />
        <KPI label="Active" value={`${totals.activeCount}`} sub={`${totals.unusedCount} unused`} icon={<Repeat className="h-4 w-4" />} tone="muted" />
        <KPI label="You can save" value={fmt(totals.potentialMonthlySavings, currency)} sub={`${fmt(totals.potentialYearlySavings, currency)} / yr`} icon={<Sparkles className="h-4 w-4" />} tone="positive" />
      </div>

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Savings Opportunities</h3>
            <span className="ml-auto text-xs text-muted-foreground">{opportunities.length} suggestion{opportunities.length > 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-2">
            {opportunities.slice(0, 6).map((op, i) => {
              const tone =
                op.severity === "critical" ? "border-destructive/40 bg-destructive/5" :
                op.severity === "warning" ? "border-amber-300/40 bg-amber-50/40" :
                "border-border bg-muted/30";
              const Icon = op.kind === "duplicate" ? Copy : op.kind === "unused" ? XCircle : op.kind === "price_hike" ? TrendingUp : Zap;
              return (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`rounded-xl border p-3 flex items-start gap-3 ${tone}`}
                >
                  <div className="mt-0.5 rounded-lg bg-background border border-border p-2">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{op.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{op.detail}</div>
                  </div>
                  {op.monthlySavings > 0 && (
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-emerald-600">+{fmt(op.monthlySavings, currency)}</div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">per month</div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subscriptions list */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Repeat className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Detected Subscriptions</h3>
          <span className="ml-auto text-xs text-muted-foreground">{subscriptions.length} recurring</span>
        </div>
        <div className="divide-y divide-border">
          {subscriptions.map(s => (
            <div key={s.id} className="py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{s.name}</span>
                  {s.unused && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">UNUSED</span>
                  )}
                  {s.priceIncreased && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">+{s.priceChangePct}%</span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{s.confidence}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {s.category || "Uncategorized"} · every ~{s.cadenceDays}d · {s.count} charges · last {s.lastSeen}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold">{fmt(s.monthlyCost, currency)}<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
                <div className="text-[11px] text-muted-foreground">{fmt(s.yearlyCost, currency)}/yr</div>
              </div>
              {onCancel && (
                <button
                  onClick={() => onCancel(s.name)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-destructive/10"
                  title="Mark as cancelled"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Duplicates */}
      {duplicates.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Copy className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold">Duplicate / Overlapping Services</h3>
          </div>
          <div className="space-y-3">
            {duplicates.map(d => (
              <div key={d.key} className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {d.subs.map(s => (
                    <span key={s.id} className="text-xs px-2 py-1 rounded-md bg-muted">{s.name}</span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Total {fmt(d.totalMonthly, currency)}/mo · potential savings <span className="text-emerald-600 font-semibold">{fmt(d.potentialSavings, currency)}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({
  label, value, sub, icon, tone,
}: { label: string; value: string; sub?: string; icon: React.ReactNode; tone: "primary" | "muted" | "positive" }) {
  const toneCls =
    tone === "positive" ? "from-emerald-500/10 to-emerald-500/0 border-emerald-200" :
    tone === "primary" ? "from-primary/10 to-primary/0 border-primary/20" :
    "from-muted to-transparent border-border";
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${toneCls} p-4`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
