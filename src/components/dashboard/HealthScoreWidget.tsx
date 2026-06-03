// Phase 4 — Financial Health Score widget
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, ArrowDownRight, ArrowUpRight, Heart, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { computeHealthScore, gradeColor } from "@/lib/financialHealth";
import type { Tx, Goal, Budget } from "@/components/dashboard/CommandCenter";

interface Props {
  transactions: Tx[];
  goals: Goal[];
  budgets: Budget[];
}

const HealthScoreWidget: React.FC<Props> = ({ transactions, goals, budgets }) => {
  const health = useMemo(
    () => computeHealthScore({ transactions, goals, budgets }),
    [transactions, goals, budgets],
  );

  const gColor = gradeColor(health.grade);

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heart size={18} style={{ color: gColor }} />
            <h3 className="font-display text-lg font-bold text-gray-900">Financial Health</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Live score across 8 factors</p>
        </div>
        <div
          className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1`}
          style={{ background: `${gColor}15`, color: gColor }}
        >
          {health.monthlyChange >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {health.monthlyChange >= 0 ? "+" : ""}{health.monthlyChange} this month
        </div>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <ScoreRing score={health.score} color={gColor} />
        <div>
          <p className="text-3xl font-display font-bold" style={{ color: gColor }}>
            {health.grade}
          </p>
          <p className="text-xs text-gray-500 mt-1">{health.score}/100 overall</p>
        </div>
      </div>

      {/* Trend */}
      <div className="h-24 -mx-2 mb-5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={health.trend}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }}
              formatter={(v: any) => [`${v}/100`, "Score"]}
            />
            <Line type="monotone" dataKey="score" stroke={gColor} strokeWidth={2.5} dot={{ r: 3, fill: gColor }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Factors */}
      <div className="space-y-2 mb-4">
        {health.factors.map((f) => {
          const fc = f.status === "good" ? "#10b981" : f.status === "warn" ? "#f59e0b" : f.status === "bad" ? "#ef4444" : "#94a3b8";
          return (
            <div key={f.key} className="flex items-center gap-3 text-xs">
              <div className="w-32 truncate text-gray-700 font-medium">{f.label}</div>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${f.score}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full rounded-full"
                  style={{ background: fc }}
                />
              </div>
              <div className="w-10 text-right tabular-nums text-gray-500">{Math.round(f.score)}</div>
            </div>
          );
        })}
      </div>

      {!!health.recommendations.length && (
        <div className="mt-4 p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
          <div className="flex items-center gap-1.5 mb-2 text-indigo-700 text-xs font-semibold">
            <Sparkles size={12} /> Recommendations
          </div>
          <ul className="space-y-1.5">
            {health.recommendations.slice(0, 3).map((r, i) => (
              <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                <span className="text-indigo-400">→</span>{r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ScoreRing: React.FC<{ score: number; color: string }> = ({ score, color }) => {
  const R = 38;
  const C = 2 * Math.PI * R;
  const off = C - (score / 100) * C;
  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
        <circle cx="48" cy="48" r={R} stroke="#f1f5f9" strokeWidth="8" fill="none" />
        <motion.circle
          cx="48" cy="48" r={R} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
          initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: off }} transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: C }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-display font-bold text-gray-900 tabular-nums">{score}</div>
          <div className="text-[9px] text-gray-400 uppercase tracking-wider">score</div>
        </div>
      </div>
    </div>
  );
};

export default HealthScoreWidget;
