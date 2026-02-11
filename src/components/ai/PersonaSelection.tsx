import { motion } from "framer-motion";
import { useState } from "react";

export interface Persona {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  gradient: string;
  accentColor: string;
  stats: { label: string; value: string }[];
  pixelColors: string[];
}

const personas: Persona[] = [
  {
    id: "student",
    name: "Student Saver",
    emoji: "🎓",
    tagline: "Every rupee counts",
    description: "Master budgeting on a tight schedule. Track expenses and build your first emergency fund.",
    gradient: "from-[hsl(217,80%,20%)] to-[hsl(217,60%,35%)]",
    accentColor: "hsl(217, 91%, 60%)",
    pixelColors: ["hsl(217,91%,60%)", "hsl(217,91%,45%)", "hsl(217,70%,70%)"],
    stats: [
      { label: "Savings", value: "₹3K/mo" },
      { label: "Focus", value: "Budgets" },
      { label: "Level", value: "⭐⭐" },
    ],
  },
  {
    id: "warrior",
    name: "Salary Warrior",
    emoji: "⚔️",
    tagline: "Conquer your paycheck",
    description: "You just started earning. Learn to manage taxes, investments, and lifestyle balance.",
    gradient: "from-[hsl(152,60%,18%)] to-[hsl(152,50%,30%)]",
    accentColor: "hsl(152, 69%, 41%)",
    pixelColors: ["hsl(152,69%,41%)", "hsl(152,69%,30%)", "hsl(152,50%,55%)"],
    stats: [
      { label: "Savings", value: "₹15K/mo" },
      { label: "Focus", value: "Growth" },
      { label: "Level", value: "⭐⭐⭐" },
    ],
  },
  {
    id: "hustler",
    name: "Side Hustler",
    emoji: "🚀",
    tagline: "Multiple streams, one dashboard",
    description: "Freelancing, gig work, passion projects — track all your income streams.",
    gradient: "from-[hsl(38,80%,20%)] to-[hsl(38,70%,35%)]",
    accentColor: "hsl(38, 92%, 50%)",
    pixelColors: ["hsl(38,92%,50%)", "hsl(38,92%,38%)", "hsl(38,70%,65%)"],
    stats: [
      { label: "Streams", value: "3+" },
      { label: "Focus", value: "Income" },
      { label: "Level", value: "⭐⭐⭐" },
    ],
  },
  {
    id: "investor",
    name: "Smart Investor",
    emoji: "📈",
    tagline: "Make money work for you",
    description: "Stocks, mutual funds, crypto — get AI insights on portfolio and risk.",
    gradient: "from-[hsl(262,60%,18%)] to-[hsl(262,50%,30%)]",
    accentColor: "hsl(262, 83%, 58%)",
    pixelColors: ["hsl(262,83%,58%)", "hsl(262,83%,42%)", "hsl(262,60%,70%)"],
    stats: [
      { label: "Returns", value: "12%/yr" },
      { label: "Focus", value: "Invest" },
      { label: "Level", value: "⭐⭐⭐⭐" },
    ],
  },
  {
    id: "master",
    name: "Budget Master",
    emoji: "🏆",
    tagline: "Maximum control, zero waste",
    description: "Simplify your finances. Cut subscriptions, reduce waste, achieve financial zen.",
    gradient: "from-[hsl(330,60%,18%)] to-[hsl(330,50%,30%)]",
    accentColor: "hsl(330, 81%, 60%)",
    pixelColors: ["hsl(330,81%,60%)", "hsl(330,81%,42%)", "hsl(330,60%,70%)"],
    stats: [
      { label: "Savings", value: "40%+" },
      { label: "Focus", value: "Control" },
      { label: "Level", value: "⭐⭐⭐⭐⭐" },
    ],
  },
];

