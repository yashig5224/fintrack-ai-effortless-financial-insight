import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { Persona } from "./PersonaSelection";

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

const aiResponses: Record<string, { text: string; insights: Insight[] }> = {
  "Analyze my spending": {
    text: "I've analyzed your recent transactions. You're doing great overall, but dining out is slightly above your usual trend.",
    insights: [
      { label: "Saved this week", value: "₹2,400", change: "+12% vs last week", positive: true },
      { label: "Food spending", value: "₹4,800", change: "22% above budget", positive: false, chartData: [{ name: "Budget", value: 4000 }, { name: "Spent", value: 4800 }] },
    ],
  },
  "Create a budget": {
    text: "Let's build a smart budget. Based on your income, here's an optimized 50/30/20 allocation for this month.",
    insights: [
      { label: "Needs", value: "50%", change: "₹27,500" },
      { label: "Wants", value: "30%", change: "₹16,500" },
      { label: "Savings", value: "20%", change: "₹11,000", positive: true, chartData: [{ name: "Needs", value: 50 }, { name: "Wants", value: 30 }, { name: "Savings", value: 20 }] },
    ],
  },
  "Save more money": {
    text: "I found a few quick wins to boost your savings. Small changes can make a big difference!",
    insights: [
      { label: "Food spending reduced", value: "12%", change: "Potential ₹1,200 saved", positive: true },
      { label: "Switch Mobile Plan", value: "₹400/mo", change: "Cheaper plan found", positive: true },
    ],
  },
  "Show subscriptions": {
    text: "You currently have 8 active subscriptions. I noticed a few you haven't used recently.",
    insights: [
      { label: "Active Subs", value: "8", change: "₹2,840/mo" },
      { label: "Unused Subs", value: "3", change: "Save ₹1,150/mo", positive: true, chartData: [{ name: "Active", value: 5 }, { name: "Unused", value: 3 }] },
    ],
  },
  "Goal planning": {
    text: "Your goals are looking solid. You're on track to hit your Emergency Fund target early!",
    insights: [
      { label: "Goal progress", value: "68%", change: "Emergency Fund", positive: true, chartData: [{ name: "Done", value: 68 }, { name: "Left", value: 32 }] },
      { label: "Est. Completion", value: "Aug 2026", change: "2 months early!", positive: true },
    ],
  },
};

const quickActions = [
  "Analyze my spending",
  "Create a budget",
  "Save more money",
  "Show subscriptions",
  "Goal planning"
];

const CHART_COLORS = [
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(330, 81%, 60%)",
  "hsl(217, 91%, 60%)",
  "hsl(152, 69%, 41%)",
];

