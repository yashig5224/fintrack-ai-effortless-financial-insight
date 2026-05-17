import { motion } from "framer-motion";
import { personaGrid, personaCells } from "@/assets/personas";

const personas = [
  { id: "student", name: "Student Saver", desc: "Hostel budgets, side income, smart spending.", tint: "from-[hsl(220,100%,90%)] to-[hsl(200,100%,93%)]" },
  { id: "salary", name: "Salary Warrior", desc: "Monthly paychecks, EMIs, family goals.", tint: "from-[hsl(260,80%,92%)] to-[hsl(280,80%,94%)]" },
  { id: "investor", name: "Smart Investor", desc: "Portfolio tracking, rebalancing, growth.", tint: "from-[hsl(150,80%,90%)] to-[hsl(170,80%,93%)]" },
  { id: "hustler", name: "Side Hustler", desc: "Multiple income streams, freelance flow.", tint: "from-[hsl(280,80%,92%)] to-[hsl(300,80%,94%)]" },
  { id: "minimalist", name: "Minimalist Planner", desc: "Less stuff, more savings, mindful spend.", tint: "from-[hsl(25,100%,92%)] to-[hsl(40,100%,94%)]" },
  { id: "luxury", name: "Luxury Dreamer", desc: "Aspirational goals, premium experiences.", tint: "from-[hsl(45,100%,90%)] to-[hsl(30,100%,93%)]" },
];

const PersonasShowcase = () => {
  return (
    <section id="personas" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[hsl(220,100%,99%)] to-white" />
      <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(260,40%,85%)] to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-xs tracking-[0.25em] uppercase text-foreground/55 mb-3 font-medium">
            ✦ Choose Your Path
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em]">
            A persona for every{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(220,90%,55%)] to-[hsl(280,80%,62%)]">money mindset</span>.
          </h2>
          <p className="mt-4 text-foreground/65 max-w-xl mx-auto">
            Lumo adapts coaching to who you are — student, investor, hustler, dreamer.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {personas.map((p, i) => {
            const cell = personaCells[p.id];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="group relative rounded-3xl p-5 bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_-10px_rgba(120,90,220,0.15)] hover:shadow-[0_20px_50px_-15px_rgba(120,90,220,0.3)] transition-all duration-500 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${p.tint} opacity-50 group-hover:opacity-90 transition-opacity duration-500`} />
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white/60 border border-white/80 mb-4"
                  style={{
                    backgroundImage: `url(${personaGrid})`,
                    backgroundSize: "400% 200%",
                    backgroundPosition: `${cell.x} ${cell.y}`,
                  }}
                />
                <div className="relative">
                  <h3 className="font-display text-base md:text-lg font-bold text-foreground">{p.name}</h3>
                  <p className="text-xs text-foreground/65 mt-1 leading-relaxed">{p.desc}</p>
                </div>
                {/* Particles on hover */}
                <motion.span
                  className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-[hsl(260,80%,70%)] opacity-0 group-hover:opacity-100"
                  animate={{ y: [0, -20, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PersonasShowcase;
