import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { Persona } from "./PersonaSelection";

// ─── Types ───
interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  insights?: Insight[];
}

interface Insight {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  chartData?: { name: string; value: number }[];
}

// ─── AI Responses ───
const aiResponses: Record<string, { text: string; insights: Insight[] }> = {
  "Analyze Spending": {
    text: "📊 I've scanned your spending for the past 30 days. Your dining expenses are above budget, but transport costs dropped nicely!",
    insights: [
      { label: "Total Spent", value: "₹27,940", change: "-5.2% vs last month", positive: true },
      { label: "Dining Out", value: "₹4,800", change: "22% above budget", positive: false, chartData: [{ name: "Budget", value: 4000 }, { name: "Spent", value: 4800 }] },
      { label: "Transport", value: "₹3,100", change: "38% under budget", positive: true },
      { label: "Subscriptions", value: "3 active", change: "₹1,847/mo total" },
    ],
  },
  "Create Budget": {
    text: "🎯 Based on your ₹55,000 income and spending patterns, here's an optimized 50/30/20 budget:",
    insights: [
      { label: "Needs (50%)", value: "₹27,500", change: "Rent, Bills, Groceries" },
      { label: "Wants (30%)", value: "₹16,500", change: "Dining, Shopping, Fun" },
      { label: "Savings (20%)", value: "₹11,000", change: "Goals + Emergency" },
      { label: "Projected Savings", value: "₹1,32,000/yr", change: "+23% vs current", positive: true },
    ],
  },
  "Save More": {
    text: "💡 Found 5 ways to save more this month. Some quick wins:",
    insights: [
      { label: "Cancel Unused Sub", value: "Save ₹499/mo", change: "Spotify unused 3 weeks", positive: true },
      { label: "Meal Prep", value: "Save ₹2,400/mo", change: "Reduce dining 50%", positive: true },
      { label: "Switch Insurance", value: "Save ₹3,600/yr", change: "Better plan available", positive: true },
      { label: "Total Potential", value: "₹6,499/mo", change: "₹77,988 per year!", positive: true },
    ],
  },
  "Monthly Report": {
    text: "📈 Complete financial report: income is up and expenses are down. Keep it going!",
    insights: [
      { label: "Net Income", value: "+₹27,060", change: "+23% vs Feb", positive: true },
      { label: "Top Category", value: "Food ₹8,240", change: "29.5% of spending", chartData: [{ name: "Food", value: 8240 }, { name: "Transport", value: 4500 }, { name: "Shopping", value: 6200 }, { name: "Bills", value: 5800 }, { name: "Fun", value: 3200 }] },
      { label: "Savings Rate", value: "49.2%", change: "Above target of 30%", positive: true },
      { label: "Goal Progress", value: "65%", change: "Emergency Fund on track", positive: true },
    ],
  },
  "Goals Plan": {
    text: "🎯 3 active savings goals. Emergency Fund is looking great — you'll hit it by August!",
    insights: [
      { label: "Emergency Fund", value: "68%", change: "₹1,36,000 / ₹2,00,000", positive: true, chartData: [{ name: "Saved", value: 68 }, { name: "Left", value: 32 }] },
      { label: "Vacation Fund", value: "56%", change: "₹45,000 / ₹80,000" },
      { label: "New Laptop", value: "80%", change: "₹72,000 / ₹90,000", positive: true },
      { label: "Est. Completion", value: "Aug 2026", change: "All goals", positive: true },
    ],
  },
};

const quickActions = [
  { label: "Analyze Spending", icon: "⚡", color: "hsl(38,92%,50%)" },
  { label: "Create Budget", icon: "🛡️", color: "hsl(217,91%,60%)" },
  { label: "Save More", icon: "💎", color: "hsl(152,69%,41%)" },
  { label: "Monthly Report", icon: "📊", color: "hsl(262,83%,58%)" },
  { label: "Goals Plan", icon: "🎯", color: "hsl(330,81%,60%)" },
];

