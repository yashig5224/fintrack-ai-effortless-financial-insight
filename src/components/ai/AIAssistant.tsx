import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import TransitionOverlay from "./TransitionOverlay";
import PersonaSelection from "./PersonaSelection";
import MissionDashboard from "./MissionDashboard";
import type { Persona } from "./PersonaSelection";

type Phase = "transition" | "persona" | "mission";

const AIAssistant = () => {
  const [phase, setPhase] = useState<Phase>("transition");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const handleTransitionComplete = useCallback(() => {
    setPhase("persona");
  }, []);

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
    setPhase("mission");
  };

  const handleBack = () => {
    setSelectedPersona(null);
    setPhase("persona");
  };

  return (
    <>
      <TransitionOverlay
        isVisible={phase === "transition"}
        onComplete={handleTransitionComplete}
      />
      <AnimatePresence mode="wait">
        {phase === "persona" && (
          <PersonaSelection key="persona" onSelect={handlePersonaSelect} />
        )}
        {phase === "mission" && selectedPersona && (
          <MissionDashboard
            key="mission"
            persona={selectedPersona}
            onBack={handleBack}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
