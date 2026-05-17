import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { lumoAvatar } from "@/assets/personas";
import BackgroundFX from "./BackgroundFX";

const turns = [
  { role: "user", text: "How much did I spend on food this month?" },
  {
    role: "ai",
    text: "You spent ₹8,240 on food — 12% above last month. Top spots: Swiggy (₹3.1K), Zomato (₹2.8K), groceries (₹2.3K). Want me to suggest a smarter budget?",
  },
  { role: "user", text: "Yes, give me a plan." },
  {
    role: "ai",
    text: "Here's your AI-optimized split:\n• Food ₹7,000  • Transport ₹3,000\n• Fun ₹2,500  • Save ₹15,000\nThis bumps savings by ~30% 🚀",
  },
];

const chips = ["Analyze my spending", "Build a budget", "Plan a goal", "Reduce subscriptions"];

const CoachPreview = () => {
  const [shown, setShown] = useState(1);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (shown >= turns.length) return;
    const next = turns[shown];
    if (next.role === "ai") {
      setTyping(true);
      const t = setTimeout(() => {
        setTyping(false);
        setShown((s) => s + 1);
      }, 1600);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setShown((s) => s + 1), 1200);
      return () => clearTimeout(t);
    }
  }, [shown]);

  return (
    <section id="coach" className="relative py-24 md:py-36 overflow-hidden">
      <BackgroundFX variant="soft" />
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
        {/* LEFT — mascot */}
        <div className="relative flex flex-col items-center lg:items-start text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative mb-8"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(220,100%,80%)] via-[hsl(280,90%,82%)] to-[hsl(150,80%,82%)] blur-3xl"
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-48 h-48 rounded-full bg-gradient-to-br from-white via-[hsl(220,100%,97%)] to-[hsl(280,80%,97%)] p-2 border border-white/80 shadow-[0_20px_60px_-15px_rgba(120,90,220,0.4)]"
            >
              <img src={lumoAvatar} alt="Lumo" className="w-full h-full rounded-full object-cover" />
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-[hsl(220,90%,65%)]"
              />
            </motion.div>
          </motion.div>

          <p className="text-xs tracking-[0.25em] uppercase text-foreground/55 mb-3 font-medium">
            ✦ AI Coach
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-[1.05]">
            Meet{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(220,90%,55%)] to-[hsl(280,80%,62%)]">
              Lumo
            </span>
            <br />Your money sidekick.
          </h2>
          <p className="mt-5 text-foreground/65 max-w-md leading-relaxed">
            A persona-aware AI that learns how you spend, saves you from overspending,
            and turns finance into a game you actually want to play.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
            {chips.map((c, i) => (
              <motion.span
                key={c}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="text-xs px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/90 text-foreground/75 hover:text-foreground hover:-translate-y-0.5 transition-all shadow-sm"
              >
                {c}
              </motion.span>
            ))}
          </div>
        </div>

        {/* RIGHT — fake chat */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="rounded-[2rem] p-1 bg-gradient-to-br from-white/90 via-white/60 to-white/40 border border-white/80 shadow-[0_30px_80px_-20px_rgba(120,90,220,0.3)] backdrop-blur-2xl">
            <div className="rounded-[1.7rem] bg-white/80 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/80 bg-gradient-to-r from-[hsl(220,100%,98%)] to-[hsl(280,100%,98%)]">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(220,90%,80%)] to-[hsl(280,80%,82%)] p-[2px]">
                  <img src={lumoAvatar} alt="" className="w-full h-full rounded-full" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">Lumo AI Coach</div>
                  <div className="text-[10px] text-foreground/55 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(150,80%,50%)] animate-pulse" /> Online · GPT-tier intelligence
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-[hsl(260,70%,60%)]" />
              </div>

              <div className="p-5 space-y-3 min-h-[340px] max-h-[420px] overflow-hidden">
                {turns.slice(0, shown).map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                        m.role === "user"
                          ? "bg-gradient-to-br from-[hsl(220,95%,55%)] to-[hsl(260,85%,60%)] text-white rounded-br-md shadow-md"
                          : "bg-white border border-[hsl(260,40%,93%)] text-foreground/85 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                  </motion.div>
                ))}
                {typing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-[hsl(260,40%,93%)] flex gap-1.5">
                      {[0, 0.2, 0.4].map((d, i) => (
                        <motion.span
                          key={i}
                          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: d }}
                          className="w-1.5 h-1.5 rounded-full bg-[hsl(260,70%,60%)]"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-4 border-t border-white/80 bg-white/60">
                <div className="rounded-full bg-gradient-to-r from-[hsl(220,100%,97%)] to-[hsl(280,100%,98%)] border border-white px-4 py-2.5 flex items-center justify-between text-sm">
                  <span className="text-foreground/50">Ask Lumo anything…</span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(220,95%,55%)] to-[hsl(280,80%,62%)] text-white flex items-center justify-center text-xs">↑</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CoachPreview;
