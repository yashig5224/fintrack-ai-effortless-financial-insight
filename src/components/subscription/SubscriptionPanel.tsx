// Subscription & Billing settings panel.
// All data derived from Supabase `subscriptions` + `profiles` + `payments`
// and live tables (ai_history, automation_rules) for usage.

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Sparkles, Zap, Calendar, CreditCard, AlertCircle, Loader2,
  X, ArrowRight, Check, MessageSquare, Mic, FileText, Bot, TrendingUp, Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, type PlanTier } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  profile: any;
  onUpgrade: () => void;
}

const PLAN_META: Record<PlanTier, { name: string; icon: any; gradient: string; aiLimit: string; voice: string; reports: string; automations: string }> = {
  free:  { name: "Starter",   icon: Sparkles, gradient: "from-slate-700 to-slate-900",        aiLimit: "10 chats / day", voice: "—",                 reports: "Basic",        automations: "Limited" },
  pro:   { name: "Pro AI",    icon: Zap,      gradient: "from-indigo-500 to-blue-500",        aiLimit: "Unlimited",      voice: "Voice Coach",       reports: "Advanced + PDF/CSV", automations: "Advanced" },
  elite: { name: "Elite AI+", icon: Crown,    gradient: "from-violet-500 to-fuchsia-500",     aiLimit: "Unlimited + priority", voice: "Full Voice AI", reports: "Executive AI reports", automations: "Unlimited" },
};

const ORDER: PlanTier[] = ["free", "pro", "elite"];

