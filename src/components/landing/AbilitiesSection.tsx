import { motion } from "framer-motion";

interface Ability {
  icon: string;
  title: string;
  description: string;
  stat: string;
  statLabel: string;
  accentHsl: string;
}

const abilities: Ability[] = [
  {
    icon: "👁",
    title: "Expense Vision",
    description: "AI detects wasteful spending and surfaces insights automatically.",
    stat: "₹4.2K",
    statLabel: "saved this month",
    accentHsl: "217 91% 60%",
  },
  {
    icon: "🏛",
    title: "Budget Architect",
    description: "Auto-create budgets based on your income patterns.",
    stat: "3",
    statLabel: "budgets active",
    accentHsl: "152 69% 41%",
  },
  {
    icon: "🎯",
    title: "Goal Quest",
    description: "Turn goals into missions with progress tracking.",
    stat: "65%",
    statLabel: "quest complete",
    accentHsl: "38 92% 50%",
  },
  {
    icon: "🤖",
    title: "AI Finance Coach",
    description: "Chat with your personal AI assistant for advice.",
    stat: "24/7",
    statLabel: "always on",
    accentHsl: "262 83% 58%",
  },
  {
    icon: "📈",
    title: "Growth Engine",
    description: "Investment + savings projections powered by AI.",
    stat: "12%",
    statLabel: "avg returns",
    accentHsl: "330 81% 60%",
  },
  {
    icon: "⚡",
    title: "Live Insights",
    description: "Real-time analytics with charts and trends.",
    stat: "Live",
    statLabel: "data sync",
    accentHsl: "180 70% 45%",
  },
];

const AbilityCard = ({ ability, index }: { ability: Ability; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -6 }}
      className="group relative"
    >
      <div
        className="relative rounded-3xl p-7 md:p-8 h-full border border-border/60 bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-500"
      >
        {/* Icon */}
        <div className="text-3xl md:text-4xl mb-5">{ability.icon}</div>

        {/* Title */}
        <h3 className="font-display text-lg md:text-xl font-semibold text-foreground mb-2 tracking-tight">
          {ability.title}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          {ability.description}
        </p>

        {/* Stat */}
        <div className="flex items-baseline gap-2 pt-4 border-t border-border/50">
          <span
            className="text-2xl md:text-3xl font-bold font-display"
            style={{ color: `hsl(${ability.accentHsl})` }}
          >
            {ability.stat}
          </span>
          <span className="text-muted-foreground/60 text-xs">{ability.statLabel}</span>
        </div>

        {/* Subtle top accent line */}
        <div
          className="absolute top-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, transparent, hsl(${ability.accentHsl} / 0.4), transparent)` }}
        />
      </div>
    </motion.div>
  );
};

const AbilitiesSection = () => {
  return (
    <section className="relative py-24 md:py-36 overflow-hidden bg-[hsl(0,0%,98%)]">
      {/* Soft pastel blobs */}
      <div className="absolute top-20 left-[10%] w-[500px] h-[500px] rounded-full bg-[hsl(217,91%,60%/0.06)] blur-[100px]" />
      <div className="absolute bottom-20 right-[10%] w-[400px] h-[400px] rounded-full bg-[hsl(262,83%,58%/0.05)] blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(152,69%,41%/0.04)] blur-[120px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-xs tracking-[0.25em] uppercase mb-4 font-medium text-muted-foreground">
            ✦ Powerful Tools
          </p>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight mb-5">
            Unlock Your Financial
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-muted-foreground to-foreground">
              Superpowers
            </span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
            Everything you need to master your money — intelligent, effortless, beautiful.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {abilities.map((ability, i) => (
            <AbilityCard key={ability.title} ability={ability} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AbilitiesSection;
