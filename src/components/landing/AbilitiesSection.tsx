import { motion } from "framer-motion";
import { useRef } from "react";

interface Ability {
  emoji: string;
  title: string;
  description: string;
  stat: string;
  statLabel: string;
  gradient: string;
  glowColor: string;
  borderColor: string;
}

const abilities: Ability[] = [
  {
    emoji: "🔍",
    title: "Smart Spend Scanner",
    description: "AI detects wasteful spending and shows insights automatically.",
    stat: "₹4.2K",
    statLabel: "saved this month",
    gradient: "from-[hsl(217,80%,12%)] to-[hsl(217,60%,22%)]",
    glowColor: "hsl(217, 91%, 60%)",
    borderColor: "hsl(217,91%,60%)",
  },
  {
    emoji: "🏗️",
    title: "Budget Builder",
    description: "Auto-create budgets based on your income patterns.",
    stat: "3",
    statLabel: "budgets active",
    gradient: "from-[hsl(152,60%,10%)] to-[hsl(152,50%,20%)]",
    glowColor: "hsl(152, 69%, 41%)",
    borderColor: "hsl(152,69%,41%)",
  },
  {
    emoji: "⚔️",
    title: "Goal Quest System",
    description: "Turn goals into missions with progress tracking.",
    stat: "65%",
    statLabel: "quest complete",
    gradient: "from-[hsl(38,80%,12%)] to-[hsl(38,60%,22%)]",
    glowColor: "hsl(38, 92%, 50%)",
    borderColor: "hsl(38,92%,50%)",
  },
  {
    emoji: "🤖",
    title: "AI Finance Coach",
    description: "Chat with your personal AI assistant for advice.",
    stat: "24/7",
    statLabel: "always on",
    gradient: "from-[hsl(262,60%,12%)] to-[hsl(262,50%,22%)]",
    glowColor: "hsl(262, 83%, 58%)",
    borderColor: "hsl(262,83%,58%)",
  },
  {
    emoji: "📈",
    title: "Wealth Growth Engine",
    description: "Investment + savings projections powered by AI.",
    stat: "12%",
    statLabel: "avg returns",
    gradient: "from-[hsl(330,60%,12%)] to-[hsl(330,50%,22%)]",
    glowColor: "hsl(330, 81%, 60%)",
    borderColor: "hsl(330,81%,60%)",
  },
  {
    emoji: "⚡",
    title: "Real-time Reports",
    description: "Live analytics with charts and trends.",
    stat: "Live",
    statLabel: "data sync",
    gradient: "from-[hsl(180,60%,10%)] to-[hsl(180,50%,20%)]",
    glowColor: "hsl(180, 70%, 45%)",
    borderColor: "hsl(180,70%,45%)",
  },
];

const AbilityCard = ({ ability, index }: { ability: Ability; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.6, type: "spring", stiffness: 120 }}
      whileHover={{ y: -12, scale: 1.03 }}
      className="group relative cursor-pointer"
    >
      {/* Glow behind card */}
      <div
        className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500"
        style={{ background: ability.glowColor }}
      />

      <div
        className="relative rounded-3xl p-6 md:p-8 border overflow-hidden h-full"
        style={{
          background: `linear-gradient(135deg, ${ability.gradient.includes("from-") ? "" : ""}hsl(250,50%,8%), hsl(260,40%,12%))`,
          borderColor: `${ability.glowColor}30`,
        }}
      >
        {/* Gradient overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${ability.gradient} opacity-60`}
        />

        {/* Floating particles on hover */}
        <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ y: [-20, -60], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: ability.glowColor,
                left: `${15 + i * 15}%`,
                bottom: "20%",
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          {/* Emoji icon */}
          <motion.div
            className="text-4xl md:text-5xl mb-5"
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
            transition={{ duration: 0.4 }}
          >
            {ability.emoji}
          </motion.div>

          {/* Title */}
          <h3 className="font-display text-lg md:text-xl font-bold text-white mb-2 tracking-tight">
            {ability.title}
          </h3>

          {/* Description */}
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            {ability.description}
          </p>

          {/* Stat bar */}
          <div
            className="flex items-baseline gap-2 pt-4 border-t"
            style={{ borderColor: `${ability.glowColor}20` }}
          >
            <span
              className="text-2xl md:text-3xl font-bold font-display"
              style={{ color: ability.glowColor }}
            >
              {ability.stat}
            </span>
            <span className="text-white/30 text-xs">{ability.statLabel}</span>
          </div>
        </div>

        {/* Corner accent */}
        <div
          className="absolute top-0 right-0 w-20 h-20 opacity-20 group-hover:opacity-40 transition-opacity"
          style={{
            background: `radial-gradient(circle at top right, ${ability.glowColor}, transparent 70%)`,
          }}
        />
      </div>
    </motion.div>
  );
};

const AbilitiesSection = () => {
  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      {/* Dark background for this section */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(250,50%,6%)] via-[hsl(260,40%,8%)] to-[hsl(250,50%,6%)]" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(260,80%,60%) 1px, transparent 1px), linear-gradient(90deg, hsl(260,80%,60%) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16 md:mb-20"
        >
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs tracking-[0.3em] uppercase mb-4 font-medium"
            style={{ color: "hsl(260, 80%, 70%)" }}
          >
            ⚡ Unlock Your Powers ⚡
          </motion.p>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-5">
            Your Financial
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, hsl(260,80%,70%), hsl(330,80%,60%), hsl(38,92%,50%))",
              }}
            >
              Superpowers
            </span>
          </h2>
          <p className="text-white/35 max-w-lg mx-auto text-sm md:text-base">
            Each ability is designed to level up your financial game. Activate them all.
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
