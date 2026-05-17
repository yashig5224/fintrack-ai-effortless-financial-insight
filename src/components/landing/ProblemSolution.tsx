import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, Search, Sparkles } from "lucide-react";

const items = [
  { problem: "Overspending", solution: "Smart alerts catch you before you cross the line.", icon: AlertTriangle, tint: "0,80%,60%" },
  { problem: "Forgotten subscriptions", solution: "Auto-detect recurring drains on your wallet.", icon: Search, tint: "260,80%,62%" },
  { problem: "No clarity", solution: "AI insights turn raw data into clear, beautiful stories.", icon: Sparkles, tint: "220,90%,60%" },
];

const ProblemSolution = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const titleY = useTransform(scrollYProgress, [0, 0.5], [80, -20]);

  return (
    <section ref={ref} className="relative min-h-screen py-24 md:py-32 overflow-hidden">
      {/* Parallax background */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,100%,98%)] via-white to-[hsl(280,100%,98%)]" />
        <div className="absolute top-[10%] left-[8%] w-32 h-32 rounded-3xl bg-[hsl(220,100%,90%,0.5)] rotate-12 blur-sm" />
        <div className="absolute top-[40%] right-[10%] w-40 h-40 rounded-full bg-[hsl(280,80%,92%,0.5)] blur-sm" />
        <div className="absolute bottom-[15%] left-[15%] w-28 h-28 rounded-2xl bg-[hsl(150,80%,90%,0.5)] -rotate-12 blur-sm" />
      </motion.div>
      <motion.div style={{ y: midY }} className="absolute inset-0 pointer-events-none">
        {/* Floating expense cards */}
        {["-₹450", "-₹2,100", "-₹89", "-₹1,250"].map((amt, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
            className="absolute text-xs font-semibold px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/90 text-[hsl(0,70%,50%)] shadow-sm"
            style={{
              top: `${15 + i * 20}%`,
              left: `${i % 2 === 0 ? 5 + i * 3 : 75 - i * 3}%`,
            }}
          >
            {amt}
          </motion.div>
        ))}
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6">
        <motion.div style={{ y: titleY }} className="text-center mb-14">
          <p className="text-xs tracking-[0.25em] uppercase text-foreground/55 mb-3 font-medium">✦ The Problem</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em]">
            Stop losing money to{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(0,80%,55%)] to-[hsl(330,80%,60%)]">
              invisible leaks
            </span>.
          </h2>
          <p className="mt-4 text-foreground/65 max-w-md mx-auto">
            Most people don't know where it disappears. Lumo shows you exactly where — and helps you fix it.
          </p>
        </motion.div>

        <div className="space-y-4">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.problem}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative rounded-3xl p-6 md:p-7 bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_10px_40px_-15px_rgba(120,90,220,0.2)] flex flex-col md:flex-row md:items-center gap-4 md:gap-6 overflow-hidden"
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl" style={{ background: `hsl(${it.tint},0.2)` }} />
                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, hsl(${it.tint},0.2), hsl(${it.tint},0.08))` }}>
                    <Icon className="w-5 h-5" style={{ color: `hsl(${it.tint})` }} />
                  </div>
                  <p className="font-display text-lg md:text-xl font-semibold text-foreground/40 line-through">{it.problem}</p>
                </div>
                <div className="hidden md:block h-10 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
                <p className="relative text-foreground/75 leading-relaxed text-sm md:text-base">{it.solution}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
