import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";

const benefits = [
  {
    problem: "Overspending",
    solution: "Smart alerts that warn you before you exceed limits.",
    icon: "🔔",
  },
  {
    problem: "Forgot subscriptions",
    solution: "Auto-detect recurring charges you no longer need.",
    icon: "🔍",
  },
  {
    problem: "No clarity",
    solution: "Visual insights that make your finances crystal clear.",
    icon: "✨",
  },
];

const ProblemSolution = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Parallax layers
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const headlineOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  const headlineY = useTransform(scrollYProgress, [0.1, 0.3], [60, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-background"
    >
      {/* Background parallax layer */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        {/* Soft gradient sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,60%,97%)] via-background to-background" />
        {/* Floating shapes */}
        <div className="absolute top-[15%] left-[8%] w-16 h-16 rounded-2xl bg-[hsl(217,91%,60%/0.08)] rotate-12" />
        <div className="absolute top-[25%] right-[12%] w-20 h-20 rounded-full bg-[hsl(152,69%,41%/0.06)]" />
        <div className="absolute bottom-[30%] left-[15%] w-12 h-12 rounded-full bg-[hsl(38,92%,50%/0.07)]" />
        <div className="absolute top-[40%] right-[25%] w-8 h-8 rounded-xl bg-[hsl(262,83%,58%/0.06)] rotate-45" />
      </motion.div>

      {/* Mid parallax layer — larger decorative elements */}
      <motion.div style={{ y: midY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[5%] w-32 h-32 rounded-full bg-[hsl(330,81%,60%/0.04)] blur-xl" />
        <div className="absolute bottom-[20%] left-[5%] w-40 h-40 rounded-full bg-[hsl(217,91%,60%/0.05)] blur-xl" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-24 md:py-32">
        {/* Headline */}
        <motion.div
          style={{ opacity: headlineOpacity, y: headlineY }}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight">
            Stop losing money.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
            Most people don't know where it disappears. We show you.
          </p>
        </motion.div>

        {/* Benefit cards */}
        <div className="max-w-3xl w-full space-y-5 mb-16 md:mb-20">
          {benefits.map((item, i) => (
            <motion.div
              key={item.problem}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.12,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="relative"
            >
              <div className="bg-background/80 backdrop-blur-sm border border-border/60 rounded-2xl p-7 md:p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 shadow-sm hover:shadow-md transition-shadow duration-500">
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="font-display text-xl md:text-2xl font-semibold text-muted-foreground/40 line-through">
                    {item.problem}
                  </p>
                </div>
                <div className="hidden md:block h-12 w-px bg-border shrink-0" />
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  {item.solution}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-background/80 backdrop-blur-sm border border-border/60 rounded-3xl p-10 md:p-14 text-center shadow-sm max-w-xl w-full"
        >
          <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
            Start tracking today
          </h3>
          <p className="text-muted-foreground text-sm mb-8">
            Join thousands making smarter financial decisions.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-300 hover:shadow-lg"
          >
            Try FinTrack AI
            <span className="text-lg">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSolution;
