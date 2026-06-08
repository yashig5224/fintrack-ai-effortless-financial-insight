// Premium subscription card for the dashboard overview.
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Sparkles, Zap, Calendar, ArrowRight } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface Props { onUpgrade: () => void; }

export default function SubscriptionCard({ onUpgrade }: Props) {
  const { subscription, tier, loading } = useSubscription();

  if (loading) return null;

  const meta =
    tier === "elite" ? { name: "Elite AI+", Icon: Crown, gradient: "from-violet-600 via-fuchsia-500 to-pink-500", subtitle: "Premium financial intelligence" } :
    tier === "pro"   ? { name: "Pro AI",    Icon: Zap,   gradient: "from-indigo-600 via-blue-500 to-cyan-500",  subtitle: "Smart AI-powered finance" } :
                       { name: "Starter",   Icon: Sparkles, gradient: "from-slate-700 via-slate-800 to-slate-900", subtitle: "Get the basics in motion" };

  const renewal = subscription?.renewal_date || subscription?.current_period_end;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl p-5 text-white shadow-xl shadow-slate-900/10 bg-gradient-to-r ${meta.gradient}`}
    >
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            <meta.Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">Current plan</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-white/20 backdrop-blur">{meta.name}</span>
              {subscription?.cancel_at_period_end && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-300/30">Cancelling</span>}
              {subscription?.pending_plan_change && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-300/30 capitalize">→ {subscription.pending_plan_change}</span>}
            </div>
            <p className="font-display text-lg font-bold leading-tight mt-0.5">{meta.subtitle}</p>
            {renewal && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-white/80">
                <Calendar className="w-3 h-3" />
                <span>
                  {subscription?.cancel_at_period_end ? "Ends" : "Renews"} {new Date(renewal).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-auto">
          {tier !== "elite" && (
            <button onClick={onUpgrade} className="px-3 py-2 text-xs font-semibold rounded-xl bg-white text-slate-900 hover:bg-white/90 transition shadow-md inline-flex items-center gap-1.5">
              Upgrade Plan <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <Link to="/billing">
            <button className="px-3 py-2 text-xs font-semibold rounded-xl bg-white/15 backdrop-blur hover:bg-white/25 transition border border-white/20">
              Manage
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
