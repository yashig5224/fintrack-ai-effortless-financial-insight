import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import BackgroundFX from "./BackgroundFX";
import HeroPhone from "./HeroPhone";

const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen pt-28 pb-16 md:pt-32 overflow-hidden">
      <BackgroundFX variant="vivid" />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center"
      >
        {/* LEFT */}
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/80 text-xs font-medium text-foreground/80 shadow-sm mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(150,80%,50%)] animate-pulse" />
            Powered by Lumo AI · v2.0
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.2rem] font-bold tracking-[-0.045em] leading-[0.98] text-foreground"
          >
            Your AI{" "}
            <span className="relative inline-block">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(220,95%,55%)] via-[hsl(260,85%,60%)] to-[hsl(300,80%,65%)]">
                Financial
              </span>
              <motion.span
                aria-hidden
                animate={{ scaleX: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] origin-left rounded-full bg-gradient-to-r from-[hsl(220,95%,60%)] via-[hsl(260,85%,65%)] to-[hsl(300,80%,70%)]"
              />
            </span>
            <br />
            Universe.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-base sm:text-lg text-foreground/65 leading-relaxed max-w-xl mx-auto lg:mx-0"
          >
            AI-powered budgeting, gamified goals, and a personal finance coach that
            actually understands you. Track every rupee, level up your money game.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-9 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4"
          >
            <Link
              to="/login?signup=1"
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[hsl(220,95%,55%)] via-[hsl(260,85%,60%)] to-[hsl(290,80%,62%)] text-white font-medium shadow-[0_12px_40px_-10px_rgba(120,90,220,0.55)] hover:shadow-[0_18px_50px_-10px_rgba(120,90,220,0.7)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
              <span className="relative">Start Your Journey</span>
              <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white/80 backdrop-blur-md border border-white/90 text-foreground font-medium hover:bg-white hover:-translate-y-0.5 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[hsl(260,80%,60%)]" />
              Try Demo Mode
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="mt-10 grid grid-cols-3 gap-3 sm:gap-6 max-w-md mx-auto lg:mx-0"
          >
            {[
              { v: "₹12M+", l: "Tracked" },
              { v: "20K+", l: "Users" },
              { v: "4.9★", l: "Rating" },
            ].map((s) => (
              <div key={s.l} className="text-center lg:text-left">
                <div className="font-display font-bold text-xl sm:text-2xl bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
                  {s.v}
                </div>
                <div className="text-[11px] sm:text-xs text-foreground/55">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — orbiting dashboard mockup */}
        <div className="relative h-[480px] sm:h-[560px] lg:h-[620px] flex items-center justify-center">
          {/* Soft halo */}
          <div className="absolute inset-0 m-auto w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[hsl(220,100%,90%,0.6)] via-[hsl(260,100%,92%,0.5)] to-[hsl(150,80%,90%,0.5)] blur-3xl" />

          {/* Main dashboard card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-20 w-[88%] max-w-[400px]"
          >
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
              <div className="relative rounded-[2rem] p-1 bg-gradient-to-br from-white/90 via-white/70 to-white/50 backdrop-blur-2xl border border-white/80 shadow-[0_30px_80px_-20px_rgba(120,90,220,0.35)]">
                <div className="rounded-[1.7rem] bg-white/80 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(200,90%,85%)] to-[hsl(280,80%,88%)] p-[2px]">
                        <img src={lumoAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[hsl(150,80%,55%)] border-2 border-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Lumo AI</div>
                        <div className="text-[10px] text-foreground/55">Analyzing in real time</div>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[hsl(150,80%,92%)] to-[hsl(170,80%,90%)] text-[hsl(150,70%,30%)] text-[10px] font-semibold">
                      ↑ 12%
                    </div>
                  </div>

                  <div className="rounded-2xl p-4 bg-gradient-to-br from-[hsl(220,100%,97%)] to-[hsl(260,100%,98%)] border border-white">
                    <div className="text-[10px] uppercase tracking-wider text-foreground/55 mb-1">Net Balance</div>
                    <div className="font-display text-3xl font-bold">₹1,24,500</div>
                    <div className="mt-3 flex items-end gap-1 h-10">
                      {[40, 60, 35, 75, 55, 85, 70, 95].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.6 + i * 0.05, duration: 0.6 }}
                          className="flex-1 rounded-t bg-gradient-to-t from-[hsl(220,90%,70%)] to-[hsl(260,85%,75%)]"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mt-3">
                    <div className="rounded-xl p-3 bg-gradient-to-br from-[hsl(150,80%,95%)] to-[hsl(170,80%,96%)] border border-white">
                      <div className="text-[10px] text-[hsl(150,70%,35%)] font-medium">Income</div>
                      <div className="font-semibold text-sm">₹85K</div>
                    </div>
                    <div className="rounded-xl p-3 bg-gradient-to-br from-[hsl(25,100%,94%)] to-[hsl(15,100%,95%)] border border-white">
                      <div className="text-[10px] text-[hsl(20,80%,40%)] font-medium">Spend</div>
                      <div className="font-semibold text-sm">₹32K</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Orbiting floating widgets */}
          <FloatingWidget delay={0.5} className="absolute z-30 top-[8%] -left-2 sm:-left-6" y={[0, -12, 0]}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(25,100%,88%)] to-[hsl(15,100%,90%)] flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[hsl(20,80%,45%)]" />
              </div>
              <div>
                <div className="text-[11px] font-medium">Starbucks</div>
                <div className="text-[10px] text-foreground/55">-₹350 · just now</div>
              </div>
            </div>
          </FloatingWidget>

          <FloatingWidget delay={0.7} className="absolute z-30 top-[18%] -right-2 sm:-right-6" y={[0, -15, 0]}>
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9">
                <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(260,30%,90%)" strokeWidth="3" />
                  <motion.circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke="url(#g1)" strokeWidth="3" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 0.8 }} transition={{ duration: 1.4, delay: 1 }}
                  />
                  <defs>
                    <linearGradient id="g1"><stop stopColor="hsl(220,90%,60%)" /><stop offset="1" stopColor="hsl(280,80%,65%)" /></linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">80%</span>
              </div>
              <div>
                <div className="text-[11px] font-medium">Goal Quest</div>
                <div className="text-[10px] text-foreground/55">MacBook Pro</div>
              </div>
            </div>
          </FloatingWidget>

          <FloatingWidget delay={0.9} className="absolute z-30 bottom-[10%] -left-2 sm:-left-4" y={[0, -8, 0]}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(150,80%,88%)] to-[hsl(170,80%,90%)] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[hsl(150,70%,35%)]" />
              </div>
              <div>
                <div className="text-[11px] font-medium">+₹2,400 saved</div>
                <div className="text-[10px] text-foreground/55">this week</div>
              </div>
            </div>
          </FloatingWidget>

          <FloatingWidget delay={1.1} className="absolute z-30 bottom-[6%] -right-2 sm:-right-4" y={[0, -10, 0]}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(280,80%,90%)] to-[hsl(260,80%,92%)] flex items-center justify-center">
                <Bot className="w-4 h-4 text-[hsl(270,70%,50%)]" />
              </div>
              <div>
                <div className="text-[11px] font-medium">Lumo tip</div>
                <div className="text-[10px] text-foreground/55">Cut dining 18%</div>
              </div>
            </div>
          </FloatingWidget>

          {/* Orbit ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 m-auto w-[420px] h-[420px] rounded-full border border-dashed border-[hsl(260,40%,80%,0.4)] hidden sm:block"
          >
            <Target className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 text-[hsl(260,70%,60%)]" />
            <Sparkles className="absolute top-1/2 -right-3 -translate-y-1/2 w-5 h-5 text-[hsl(220,80%,60%)]" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

const FloatingWidget = ({
  children,
  className,
  delay,
  y,
}: {
  children: React.ReactNode;
  className?: string;
  delay: number;
  y: number[];
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    className={className}
  >
    <motion.div
      animate={{ y }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: "easeInOut" }}
      className="rounded-2xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_12px_30px_-10px_rgba(120,90,220,0.25)] px-3 py-2.5"
    >
      {children}
    </motion.div>
  </motion.div>
);

export default HeroSection;
