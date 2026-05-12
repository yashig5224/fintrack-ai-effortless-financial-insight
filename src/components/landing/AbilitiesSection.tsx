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
    description: "AI-powered spending analysis.",
    stat: "₹4.2K",
    statLabel: "saved this month",
    accentHsl: "217 91% 60%",
  },
  {
    icon: "🏛",
    title: "Budget Architect",
    description: "Smart personalized budgeting.",
    stat: "3",
    statLabel: "budgets active",
    accentHsl: "152 69% 41%",
  },
  {
    icon: "🎯",
    title: "Goal Quest",
    description: "Track goals like achievements.",
    stat: "65%",
    statLabel: "quest complete",
    accentHsl: "38 92% 50%",
  },
  {
    icon: "🤖",
    title: "AI Finance Coach",
    description: "Gamified financial assistant.",
    stat: "24/7",
    statLabel: "always on",
    accentHsl: "262 83% 58%",
  },
  {
    icon: "📈",
    title: "Growth Engine",
    description: "Savings and wealth insights.",
    stat: "12%",
    statLabel: "avg returns",
    accentHsl: "330 81% 60%",
  },
  {
    icon: "⚡",
    title: "Live Insights",
    description: "Real-time analytics and reports.",
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
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative"
    >
      <div
        className="relative rounded-[1.5rem] p-7 md:p-8 h-full border border-border/60 bg-background/80 backdrop-blur-xl shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 overflow-hidden"
      >
        {/* Floating gradient orb */}
        <motion.div
          animate={{ y: [0, -10, 0], scale: [1, 1.05, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 4 + index * 0.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[30px] pointer-events-none"
          style={{ background: `hsl(${ability.accentHsl})` }}
        />

        {/* Tiny particle movement inside card */}
        <motion.div
          animate={{ y: [0, -15, 0], x: [0, 5, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: 3 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
          className="absolute top-1/4 right-1/4 w-1.5 h-1.5 rounded-full"
          style={{ background: `hsl(${ability.accentHsl})` }}
        />

        {/* Icon */}
        <div className="relative z-10 text-3xl md:text-4xl mb-5">{ability.icon}</div>

        {/* Title */}
        <h3 className="relative z-10 font-display text-lg md:text-xl font-semibold text-foreground mb-2 tracking-tight">
          {ability.title}
        </h3>

        {/* Description */}
        <p className="relative z-10 text-muted-foreground text-sm leading-relaxed mb-6">
          {ability.description}
        </p>

        {/* Stat */}
        <div className="relative z-10 flex items-baseline gap-2 pt-4 border-t border-border/50">
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
    <section className="relative py-24 md:py-36 overflow-hidden bg-background">
      {/* Soft pastel blobs */}
      <div className="absolute top-20 left-[10%] w-[500px] h-[500px] rounded-full bg-[hsl(217,91%,60%/0.04)] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-[10%] w-[400px] h-[400px] rounded-full bg-[hsl(262,83%,58%/0.04)] blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-xs tracking-[0.25em] uppercase mb-4 font-medium text-muted-foreground">
            ✦ Premium Tools
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-5">
            Unlock Your Financial
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(262,83%,58%)] to-[hsl(217,91%,60%)]">
              Superpowers
            </span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
            Everything you need to track, grow, and master your money.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {abilities.map((ability, i) => (
            <AbilityCard key={ability.title} ability={ability} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AbilitiesSection;