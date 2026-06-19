import { motion } from "framer-motion";

/** Shared dreamy pastel background: blobs + grid + particles */
const BackgroundFX = ({ variant = "default" }: { variant?: "default" | "soft" | "vivid" }) => {
  const intensity = variant === "vivid" ? 0.55 : variant === "soft" ? 0.25 : 0.4;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210,100%,98%)] via-white to-[hsl(280,60%,98%)]" />

      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(220,40%,90%,0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(220,40%,90%,0.4) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Blobs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-20 w-[520px] h-[520px] rounded-full blur-[120px]"
        style={{ background: `hsl(200,100%,80%,${intensity})` }}
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full blur-[140px]"
        style={{ background: `hsl(270,100%,85%,${intensity * 0.9})` }}
      />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[130px]"
        style={{ background: `hsl(150,80%,82%,${intensity * 0.7})` }}
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px]"
        style={{ background: `hsl(25,100%,86%,${intensity * 0.6})` }}
      />

      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[hsl(220,90%,70%)] to-[hsl(280,80%,75%)] opacity-50"
          style={{
            left: `${(i * 83) % 100}%`,
            top: `${(i * 47) % 100}%`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: 6 + (i % 5),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundFX;