// Pixel art avatar renderer
const PixelAvatar = ({ colors, isHovered, isSelected }: { colors: string[]; isHovered: boolean; isSelected: boolean }) => {
  // 8x8 pixel grid representing a blocky character
  const grid = [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 2, 2, 2, 2, 1, 0],
    [0, 1, 0, 2, 2, 0, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
  ];

  return (
    <motion.div
      animate={
        isSelected
          ? { scale: [1, 1.3, 0], rotate: [0, 10, 0] }
          : isHovered
          ? { y: [0, -6, 0] }
          : { y: [0, -3, 0] }
      }
      transition={
        isSelected
          ? { duration: 0.6 }
          : { duration: isHovered ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" }
      }
      className="mx-auto mb-4"
    >
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(8, 1fr)", width: "72px" }}>
        {grid.flat().map((cell, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: cell > 0 ? 1 : 0, scale: cell > 0 ? 1 : 0 }}
            transition={{ delay: i * 0.008, duration: 0.2 }}
            className="aspect-square rounded-[2px]"
            style={{
              background: cell > 0 ? colors[cell - 1] || colors[0] : "transparent",
              boxShadow: cell > 0 && isHovered ? `0 0 8px ${colors[0]}80` : "none",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

interface PersonaSelectionProps {
  onSelect: (persona: Persona) => void;
}

const PersonaSelection = ({ onSelect }: PersonaSelectionProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (persona: Persona) => {
    setSelectedId(persona.id);
    setTimeout(() => onSelect(persona), 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden"
    >
      {/* Gradient sky background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(250,50%,10%)] via-[hsl(260,40%,15%)] to-[hsl(220,50%,8%)]" />

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
            }}
          />
        ))}
      </div>

      {/* Ground blocks */}
      <div className="absolute bottom-0 left-0 right-0 h-16 flex">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 border-t-2 border-[hsl(120,30%,25%)]"
            style={{
              background: i % 2 === 0 ? "hsl(120, 25%, 18%)" : "hsl(120, 25%, 15%)",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs tracking-[0.3em] uppercase text-[hsl(260,80%,70%)] mb-3 font-medium"
          >
            ⬜ Select Your Character ⬜
          </motion.p>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-3 text-white">
            Choose Your Financial Persona
          </h1>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Each character has unique abilities. Pick the one that matches your financial journey.
          </p>
        </motion.div>

        {/* Character cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {personas.map((persona, i) => {
            const isHovered = hoveredId === persona.id;
            const isSelected = selectedId === persona.id;
            const isOther = selectedId && !isSelected;

            return (
              <motion.button
                key={persona.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{
                  opacity: isOther ? 0.2 : 1,
                  y: 0,
                  scale: isSelected ? 1.1 : 1,
                }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5, type: "spring", stiffness: 200 }}
                whileHover={!selectedId ? { y: -12, scale: 1.05 } : {}}
                onHoverStart={() => setHoveredId(persona.id)}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => !selectedId && handleSelect(persona)}
                className={`relative text-center p-4 md:p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  isSelected
                    ? "border-white/50 shadow-[0_0_40px_rgba(139,92,246,0.4)]"
                    : isHovered
                    ? "border-white/30 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                    : "border-white/10"
                }`}
                style={{
                  background: `linear-gradient(to bottom, ${persona.accentColor}15, ${persona.accentColor}05)`,
                }}
              >
                {/* Glow effect */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at 50% 30%, ${persona.accentColor}30, transparent 70%)`,
                    }}
                  />
                )}

                <div className="relative z-10">
                  {/* Pixel Avatar */}
                  <PixelAvatar colors={persona.pixelColors} isHovered={isHovered} isSelected={isSelected} />

                  {/* Name */}
                  <h3 className="font-display text-sm md:text-base font-bold text-white mb-1">
                    {persona.name}
                  </h3>
                  <p className="text-[10px] md:text-xs text-white/40 italic mb-3">
                    "{persona.tagline}"
                  </p>

                  {/* Stats */}
                  <div className="space-y-1 pt-2 border-t border-white/10">
                    {persona.stats.map((stat) => (
                      <div key={stat.label} className="flex justify-between text-[10px] md:text-xs">
                        <span className="text-white/40">{stat.label}</span>
                        <span className="text-white font-medium">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected check */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: persona.accentColor }}
                  >
                    ✓
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Bottom hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center text-white/20 text-xs mt-8"
        >
          Click a character to begin your mission
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PersonaSelection;
export { personas };
