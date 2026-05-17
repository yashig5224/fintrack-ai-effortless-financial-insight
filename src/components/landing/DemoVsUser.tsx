import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, User, Check } from "lucide-react";

const cards = [
  {
    title: "Demo Mode",
    subtitle: "Explore in seconds",
    icon: Sparkles,
    gradient: "from-[hsl(220,100%,95%)] via-[hsl(260,100%,96%)] to-[hsl(280,100%,97%)]",
    accent: "220,90%,55%",
    items: [
      "Preloaded AI conversations",
      "Sample dashboards & charts",
      "All 6 personas unlocked",
      "Zero signup required",
    ],
    cta: "Try Demo",
    href: "/dashboard",
  },
  {
    title: "User Mode",
    subtitle: "Make it yours",
    icon: User,
    gradient: "from-[hsl(150,80%,94%)] via-[hsl(170,80%,95%)] to-[hsl(190,80%,96%)]",
    accent: "150,70%,40%",
    items: [
      "Real transaction tracking",
      "Personalized AI insights",
      "Save goals across devices",
      "Lumo learns your patterns",
    ],
    cta: "Sign Up Free",
    href: "/login?signup=1",
  },
];

const DemoVsUser = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white to-[hsl(220,100%,99%)]" />
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-xs tracking-[0.25em] uppercase text-foreground/55 mb-3 font-medium">✦ Choose Your Mode</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em]">
            Play first, or{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(220,90%,55%)] to-[hsl(280,80%,62%)]">
              go all in
            </span>.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -8 }}
                className={`relative rounded-3xl p-7 md:p-9 bg-gradient-to-br ${c.gradient} border border-white/90 shadow-[0_20px_60px_-20px_rgba(120,90,220,0.25)] overflow-hidden`}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 5, repeat: Infinity, delay: i * 0.5 }}
                  className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl"
                  style={{ background: `hsl(${c.accent},0.25)` }}
                />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-md border border-white shadow-sm flex items-center justify-center">
                      <Icon className="w-5 h-5" style={{ color: `hsl(${c.accent})` }} />
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: `hsl(${c.accent})` }}>{c.subtitle}</div>
                  </div>
                  <h3 className="font-display text-3xl font-bold mb-5">{c.title}</h3>
                  <ul className="space-y-2.5 mb-7">
                    {c.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
                        <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: `hsl(${c.accent})` }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={c.href}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/90 backdrop-blur-md border border-white text-sm font-semibold text-foreground hover:bg-white hover:-translate-y-0.5 transition-all shadow-md"
                  >
                    {c.cta} →
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DemoVsUser;
