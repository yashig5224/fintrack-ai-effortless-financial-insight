import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="section-padding">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            Take control of your
            <br />
            money today.
          </h2>
          <p className="mt-6 text-muted-foreground text-lg max-w-md mx-auto">
            Join thousands who've transformed their financial habits with
            AI-powered insights.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-10"
          >
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-foreground text-background px-10 py-5 rounded-full text-sm font-medium hover:opacity-90 transition-all duration-300 hover:shadow-xl hover:shadow-foreground/10"
            >
              Start for free
              <span className="text-lg">→</span>
            </Link>
          </motion.div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · Free forever for basic features
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-6 mt-32 pt-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-8">
          <p className="font-display font-bold text-sm">
            FinTrack<span className="text-muted-foreground font-normal">AI</span>
          </p>
          <p className="text-xs text-muted-foreground">
            © 2026 FinTrack AI. All rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
