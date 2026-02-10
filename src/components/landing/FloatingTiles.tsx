import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const pieData = [
  { name: "Food", value: 35 },
  { name: "Transport", value: 20 },
  { name: "Shopping", value: 25 },
  { name: "Bills", value: 20 },
];
const COLORS = ["hsl(38, 92%, 50%)", "hsl(262, 83%, 58%)", "hsl(330, 81%, 60%)", "hsl(217, 91%, 60%)"];

const tiles = [
  {
    title: "Saved this week",
    content: (
      <div>
        <p className="font-display text-2xl font-bold text-success">₹2,400</p>
        <p className="text-xs text-muted-foreground mt-1">+18% vs last week</p>
      </div>
    ),
    delay: 0,
    position: "top-0 left-0 md:left-[5%]",
    floatClass: "animate-float",
  },
  {
    title: "Spending breakdown",
    content: (
      <div className="w-20 h-20 mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={18} outerRadius={32} dataKey="value" strokeWidth={0}>
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    ),
    delay: 0.1,
    position: "top-0 right-0 md:right-[5%]",
    floatClass: "animate-float-slow",
  },
  {
    title: "Budget progress",
    content: (
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Food</span>
          <span className="font-medium">72%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "72%" }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full rounded-full"
            style={{ background: "hsl(38, 92%, 50%)" }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Transport</span>
          <span className="font-medium">45%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "45%" }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.7 }}
            className="h-full rounded-full"
            style={{ background: "hsl(262, 83%, 58%)" }}
          />
        </div>
      </div>
    ),
    delay: 0.2,
    position: "bottom-0 left-[5%] md:left-[15%]",
    floatClass: "animate-float",
  },
  {
    title: "⚠️ Anomaly detected",
    content: (
      <p className="text-xs text-muted-foreground">
        Unusual ₹4,200 charge at <span className="text-foreground font-medium">Electronics Hub</span> — verify this transaction.
      </p>
    ),
    delay: 0.3,
    position: "bottom-0 right-[5%] md:right-[15%]",
    floatClass: "animate-float-slow",
  },
];

const FloatingTiles = () => {
  return (
    <section id="features" className="section-padding overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4 font-medium">
            Everything you need
          </p>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Meet FinTrack AI
          </h2>
        </motion.div>

        {/* Tiles grid */}
        <div className="relative max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {tiles.map((tile, i) => (
              <motion.div
                key={tile.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: tile.delay + 0.2 }}
                className={`glass-card p-6 ${tile.floatClass}`}
              >
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {tile.title}
                </p>
                {tile.content}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FloatingTiles;
