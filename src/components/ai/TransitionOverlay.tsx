import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface TransitionOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
}

const TransitionOverlay = ({ isVisible, onComplete }: TransitionOverlayProps) => {
  const [loadingText, setLoadingText] = useState("Entering AI Finance World");
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isVisible) return;

    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 200);

    const timer = setTimeout(onComplete, 900); // 900ms transition as requested

    return () => {
      clearInterval(dotInterval);
      clearTimeout(timer);
    };
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)", scale: 1.05 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background/80"
        >
          {/* Floating gradient overlay expanding */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.5, 2], opacity: [0, 1, 1] }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute inset-0 bg-gradient-to-br from-[hsl(262,83%,58%/0.15)] via-transparent to-[hsl(217,91%,60%/0.15)] rounded-full blur-[100px]"
          />

          {/* Floating Coins / Particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                y: "100vh", 
                x: `${(Math.random() - 0.5) * 100}vw`, 
                scale: Math.random() * 0.5 + 0.5,
                rotate: Math.random() * 360
              }}
              animate={{ 
                y: "-20vh",
                rotate: Math.random() * 360 + 360
              }}
              transition={{ 
                duration: 0.8 + Math.random() * 0.4, 
                ease: "easeOut",
              }}
              className="absolute w-8 h-8 rounded-full border-2 border-[hsl(38,92%,50%/0.4)] bg-[hsl(38,92%,50%/0.2)] backdrop-blur-sm flex items-center justify-center text-xs shadow-[0_0_15px_rgba(250,200,50,0.3)]"
            >
              <div className="w-4 h-4 rounded-full border border-[hsl(38,92%,50%/0.5)]" />
            </motion.div>
          ))}

          {/* Center content: Zoom animation */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 text-center px-6"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="text-6xl sm:text-7xl mb-6 drop-shadow-2xl"
            >
              🔮
            </motion.div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
              {loadingText}
              <span className="text-muted-foreground w-8 inline-block text-left">{dots}</span>
            </h1>

            {/* Quick loading bar */}
            <motion.div className="w-64 h-1.5 bg-border/40 rounded-full mx-auto overflow-hidden mt-8">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.7, ease: "circOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[hsl(262,83%,58%)] via-[hsl(217,91%,60%)] to-[hsl(152,69%,41%)]"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransitionOverlay;