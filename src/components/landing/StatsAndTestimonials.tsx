import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

const stats = [
  { value: 12, suffix: "M+", label: "Tracked in ₹" },
  { value: 20, suffix: "K+", label: "Active users" },
  { value: 1.4, suffix: "M", label: "AI insights" },
  { value: 38, suffix: "K", label: "Goals achieved" },
];

const reviews = [
  { name: "Aanya P.", role: "Designer · Mumbai", quote: "Lumo replaced my spreadsheet and my anxiety. Truly feels like a friend who knows money.", color: "220,100%,90%" },
  { name: "Karan S.", role: "Founder · Bangalore", quote: "The persona AI nailed my hustler chaos. Side income tracking has never been this fun.", color: "280,90%,92%" },
  { name: "Riya M.", role: "Student · Delhi", quote: "Cancelled 4 useless subscriptions in week one. Saved more than my Netflix and Spotify combined.", color: "150,80%,90%" },
  { name: "Vikram T.", role: "Engineer · Pune", quote: "Beautiful, fast, and gives advice that actually compounds. 10/10 fintech experience.", color: "25,100%,90%" },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1500;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(+(eased * value).toFixed(value < 10 ? 1 : 0));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);
  return <span ref={ref}>{n}{suffix}</span>;
}

const StatsAndTestimonials = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[hsl(220,100%,99%)] to-white" />
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-24"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-3xl p-6 md:p-7 bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_10px_30px_-12px_rgba(120,90,220,0.18)] text-center"
            >
              <div className="font-display text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-[hsl(220,90%,55%)] to-[hsl(280,80%,62%)]">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <div className="text-xs md:text-sm text-foreground/60 mt-1.5">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-xs tracking-[0.25em] uppercase text-foreground/55 mb-3 font-medium">✦ Loved by users</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em]">
            Real money,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(220,90%,55%)] to-[hsl(280,80%,62%)]">
              real wins
            </span>.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="relative rounded-3xl p-6 bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_10px_30px_-12px_rgba(120,90,220,0.18)] hover:shadow-[0_20px_45px_-15px_rgba(120,90,220,0.3)] transition-all overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl" style={{ background: `hsl(${r.color},0.6)` }} />
              <div className="relative">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-[hsl(45,95%,55%)] text-[hsl(45,95%,55%)]" />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-5">"{r.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br shadow-sm" style={{ background: `linear-gradient(135deg, hsl(${r.color}), white)` }} />
                  <div>
                    <div className="text-sm font-semibold">{r.name}</div>
                    <div className="text-[11px] text-foreground/55">{r.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsAndTestimonials;