const CHART_COLORS = [
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(330, 81%, 60%)",
  "hsl(217, 91%, 60%)",
  "hsl(152, 69%, 41%)",
];

// ─── Counter Animation ───
const AnimatedValue = ({ value }: { value: string }) => {
  const numMatch = value.match(/(₹?)([\d,]+\.?\d*)(.*)/);
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    if (!numMatch) {
      setDisplayed(value);
      return;
    }
    const prefix = numMatch[1];
    const targetNum = parseFloat(numMatch[2].replace(/,/g, ""));
    const suffix = numMatch[3];
    const duration = 800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(targetNum * eased);
      setDisplayed(`${prefix}${current.toLocaleString()}${suffix}`);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayed}</span>;
};

// ─── Main Component ───
interface MissionDashboardProps {
  persona: Persona;
  onBack: () => void;
}

const MissionDashboard = ({ persona, onBack }: MissionDashboardProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "ai",
      text: `Welcome, ${persona.name}! 🎮 I'm your AI Finance Coach. I've loaded your "${persona.tagline}" playstyle. Choose a power-up below to start your mission!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streak] = useState(7);
  const [score] = useState(740);
  const [level] = useState(12);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const sendMessage = (text: string) => {
    const userMsg: Message = { id: nextId.current++, role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const response = aiResponses[text] || {
      text: `Analyzing "${text}" with your ${persona.name} profile... Here's what I found:`,
      insights: [
        { label: "Quick Insight", value: "Processing", change: "Based on your data", positive: true },
        { label: "Recommendation", value: "Personalized", change: `Tailored for ${persona.name}`, positive: true },
      ],
    };

    setTimeout(() => {
      setIsTyping(false);
      const aiMsg: Message = {
        id: nextId.current++,
        role: "ai",
        text: response.text,
        insights: response.insights,
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1200 + Math.random() * 800);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-[calc(100vh-64px)] md:h-screen relative overflow-hidden"
    >
      {/* Dark game background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(250,50%,8%)] via-[hsl(260,40%,10%)] to-[hsl(220,50%,6%)]" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(260,80%,60%) 1px, transparent 1px), linear-gradient(90deg, hsl(260,80%,60%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ═══ Mission Header ═══ */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="shrink-0 relative z-10 border-b border-white/10"
        style={{
          background: `linear-gradient(135deg, ${persona.accentColor}15, transparent)`,
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-white/40 hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              ← Exit
            </button>
            <div className="hidden sm:block h-4 w-px bg-white/10" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md text-white" style={{ background: persona.accentColor }}>
                LVL {level}
              </span>
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/30">Mission</p>
                <p className="text-sm font-display font-bold text-white">Financial Freedom</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* XP Progress */}
            <div className="hidden md:block">
              <p className="text-[10px] text-white/30 mb-1">XP Progress</p>
              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "65%" }}
                  transition={{ delay: 0.5, duration: 1.2 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${persona.accentColor}, ${persona.accentColor}aa)` }}
                />
              </div>
            </div>

            {/* Score */}
            <div className="text-center">
              <p className="text-[10px] text-white/30">Score</p>
              <p className="text-sm font-display font-bold" style={{ color: persona.accentColor }}>{score}</p>
            </div>

            {/* Streak */}
            <div className="text-center">
              <p className="text-[10px] text-white/30">Streak</p>
              <p className="text-sm font-display font-bold text-white">🔥 {streak}d</p>
            </div>

            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border border-white/10"
              style={{ background: `${persona.accentColor}20` }}
            >
              {persona.emoji}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ Conversation Area ═══ */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
                layout
              >
                {msg.role === "ai" ? (
                  <div className="space-y-4">
                    {/* AI Message Card */}
                    <div
                      className="p-5 md:p-6 rounded-2xl border border-white/10 shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, hsl(260,40%,12%), hsl(260,30%,8%))`,
                        backdropFilter: "blur(20px)",
                      }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold border border-white/10"
                          style={{ background: `${persona.accentColor}20`, color: persona.accentColor }}
                        >
                          AI
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/30 mb-0.5">FinTrack AI · just now</p>
                        </div>
                      </div>
                      <p className="text-sm md:text-base leading-relaxed text-white/80 pl-11">
                        {msg.text}
                      </p>
                    </div>

                    {/* Insight Cards */}
                    {msg.insights && msg.insights.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 pl-4 md:pl-8">
                        {msg.insights.map((insight, idx) => (
                          <motion.div
                            key={insight.label}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 * idx + 0.3, duration: 0.4 }}
                            className="p-4 rounded-xl border border-white/10 relative overflow-hidden group"
                            style={{
                              background: `linear-gradient(135deg, ${CHART_COLORS[idx % CHART_COLORS.length]}08, transparent)`,
                            }}
                          >
                            {/* Accent bar */}
                            <div
                              className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                              style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                            />
                            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1 pl-2">
                              {insight.label}
                            </p>
                            <p className="font-display text-lg md:text-xl font-bold text-white pl-2">
                              <AnimatedValue value={insight.value} />
                            </p>
                            {insight.change && (
                              <p className={`text-xs mt-1 pl-2 ${
                                insight.positive
                                  ? "text-[hsl(152,69%,50%)]"
                                  : insight.positive === false
                                  ? "text-[hsl(0,72%,60%)]"
                                  : "text-white/30"
                              }`}>
                                {insight.change}
                              </p>
                            )}

                            {/* Mini Chart */}
                            {insight.chartData && (
                              <div className="mt-2 h-12">
                                <ResponsiveContainer width="100%" height="100%">
                                  {insight.chartData.length <= 2 ? (
                                    <PieChart>
                                      <Pie
                                        data={insight.chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={10}
                                        outerRadius={20}
                                        dataKey="value"
                                        strokeWidth={0}
                                      >
                                        {insight.chartData.map((_, ci) => (
                                          <Cell key={ci} fill={ci === 0 ? persona.accentColor : "hsl(0,0%,25%)"} />
                                        ))}
                                      </Pie>
                                    </PieChart>
                                  ) : (
                                    <BarChart data={insight.chartData}>
                                      <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                        {insight.chartData.map((_, ci) => (
                                          <Cell key={ci} fill={CHART_COLORS[ci % CHART_COLORS.length]} />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  )}
                                </ResponsiveContainer>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* User Message */
                  <div className="flex justify-end">
                    <div
                      className="px-5 py-3.5 rounded-2xl rounded-br-md max-w-[80%] shadow-md border border-white/10"
                      style={{ background: persona.accentColor }}
                    >
                      <p className="text-sm leading-relaxed text-white">{msg.text}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 rounded-2xl border border-white/10"
                style={{ background: `linear-gradient(135deg, hsl(260,40%,12%), hsl(260,30%,8%))` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: `${persona.accentColor}20`, color: persona.accentColor }}
                  >
                    AI
                  </div>
                  <div className="flex gap-1.5 items-center">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="w-2 h-2 rounded-full"
                        style={{ background: persona.accentColor }}
                      />
                    ))}
                    <span className="text-xs text-white/30 ml-2">thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ═══ Quick Actions (Power-ups) + Input ═══ */}
      <div
        className="shrink-0 border-t border-white/10 relative z-10"
        style={{ background: "hsl(250,50%,6%)", backdropFilter: "blur(20px)" }}
      >
        {/* Power-up Buttons */}
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quickActions.map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => sendMessage(action.label)}
                disabled={isTyping}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200 disabled:opacity-30"
                style={{
                  borderColor: `${action.color}30`,
                  background: `${action.color}10`,
                  color: action.color,
                  boxShadow: `0 0 20px ${action.color}10`,
                }}
              >
                <span className="text-base">{action.icon}</span>
                {action.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="max-w-3xl mx-auto px-4 pb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isTyping && handleSend()}
              placeholder="Ask your AI coach anything..."
              disabled={isTyping}
              className="flex-1 px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all disabled:opacity-50"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className="px-5 py-3.5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-30"
              style={{ background: persona.accentColor }}
            >
              Send
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MissionDashboard;
