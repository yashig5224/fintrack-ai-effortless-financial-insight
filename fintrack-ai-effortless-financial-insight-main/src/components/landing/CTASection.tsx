import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { lumoAvatar } from "@/assets/personas";
import BackgroundFX from "./BackgroundFX";

const CTASection = () => {
  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      <BackgroundFX variant="vivid" />
      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative inline-block mb-8"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(220,100%,80%)] to-[hsl(280,90%,82%)] blur-2xl"
          />
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-24 h-24 rounded-full bg-gradient-to-br from-white to-[hsl(220,100%,97%)] p-1.5 border border-white shadow-[0_15px_40px_-10px_rgba(120,90,220,0.4)]"
          >
            <img src={lumoAvatar} alt="" className="w-full h-full rounded-full object-cover" />
          </motion.div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-[-0.04em] leading-[1.02]"
        >
          Your financial{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(220,95%,55%)] via-[hsl(260,85%,60%)] to-[hsl(300,80%,65%)]">
            transformation
          </span>
          <br />starts today.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-foreground/65 text-base md:text-lg max-w-lg mx-auto"
        >
          Join 20,000+ people leveling up their money game with Lumo.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/login?signup=1"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[hsl(220,95%,55%)] via-[hsl(260,85%,60%)] to-[hsl(290,80%,62%)] text-white font-medium shadow-[0_15px_45px_-10px_rgba(120,90,220,0.6)] hover:shadow-[0_20px_55px_-10px_rgba(120,90,220,0.75)] hover:-translate-y-0.5 transition-all"
          >
            Create Account
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/85 backdrop-blur-md border border-white text-foreground font-medium hover:bg-white shadow-md hover:-translate-y-0.5 transition-all"
          >
            <Sparkles className="w-4 h-4 text-[hsl(260,80%,60%)]" />
            Try Demo
          </Link>
        </motion.div>

        <p className="mt-5 text-xs text-foreground/55">No credit card required · Free forever for basics</p>
      </div>
    </section>
  );
};

export default CTASection;
