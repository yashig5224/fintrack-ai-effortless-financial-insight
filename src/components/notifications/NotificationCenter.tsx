// Phase 7 — Notification Center UI.
// Bell icon w/ unread badge → dropdown panel with filters, mark-read,
// archive and delete. Realtime updates via Supabase channel.

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Archive, Trash2, Sparkles, Wallet, Target, Zap, RefreshCw, Brain, CreditCard, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AppNotification, NotificationType,
  archiveNotification, deleteNotification, markAllRead, markRead,
  runNotificationScan,
} from "@/lib/notifications";

const TYPE_META: Record<NotificationType, { label: string; Icon: typeof Bell; tone: string }> = {
  budget: { label: "Budget", Icon: Wallet, tone: "from-amber-500 to-orange-500" },
  goal: { label: "Goal", Icon: Target, tone: "from-emerald-500 to-teal-500" },
  automation: { label: "Automation", Icon: Zap, tone: "from-violet-500 to-fuchsia-500" },
  subscription: { label: "Subscription", Icon: RefreshCw, tone: "from-indigo-500 to-blue-500" },
  ai_insight: { label: "AI Insight", Icon: Brain, tone: "from-fuchsia-500 to-pink-500" },
  payment: { label: "Payment", Icon: CreditCard, tone: "from-cyan-500 to-blue-500" },
};

const FILTERS: { key: "all" | "unread" | NotificationType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "budget", label: "Budgets" },
  { key: "goal", label: "Goals" },
  { key: "ai_insight", label: "AI" },
  { key: "subscription", label: "Subs" },
];

interface Props {
  scanData?: {
    transactions: { id: string; title: string; amount: number; type: string; category: string | null; transaction_date: string; recurring?: boolean | null }[];
    goals: { id: string; goal_name: string; target_amount: number; current_amount: number; deadline: string | null }[];
    budgets: { id: string; category: string; monthly_limit: number; spent_amount: number; month: string }[];
  };
}

export const NotificationCenter = ({ scanData }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const panelRef = useRef<HTMLDivElement>(null);

  // load
  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("*").eq("user_id", user.id).eq("archived", false)
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setItems((data || []) as AppNotification[]));
  }, [user]);

  // realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === "INSERT") setItems((p) => [payload.new as AppNotification, ...p].slice(0, 50));
        else if (payload.eventType === "UPDATE") setItems((p) => p.map((x) => x.id === (payload.new as AppNotification).id ? payload.new as AppNotification : x).filter((x) => !x.archived));
        else if (payload.eventType === "DELETE") setItems((p) => p.filter((x) => x.id !== (payload.old as AppNotification).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // scan on data change (debounced via deps)
  useEffect(() => {
    if (!user || !scanData) return;
    const t = setTimeout(() => {
      runNotificationScan({ userId: user.id, ...scanData });
    }, 1200);
    return () => clearTimeout(t);
  }, [user, scanData]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);
  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "unread") return items.filter((i) => !i.read);
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md flex items-center justify-center transition"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-gray-700" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[360px] sm:w-[420px] max-h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <h3 className="font-display text-sm font-bold text-gray-900">Notifications</h3>
                <span className="text-xs text-gray-500">{unread} unread</span>
              </div>
              <button
                onClick={() => markAllRead(user.id)}
                className="text-[11px] font-semibold text-violet-600 hover:text-violet-800"
              >
                Mark all read
              </button>
            </div>

            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1 overflow-x-auto">
              <Filter className="w-3 h-3 text-gray-400 shrink-0" />
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition shrink-0 ${filter === f.key ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto max-h-[420px]">
              {filtered.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-gray-400">
                  No notifications. Lumo will alert you on budget breaches, goal updates and unusual spending.
                </div>
              ) : (
                filtered.map((n) => {
                  const meta = TYPE_META[n.type as NotificationType] || TYPE_META.ai_insight;
                  const Icon = meta.Icon;
                  return (
                    <div
                      key={n.id}
                      className={`group px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${!n.read ? "bg-violet-50/40" : ""}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.tone} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{n.title}</h4>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] text-gray-400">{timeAgo(n.created_at)}</span>
                            <span className={`text-[10px] font-bold uppercase ${
                              n.severity === "critical" ? "text-red-500" :
                              n.severity === "warning" ? "text-amber-500" :
                              n.severity === "success" ? "text-emerald-500" : "text-gray-400"
                            }`}>{n.severity}</span>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                              {!n.read && (
                                <button onClick={() => markRead(n.id)} className="p-1 rounded hover:bg-gray-200" title="Mark read">
                                  <Check className="w-3 h-3 text-gray-500" />
                                </button>
                              )}
                              <button onClick={() => archiveNotification(n.id)} className="p-1 rounded hover:bg-gray-200" title="Archive">
                                <Archive className="w-3 h-3 text-gray-500" />
                              </button>
                              <button onClick={() => deleteNotification(n.id)} className="p-1 rounded hover:bg-red-100" title="Delete">
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}

export default NotificationCenter;
