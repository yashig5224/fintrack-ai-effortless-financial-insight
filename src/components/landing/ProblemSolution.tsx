import { motion } from "framer-motion";

const problems = [
  {
    problem: "Overspending",
    solution: "AI-powered budget alerts that warn you before you exceed limits.",
  },
  {
    problem: "No visibility",
    solution: "Real-time dashboards with category breakdowns and trend analysis.",
  },
  {
    problem: "Missed savings",
    solution: "Smart savings goals with automated tracking and recommendations.",
  },
];

const ProblemSolution = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Large faded background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.03 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="font-display text-[12rem] md:text-[20rem] font-bold tracking-tighter leading-none"
        >
          ₹₹₹
        </motion.p>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
            Stop losing money.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
            Most people don't know where their money goes. We fix that.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-6">
          {problems.map((item, i) => (
            <motion.div
              key={item.problem}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="glass-card p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8"
            >
              <div className="shrink-0">
                <p className="font-display text-2xl md:text-3xl font-bold line-through text-muted-foreground/40">
                  {item.problem}
                </p>
              </div>
              <div className="h-px md:h-12 md:w-px bg-border shrink-0" />
              <p className="text-muted-foreground leading-relaxed">
                {item.solution}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
