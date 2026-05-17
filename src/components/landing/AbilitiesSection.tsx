import { motion } from "framer-motion";
import {
  Wallet, Bot, BarChart3, Target, FileBarChart, UserCog,
  Bell, Tags, Brain, Trophy,
} from "lucide-react";

const features = [
  { icon: Wallet, title: "Smart Budgeting", desc: "AI-built budgets that adapt to your life.", tint: "220,95%,60%" },
  { icon: Bot, title: "AI Coach", desc: "Lumo answers any finance question, instantly.", tint: "280,80%,62%" },
  { icon: BarChart3, title: "Spending Analytics", desc: "See where every rupee goes, beautifully.", tint: "200,90%,55%" },
  { icon: Target, title: "Goal Tracking", desc: "Gamified quests for every dream.", tint: "150,75%,45%" },
  { icon: FileBarChart, title: "Reports & Insights", desc: "Monthly stories, not boring spreadsheets.", tint: "25,90%,55%" },
  { icon: UserCog, title: "Personalized", desc: "Per-persona intelligence, your way.", tint: "330,80%,60%" },
  { icon: Bell, title: "Smart Alerts", desc: "Catch overspending before it hurts.", tint: "0,80%,65%" },
  { icon: Tags, title: "Auto Categorize", desc: "Every transaction tagged automatically.", tint: "190,80%,50%" },
  { icon: Brain, title: "AI Predictions", desc: "Forecast spending & savings ahead.", tint: "260,75%,60%" },
  { icon: Trophy, title: "Gamified Progress", desc: "Levels, streaks, XP for money habits.", tint: "45,95%,55%" },
];

const AbilitiesSection = () => {
  return (
    <section id="features" className="relative py-24 md:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[hsl(220,100%,99%)] to-white" />
      <div className="absolute top-20 -left-20 w-[500px] h-[500px] rounded-full bg-[hsl(220,100%,90%,0.3)] blur-[120px]" />
      <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] rounded-full bg-[hsl(280,80%,92%,0.3)] blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-[0.25em] uppercase text-foreground/55 mb-3 font-medium">
            ✦ Financial Superpowers
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em]">
            Everything you need.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(220,90%,55%)] to-[hsl(280,80%,62%)]">
              Nothing you don't.
            </span>
          </h2>
        </motion.div>

        {/* Asymmetric bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[200px] gap-4 md:gap-5">
          {features.map((f, i) => {
            // Make some cards larger for asymmetric feel
            const span =
              i === 0 ? "col-span-2 row-span-2" :
              i === 3 ? "md:col-span-2" :
              i === 6 ? "md:row-span-2" : "";
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className={`group relative rounded-3xl p-5 md:p-6 bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_-12px_rgba(120,90,220,0.15)] hover:shadow-[0_18px_45px_-15px_rgba(120,90,220,0.3)] transition-all duration-500 overflow-hidden ${span}`}
              >
                {/* Floating tint orb */}
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 5 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl"
                  style={{ background: `hsl(${f.tint},0.25)` }}
                />
                <div
                  className="relative w-11 h-11 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500"
                  style={{ background: `linear-gradient(135deg, hsl(${f.tint},0.18), hsl(${f.tint},0.06))` }}
                >
                  <Icon className="w-5 h-5" style={{ color: `hsl(${f.tint})` }} />
                </div>
                <h3 className="relative font-display text-base md:text-lg font-bold text-foreground">{f.title}</h3>
                <p className="relative text-xs md:text-sm text-foreground/65 mt-1.5 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AbilitiesSection;
