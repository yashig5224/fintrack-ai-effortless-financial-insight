import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TransitionOverlay from "@/components/ai/TransitionOverlay";
import PersonaSelection from "@/components/ai/PersonaSelection";
import MissionDashboard from "@/components/ai/MissionDashboard";
import type { Persona } from "@/components/ai/PersonaSelection";

type Phase = "transition" | "persona" | "mission";

const StarField = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 60 }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.1, 0.8, 0.1] }}
        transition={{
          duration: 2 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 3,
        }}
        className="absolute w-[2px] h-[2px] bg-white rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
      />
    ))}
  </div>
);

const Coach = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("transition");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleTransitionComplete = () => setPhase("persona");

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
    setPhase("mission");
  };

  const handleBack = () => {
    if (phase === "mission") {
      setSelectedPersona(null);
      setPhase("persona");
    } else {
      navigate("/dashboard");
    }
  };

  const handleExit = () => navigate("/dashboard");

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Immersive background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(250,50%,8%)] via-[hsl(260,40%,10%)] to-[hsl(220,50%,6%)]" />
      <StarField />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -200, -400],
              x: [0, Math.sin(i) * 60, Math.cos(i) * 40],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 6 + i * 0.8,
              repeat: Infinity,
              delay: i * 1.2,
              ease: "easeOut",
            }}
            className="absolute text-xl"
            style={{
              left: `${10 + i * 11}%`,
              bottom: "-20px",
            }}
          >
            {["🪙", "💎", "⭐", "✨", "💰", "🏆", "📈", "🎯"][i]}
          </motion.div>
        ))}
      </div>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(260,80%,60%) 1px, transparent 1px), linear-gradient(90deg, hsl(260,80%,60%) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Mountain silhouette */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 200" className="w-full opacity-20" preserveAspectRatio="none">
          <path
            d="M0,200 L0,140 Q100,80 200,120 Q350,40 500,100 Q600,60 720,90 Q850,30 960,80 Q1100,20 1200,70 Q1300,40 1440,100 L1440,200 Z"
            fill="hsl(260,30%,12%)"
          />
          <path
            d="M0,200 L0,160 Q150,120 300,150 Q450,100 600,140 Q750,90 900,130 Q1050,80 1200,120 Q1350,100 1440,140 L1440,200 Z"
            fill="hsl(260,25%,8%)"
          />
        </svg>
      </div>

      {/* Transition overlay */}
      <TransitionOverlay
        isVisible={phase === "transition"}
        onComplete={handleTransitionComplete}
      />

      {/* Content phases */}
      <AnimatePresence mode="wait">
        {phase === "persona" && (
          <motion.div
            key="persona"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10"
          >
            {/* Back button for persona phase */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              onClick={handleExit}
              className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm"
            >
              ← Back to Dashboard
            </motion.button>
            <PersonaSelection onSelect={handlePersonaSelect} />
          </motion.div>
        )}

        {phase === "mission" && selectedPersona && (
          <motion.div
            key="mission"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10"
          >
            <MissionDashboard persona={selectedPersona} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Coach;