const AnimatedValue = ({ value }: { value: string }) => {
  const numMatch = value.match(/(₹?)([\d,]+\.?\d*)(.*)/);
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    if (!numMatch) { setDisplayed(value); return; }
    const prefix = numMatch[1];
    const targetNum = parseFloat(numMatch[2].replace(/,/g, ""));
    const suffix = numMatch[3];
    const duration = 1000;
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

interface MissionDashboardProps {
  persona: Persona;
  onBack: () => void;
}

const MissionDashboard = ({ persona, onBack }: MissionDashboardProps) => {
  const accentColor = `hsl(${persona.accentHsl})`;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "ai",
      text: `Welcome to your Financial Mission! 👋 I'm your personalized ${persona.name} Coach. What's our focus for today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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
      text: `I'm analyzing your request for "${text}" based on your ${persona.name} profile...`,
      insights: [
        { label: "Processing", value: "Insights", change: "Gathering data", positive: true },
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
    }, 1200 + Math.random() * 800); // More natural typing delay
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
      transition={{ duration: 0.4 }}
      className="flex flex-col h-[100dvh] w-screen relative overflow-hidden bg-background"
    >
      {/* Immersive Background: Soft light beams, particles, layered depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(240,40%,98%)] to-[hsl(220,30%,96%)] pointer-events-none" />
      <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-[hsl(262,83%,58%/0.03)] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-[hsl(217,91%,60%/0.04)] blur-[100px] pointer-events-none" />
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[800px] h-[300px] rounded-[100%] bg-[hsl(38,92%,50%/0.02)] blur-[100px] pointer-events-none" />

      {/* Floating particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`bg-particle-${i}`}
          animate={{ 
            y: ["0vh", "-100vh"],
            x: [0, Math.sin(i) * 50, 0],
            opacity: [0, 0.5, 0]
          }}
          transition={{ 
            duration: 15 + Math.random() * 10, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * 5
          }}
          className="absolute bottom-0 w-2 h-2 rounded-full bg-[hsl(217,91%,60%/0.3)] blur-[1px] pointer-events-none"
          style={{ left: `${10 + Math.random() * 80}%` }}
        />
      ))}

      {/* ═══ Top Mission HUD Bar ═══ */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="shrink-0 relative z-20 pt-4 pb-2 px-4 sm:px-6 sm:pt-6"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {/* Back & Mission Title */}
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-background/50 border border-border/50 backdrop-blur-md text-foreground hover:bg-background/80 transition-colors shadow-sm"
            >
              ←
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[hsl(262,83%,58%)]">Current Mission</span>
              </div>
              <h2 className="text-base sm:text-xl font-display font-bold text-foreground tracking-tight flex items-center gap-2">
                Financial Freedom <span className="text-xl">🎯</span>
              </h2>
            </div>
          </div>

          {/* Gamified Stats */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 border border-border/50 backdrop-blur-md shadow-sm">
              <span className="text-lg">🔥</span>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-none">Streak</div>
                <div className="text-sm font-bold text-foreground leading-none mt-0.5">12 Days</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 border border-border/50 backdrop-blur-md shadow-sm">
              <span className="text-lg">💎</span>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-none">Coins</div>
                <div className="text-sm font-bold text-foreground leading-none mt-0.5">2,450</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground text-background shadow-md">
              <span className="text-lg" style={{ color: accentColor }}>★</span>
              <div>
                <div className="text-[10px] text-background/70 uppercase font-bold tracking-wider leading-none">Lvl {persona.level}</div>
                <div className="text-sm font-bold leading-none mt-0.5">Rank up</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Level Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4 h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "65%" }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, hsl(262,83%,58%), ${accentColor})` }}
          />
        </div>
      </motion.div>

      {/* ═══ Main Chat Area ═══ */}
      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-none pb-32">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 250, damping: 25 }}
                layout
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" ? (
                  <div className="flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[80%]">
                    {/* AI Avatar */}
                    <div className="shrink-0 relative">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] bg-background/80 backdrop-blur-xl border border-border/50 shadow-sm flex items-center justify-center text-xl sm:text-2xl z-10 relative">
                        {persona.emoji}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,83%,58%/0.2)] to-transparent rounded-[14px] blur-md -z-10" />
                    </div>
                    
                    {/* AI Message Card */}
                    <div className="space-y-4 w-full">
                      <div className="p-5 sm:p-6 rounded-[24px] rounded-tl-[8px] bg-background/70 backdrop-blur-xl border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                        {/* Soft pastel accent gradient inside card */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[hsl(262,83%,58%/0.5)] to-transparent opacity-50" />
                        <p className="text-base sm:text-lg leading-relaxed text-foreground/90 font-medium">
                          {msg.text}
                        </p>
                      </div>

                      {/* AI Insights Cards */}
                      {msg.insights && msg.insights.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {msg.insights.map((insight, idx) => (
                            <motion.div
                              key={insight.label}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 + idx * 0.1, duration: 0.5, type: "spring" }}
                              whileHover={{ y: -4, scale: 1.02 }}
                              className="p-5 rounded-[20px] bg-background border border-border/60 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                            >
                              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-border/50 to-transparent rounded-full blur-2xl group-hover:from-[hsl(262,83%,58%/0.1)] transition-colors" />
                              
                              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
                                {insight.label}
                              </p>
                              <p className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">
                                <AnimatedValue value={insight.value} />
                              </p>
                              
                              {insight.change && (
                                <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
                                  insight.positive
                                    ? "bg-[hsl(152,69%,41%/0.1)] text-[hsl(152,69%,41%)]"
                                    : insight.positive === false
                                    ? "bg-[hsl(0,72%,51%/0.1)] text-[hsl(0,72%,51%)]"
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {insight.positive ? "↗" : insight.positive === false ? "↘" : "→"} {insight.change}
                                </div>
                              )}

                              {insight.chartData && (
                                <div className="mt-4 h-12 w-full opacity-80">
                                  <ResponsiveContainer width="100%" height="100%">
                                    {insight.chartData.length <= 2 ? (
                                      <PieChart>
                                        <Pie data={insight.chartData} cx="80%" cy="50%" innerRadius={12} outerRadius={24} dataKey="value" strokeWidth={0}>
                                          {insight.chartData.map((_, ci) => (
                                            <Cell key={ci} fill={ci === 0 ? accentColor : "hsl(0,0%,90%)"} />
                                          ))}
                                        </Pie>
                                      </PieChart>
                                    ) : (
                                      <BarChart data={insight.chartData}>
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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
                  </div>
                ) : (
                  <div className="max-w-[85%] sm:max-w-[70%]">
                    <div className="p-4 sm:p-5 rounded-[24px] rounded-tr-[8px] bg-foreground text-background shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                      <p className="text-base sm:text-lg leading-relaxed relative z-10">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex gap-4 max-w-[80%]"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] bg-background/80 backdrop-blur-xl border border-border/50 flex items-center justify-center text-xl sm:text-2xl shrink-0 opacity-70">
                  {persona.emoji}
                </div>
                <div className="p-5 rounded-[24px] rounded-tl-[8px] bg-background/50 backdrop-blur-xl border border-border/50 flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -6, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      className="w-2 h-2 rounded-full"
                      style={{ background: accentColor }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* ═══ Floating Action / Input Area ═══ */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
        className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none"
      >
        <div className="max-w-4xl mx-auto px-4 pb-6 sm:pb-8 pt-10 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-auto">
          
          {/* Smart Suggestion Chips */}
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {quickActions.map((action, i) => (
              <motion.button
                key={action}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => sendMessage(action)}
                disabled={isTyping}
                className="shrink-0 px-4 sm:px-5 py-2.5 rounded-full border border-border/60 bg-background/80 backdrop-blur-xl text-sm font-medium text-foreground hover:border-border hover:shadow-md transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:hover:y-0"
              >
                {action}
              </motion.button>
            ))}
          </div>

          {/* Floating Input Container */}
          <div className="relative flex items-center bg-background/90 backdrop-blur-2xl border border-border/80 rounded-[28px] p-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <button className="w-12 h-12 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0">
              🎤
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isTyping && handleSend()}
              placeholder="Ask your AI coach anything..."
              disabled={isTyping}
              className="flex-1 bg-transparent px-2 py-3 text-base sm:text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className="w-12 h-12 flex items-center justify-center rounded-[20px] text-background shadow-md disabled:opacity-30 disabled:hover:scale-100 shrink-0 ml-2"
              style={{ background: `linear-gradient(135deg, hsl(262,83%,58%), ${accentColor})` }}
            >
              ↑
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MissionDashboard;