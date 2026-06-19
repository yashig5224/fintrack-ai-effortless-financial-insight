// Phase 9 — Goal Intelligence display
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Sparkles, Calendar, Zap } from "lucide-react";
import { computeGoalIntelligence, type GoalIntel } from "@/lib/goalIntelligence";
import type { Tx, Goal } from "@/components/dashboard/CommandCenter";

interface Props {
  transactions: Tx[];
  goals: Goal[];
  currency?: string;
  onContribute?: (goalId: string, amount: number) => void;
}

const fmt = (n: number, c = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(Math.round(n));

const statusMeta: Record<GoalIntel["status"], { label: string; color: string; bg: string; icon: any }> = {
  on_track:  { label: "On track",  color: "#10b981", bg: "#10b98115", icon: CheckCircle2 },
  at_risk:   { label: "At risk",   color: "#f59e0b", bg: "#f59e0b15", icon: AlertTriangle },
  off_track: { label: "Off track", color: "#ef4444", bg: "#ef444415", icon: AlertTriangle },
  stalled:   { label: "Stalled",   color: "#64748b", bg: "#64748b15", icon: AlertTriangle },
  completed: { label: "Done",      color: "#6366f1", bg: "#6366f115", icon: CheckCircle2 },
};

const GoalIntelligencePanel: React.FC<Props> = ({ transactions, goals, currency = "INR", onContribute }) => {
  const intel = useMemo(() => computeGoalIntelligence({ transactions, goals }), [transactions, goals]);

  if (!intel.length) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-500" />
          <h3 className="font-display text-lg font-bold text-gray-900">Goal Intelligence</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{intel.length} goals</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {intel.map((g) => {
          const meta = statusMeta[g.status];
          const Icon = meta.icon;
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    <Target size={10} /> {g.category || "Goal"}
                  </div>
                  <h4 className="font-display text-base font-bold text-gray-900 truncate">{g.name}</h4>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold inline-flex items-center gap-1"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  <Icon size={10} /> {meta.label}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-bold text-gray-900 tabular-nums">{fmt(g.current, currency)}</span>
                <span className="text-xs text-gray-500">of {fmt(g.target, currency)}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${g.progressPct}%` }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}80)` }}
                />
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Metric
                  icon={<Calendar size={11} />} label="ETA"
                  value={g.predictedEtaMonths === null ? "—" : g.predictedEtaMonths === 0 ? "Done" : `${g.predictedEtaMonths}mo`}
                />
                <Metric
                  icon={<TrendingUp size={11} />} label="Required"
                  value={g.requiredMonthly === null ? "—" : `${fmt(g.requiredMonthly, currency)}/mo`}
                />
                <Metric
                  icon={<Zap size={11} />} label="Success"
                  value={`${Math.round(g.successProbability * 100)}%`}
                  color={g.successProbability > 0.7 ? "#10b981" : g.successProbability > 0.4 ? "#f59e0b" : "#ef4444"}
                />
              </div>

              {/* Risk meter */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1">
                  <span>Risk score</span><span className="tabular-nums">{g.riskScore}/100</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${g.riskScore}%`,
                      background: g.riskScore < 30 ? "#10b981" : g.riskScore < 70 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
              </div>

              {/* Suggestions */}
              {!!g.warnings.length && (
                <div className="mb-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                  {g.warnings.slice(0, 1).map((w, i) => (
                    <p key={i} className="text-[11px] text-amber-900 leading-snug">⚠ {w}</p>
                  ))}
                </div>
              )}
              {!!g.accelerations.length && (
                <div className="mb-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  {g.accelerations.slice(0, 1).map((a, i) => (
                    <p key={i} className="text-[11px] text-emerald-900 leading-snug">⚡ {a}</p>
                  ))}
                </div>
              )}
              {!!g.funding.length && (
                <div className="mb-2 p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                  {g.funding.slice(0, 1).map((f, i) => (
                    <p key={i} className="text-[11px] text-indigo-900 leading-snug">💡 {f}</p>
                  ))}
                </div>
              )}

              {onContribute && g.status !== "completed" && (
                <button
                  onClick={() => {
                    const suggested = g.requiredMonthly && g.requiredMonthly > 0
                      ? Math.round(g.requiredMonthly)
                      : Math.max(500, Math.round(g.monthlyCapacity));
                    const v = window.prompt(`Add contribution to "${g.name}"`, String(suggested));
                    const n = Number(v); if (n > 0) onContribute(g.id, n);
                  }}
                  className="mt-2 w-full text-xs font-semibold py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800"
                >
                  + Contribute
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string; color?: string }> = ({
  icon, label, value, color,
}) => (
  <div className="p-2 rounded-xl bg-white border border-gray-100">
    <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">
      {icon}{label}
    </div>
    <div className="text-xs font-bold tabular-nums truncate" style={{ color: color || "#0f172a" }}>{value}</div>
  </div>
);

export default GoalIntelligencePanel;