export default function SubscriptionPanel({ profile, onUpgrade }: Props) {
  const { user } = useAuth();
  const { subscription, tier, loading, refresh } = useSubscription();
  const [usage, setUsage] = useState({ aiChats: 0, automations: 0, pdfReports: 0, voiceMinutes: 0 });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [downgradeOpen, setDowngradeOpen] = useState(false);
  const [downgradeTarget, setDowngradeTarget] = useState<PlanTier>("free");
  const [pendingBusy, setPendingBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    Promise.all([
      supabase.from("ai_history").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since),
      supabase.from("automation_rules").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("enabled", true),
      supabase.from("automation_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since).ilike("action_taken", "%pdf%"),
    ]).then(([ai, rules, pdfs]) => {
      setUsage({
        aiChats: ai.count || 0,
        automations: rules.count || 0,
        pdfReports: pdfs.count || 0,
        voiceMinutes: 0,
      });
    });
  }, [user, subscription]);

  const planMeta = PLAN_META[tier];
  const PlanIcon = planMeta.icon;
  const renewal = subscription?.renewal_date || subscription?.current_period_end;
  const startDate = subscription?.start_date || subscription?.current_period_end;
  const status = !subscription ? "free" : subscription.status;
  const isPaid = tier !== "free";

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase.functions.invoke("cancel-subscription", { body: {} });
      if (error) throw error;
      toast.success("Subscription cancelled — access remains until your renewal date");
      await refresh();
      setCancelOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Could not cancel");
    } finally {
      setCancelling(false);
    }
  };

  const schedulePlanChange = async (target: PlanTier) => {
    if (!subscription) return;
    setPendingBusy(true);
    try {
      const effective = renewal ?? new Date(Date.now() + 30 * 86_400_000).toISOString();
      const { error } = await supabase.from("subscriptions").update({
        pending_plan_change: target,
        pending_plan_change_at: effective,
      }).eq("id", subscription.id);
      if (error) throw error;
      toast.success(`Plan will change to ${PLAN_META[target].name} on ${new Date(effective).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`);
      await refresh();
      setDowngradeOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Could not schedule plan change");
    } finally {
      setPendingBusy(false);
    }
  };

  const cancelPendingChange = async () => {
    if (!subscription) return;
    setPendingBusy(true);
    const { error } = await supabase.from("subscriptions").update({
      pending_plan_change: null, pending_plan_change_at: null,
    }).eq("id", subscription.id);
    setPendingBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Scheduled change cancelled"); refresh(); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900">Subscription & Billing</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your plan, billing cycle, and feature access.</p>
      </div>

      {/* Current plan card */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/30 p-6 shadow-xl shadow-slate-900/5"
      >
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-indigo-300/20 to-violet-300/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${planMeta.gradient} flex items-center justify-center shadow-md shrink-0`}>
              <PlanIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">Current Plan</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{loading ? "…" : planMeta.name}</h3>
                <StatusPill status={status} cancelAtEnd={!!subscription?.cancel_at_period_end} />
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-slate-600">
                {subscription?.billing_cycle && (
                  <Row icon={<CreditCard className="w-3.5 h-3.5" />} label="Billing cycle" value={<span className="capitalize">{subscription.billing_cycle}</span>} />
                )}
                {renewal && (
                  <Row
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    label={subscription?.cancel_at_period_end ? "Ends" : "Next billing"}
                    value={new Date(renewal).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  />
                )}
                {startDate && (
                  <Row icon={<Calendar className="w-3.5 h-3.5" />} label="Started" value={new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
                )}
                {subscription?.payment_id && (
                  <Row icon={<CreditCard className="w-3.5 h-3.5" />} label="Payment" value={<span className="font-mono text-xs">{subscription.payment_id.slice(-10)}</span>} />
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={onUpgrade} className={`px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md shadow-indigo-500/30 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition`}>
              {tier === "elite" ? "Manage Plan" : tier === "free" ? "Upgrade Plan" : "Change Plan"}
            </button>
            <Link to="/billing">
              <button className="w-full px-4 py-2.5 rounded-xl font-medium text-sm text-slate-700 border border-slate-200 hover:bg-white transition">
                Manage Subscription
              </button>
            </Link>
            {isPaid && !subscription?.cancel_at_period_end && (
              <button onClick={() => setCancelOpen(true)} className="text-xs text-rose-600 hover:text-rose-700 mt-1">
                Cancel subscription
              </button>
            )}
          </div>
        </div>

        {/* Scheduled change banner */}
        {subscription?.pending_plan_change && (
          <div className="relative mt-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Your plan will change to <strong className="capitalize">{PLAN_META[subscription.pending_plan_change as PlanTier]?.name}</strong>
              {subscription.pending_plan_change_at ? ` on ${new Date(subscription.pending_plan_change_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}.
            </span>
            <button onClick={cancelPendingChange} disabled={pendingBusy} className="ml-auto text-xs underline hover:no-underline">
              Cancel change
            </button>
          </div>
        )}
        {isPaid && subscription?.cancel_at_period_end && renewal && (
          <div className="relative mt-5 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Your {planMeta.name} plan remains active until {new Date(renewal).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.</span>
          </div>
        )}
      </motion.div>

      {/* Usage summary */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-slate-900">Usage this month</h3>
          <span className="text-xs text-slate-500">Resets monthly</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <UsageCard icon={<MessageSquare className="w-4 h-4" />} label="AI Chats" value={usage.aiChats} limit={tier === "free" ? 300 : Infinity} />
          <UsageCard icon={<Mic className="w-4 h-4" />} label="Voice AI minutes" value={usage.voiceMinutes} limit={tier === "free" ? 0 : tier === "pro" ? 60 : Infinity} locked={tier === "free"} />
          <UsageCard icon={<FileText className="w-4 h-4" />} label="PDF Reports" value={usage.pdfReports} limit={tier === "free" ? 1 : tier === "pro" ? 10 : Infinity} />
          <UsageCard icon={<Bot className="w-4 h-4" />} label="Active Automations" value={usage.automations} limit={tier === "free" ? 1 : tier === "pro" ? 10 : Infinity} />
        </div>
      </div>

      {/* Change plan */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-bold text-slate-900 mb-1">Change Plan</h3>
        <p className="text-sm text-slate-500 mb-4">Switch between plans anytime. Downgrades take effect at your next billing date.</p>
        <div className="grid md:grid-cols-3 gap-3">
          {ORDER.map((t) => {
            const meta = PLAN_META[t];
            const Icon = meta.icon;
            const isCurrent = tier === t;
            const idxCurrent = ORDER.indexOf(tier);
            const idxThis = ORDER.indexOf(t);
            const isDowngrade = idxThis < idxCurrent;
            const isUpgrade = idxThis > idxCurrent;
            return (
              <div key={t} className={`rounded-2xl border p-4 transition ${isCurrent ? "border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-200" : "border-slate-200 hover:border-slate-300"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-900">{meta.name}</span>
                  {isCurrent && <span className="ml-auto text-[10px] uppercase font-bold text-indigo-600">Current</span>}
                </div>
                <ul className="text-xs text-slate-600 space-y-1 mb-3">
                  <li>AI: {meta.aiLimit}</li>
                  <li>Voice: {meta.voice}</li>
                  <li>Reports: {meta.reports}</li>
                  <li>Automations: {meta.automations}</li>
                </ul>
                {isCurrent ? (
                  <button disabled className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">Your plan</button>
                ) : isUpgrade ? (
                  <button onClick={onUpgrade} className="w-full py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
                    Upgrade to {meta.name}
                  </button>
                ) : (
                  <button onClick={() => { setDowngradeTarget(t); setDowngradeOpen(true); }} className="w-full py-2 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50">
                    Downgrade to {meta.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancel modal */}
      <AnimatePresence>
        {cancelOpen && (
          <Modal onClose={() => setCancelOpen(false)} title="Cancel subscription?">
            <p className="text-sm text-slate-600">You'll keep <strong>{planMeta.name}</strong> access until {renewal ? new Date(renewal).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "your renewal date"}, then move to Starter.</p>
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-700 mb-2">What you'll lose</p>
              <ul className="text-xs text-rose-800 space-y-1">
                {tier === "elite" && <li>• Multi-AI routing (GPT + Gemini + Claude)</li>}
                {tier !== "free" && <li>• Unlimited Lumo AI chats (back to 10/day)</li>}
                {tier !== "free" && <li>• Voice AI Coach</li>}
                {tier !== "free" && <li>• Advanced reports & PDF exports</li>}
                {tier !== "free" && <li>• Advanced automations</li>}
                {tier === "elite" && <li>• Financial forecasting & AI memory</li>}
              </ul>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setCancelOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800">Keep Subscription</button>
              <button onClick={handleCancel} disabled={cancelling} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-rose-200 text-rose-700 hover:bg-rose-50">
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Cancel Anyway"}
              </button>
            </div>
          </Modal>
        )}

        {downgradeOpen && (
          <Modal onClose={() => setDowngradeOpen(false)} title={`Downgrade to ${PLAN_META[downgradeTarget].name}?`}>
            <p className="text-sm text-slate-600">
              Effective <strong>{renewal ? new Date(renewal).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "at next billing cycle"}</strong>.
              You'll keep {planMeta.name} until then.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <ImpactRow title="AI Chats" from={planMeta.aiLimit} to={PLAN_META[downgradeTarget].aiLimit} />
              <ImpactRow title="Voice AI" from={planMeta.voice} to={PLAN_META[downgradeTarget].voice} />
              <ImpactRow title="Reports" from={planMeta.reports} to={PLAN_META[downgradeTarget].reports} />
              <ImpactRow title="Automations" from={planMeta.automations} to={PLAN_META[downgradeTarget].automations} />
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setDowngradeOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800">Keep {planMeta.name}</button>
              <button onClick={() => schedulePlanChange(downgradeTarget)} disabled={pendingBusy} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-amber-200 text-amber-800 hover:bg-amber-50">
                {pendingBusy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm Downgrade"}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-400">{icon}</span>
      <span className="text-slate-500">{label}:</span>
      <span className="text-slate-900 font-medium">{value}</span>
    </div>
  );
}

function StatusPill({ status, cancelAtEnd }: { status: string; cancelAtEnd: boolean }) {
  const label = cancelAtEnd ? "Cancelling" : status === "free" ? "Free" : status;
  const cls =
    cancelAtEnd ? "bg-amber-50 text-amber-700 border-amber-200" :
    status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    status === "trialing" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
    status === "canceled" || status === "expired" ? "bg-slate-100 text-slate-700 border-slate-200" :
    "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function UsageCard({ icon, label, value, limit, locked }: { icon: React.ReactNode; label: string; value: number; limit: number; locked?: boolean }) {
  const pct = limit === Infinity ? 0 : Math.min(100, Math.round((value / Math.max(1, limit)) * 100));
  return (
    <div className={`rounded-2xl border p-4 ${locked ? "border-slate-200 bg-slate-50/50 opacity-60" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">{icon}<span>{label}</span></div>
      <div className="text-xl font-semibold text-slate-900">
        {value}
        <span className="text-xs font-normal text-slate-400 ml-1">/ {limit === Infinity ? "∞" : limit}</span>
      </div>
      {limit !== Infinity && (
        <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full ${pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-indigo-500"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function ImpactRow({ title, from, to }: { title: string; from: string; to: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{title}</div>
      <div className="mt-1 flex items-center gap-1.5 text-slate-700">
        <span className="line-through text-slate-400">{from}</span>
        <ArrowRight className="w-3 h-3 text-slate-400" />
        <span className="font-medium">{to}</span>
      </div>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
