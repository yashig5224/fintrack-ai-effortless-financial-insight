import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface TransitionOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
}

const FloatingCoin = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    initial={{ opacity: 0, y: y + 40, x, scale: 0 }}
    animate={{
      opacity: [0, 1, 1, 0],
      y: [y + 40, y - 60, y - 120, y - 180],
      x: [x, x + Math.sin(delay * 3) * 30, x - Math.sin(delay * 2) * 20, x],
      scale: [0, 1.2, 1, 0.5],
      rotate: [0, 180, 360, 540],
    }}
    transition={{ duration: 2.5, delay: delay * 0.15, ease: "easeOut" }}
    className="absolute text-2xl md:text-3xl pointer-events-none"
    style={{ left: "50%", top: "50%" }}
  >
    {["💰", "🪙", "💎", "⭐", "✨", "🏆", "📈", "🎯"][Math.floor(delay) % 8]}
  </motion.div>
);

const TransitionOverlay = ({ isVisible, onComplete }: TransitionOverlayProps) => {
  const [loadingText, setLoadingText] = useState("Entering AI Finance World");
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isVisible) return;

    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    const texts = [
      "Entering AI Finance World",
      "Loading your financial data",
      "Preparing AI Coach",
      "Almost ready",
    ];
    let textIdx = 0;
    const textInterval = setInterval(() => {
      textIdx = (textIdx + 1) % texts.length;
      setLoadingText(texts[textIdx]);
    }, 1200);

    const timer = setTimeout(onComplete, 3500);

    return () => {
      clearInterval(dotInterval);
      clearInterval(textInterval);
      clearTimeout(timer);
    };
  }, [isVisible, onComplete]);

  const coins = Array.from({ length: 16 }, (_, i) => ({
    delay: i,
    x: (Math.random() - 0.5) * 400,
    y: (Math.random() - 0.5) * 200,
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        >
          {/* Background layers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-[hsl(250,60%,8%)] via-[hsl(260,50%,12%)] to-[hsl(220,60%,6%)]"
          />

          {/* Animated grid */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "linear-gradient(hsl(260,80%,60%) 1px, transparent 1px), linear-gradient(90deg, hsl(260,80%,60%) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          {/* Radial glow */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(260,80%,50%) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />

          {/* Floating coins */}
          <div className="absolute inset-0">
            {coins.map((coin, i) => (
              <FloatingCoin key={i} {...coin} />
            ))}
          </div>

          {/* Center content */}
          <div className="relative z-10 text-center px-6">
            {/* Pulsing icon */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl md:text-8xl mb-8"
            >
              🎮
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-display text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight"
            >
              {loadingText}
              <span className="text-[hsl(260,80%,70%)]">{dots}</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/50 text-sm md:text-base mb-10"
            >
              Your personalized finance adventure awaits
            </motion.p>

            {/* Loading bar */}
            <motion.div className="w-64 md:w-80 h-2 bg-white/10 rounded-full mx-auto overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3.2, ease: "easeInOut" }}
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, hsl(260,80%,60%), hsl(330,80%,60%), hsl(38,92%,50%))",
                }}
              />
            </motion.div>

            {/* Pixel art decorations */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex justify-center gap-3 mt-8"
            >
              {["⬜", "🟪", "🟦", "🟩", "🟨"].map((block, i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.12,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                  className="text-lg"
                >
                  {block}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransitionOverlay;
