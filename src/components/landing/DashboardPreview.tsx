import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { getCategoryIcon } from "@/assets/icons";

const areaData = [
  { month: "Jan", income: 45000, expense: 32000 },
  { month: "Feb", income: 48000, expense: 35000 },
  { month: "Mar", income: 45000, expense: 28000 },
  { month: "Apr", income: 52000, expense: 38000 },
  { month: "May", income: 50000, expense: 30000 },
  { month: "Jun", income: 55000, expense: 34000 },
];

const categoryData = [
  { name: "Food", value: 8240 },
  { name: "Transport", value: 4500 },
  { name: "Shopping", value: 6200 },
  { name: "Bills", value: 5800 },
  { name: "Entertainment", value: 3200 },
];
const CAT_COLORS = [
  "hsl(25, 90%, 60%)",
  "hsl(260, 80%, 65%)",
  "hsl(320, 80%, 65%)",
  "hsl(210, 90%, 60%)",
  "hsl(150, 70%, 50%)",
];

const transactions = [
  { name: "Swiggy Order", category: "Food", amount: -520, date: "Today" },
  { name: "Salary Credit", category: "Salary", amount: 55000, date: "Yesterday" },
  { name: "Uber Ride", category: "Travel", amount: -340, date: "Yesterday" },
  { name: "Netflix", category: "Entertainment", amount: -649, date: "2d ago" },
  { name: "Grocery Store", category: "Food", amount: -1240, date: "3d ago" },
];

const DashboardPreview = () => {
  return (
    <section id="dashboard" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[hsl(220,80%,98%)] to-white" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[hsl(220,100%,92%,0.4)] to-[hsl(280,80%,94%,0.4)] blur-[150px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-xs tracking-[0.25em] uppercase text-foreground/55 mb-3 font-medium">
            ✦ Command Center
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em]">
            Your finances,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(220,90%,55%)] to-[hsl(280,80%,62%)]">
              one beautiful view
            </span>.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[2rem] p-1.5 bg-gradient-to-br from-white/90 via-white/70 to-white/50 border border-white/80 shadow-[0_40px_100px_-30px_rgba(120,90,220,0.35)] backdrop-blur-2xl"
        >
          <div className="rounded-[1.65rem] bg-white/85 p-5 md:p-8">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              {[
                { label: "Balance", value: "₹1,24,500", change: "+12%", tint: "220,95%,60%" },
                { label: "Income", value: "₹55,000", change: "+8%", tint: "150,75%,45%" },
                { label: "Expenses", value: "₹27,940", change: "-5%", tint: "25,90%,55%" },
                { label: "Savings", value: "68%", change: "₹3.4L / 5L", tint: "280,80%,62%" },
              ].map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="relative rounded-2xl p-4 bg-white border border-white/90 shadow-sm overflow-hidden"
                >
                  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl" style={{ background: `hsl(${c.tint},0.18)` }} />
                  <p className="relative text-[10px] uppercase tracking-wider text-foreground/55 font-medium">{c.label}</p>
                  <p className="relative font-display text-lg md:text-2xl font-bold mt-1">{c.value}</p>
                  <p className="relative text-[10px] mt-0.5 font-medium" style={{ color: `hsl(${c.tint})` }}>{c.change}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-5 mb-6">
              <div className="md:col-span-2 rounded-2xl bg-white border border-white/90 p-4 md:p-5 shadow-sm">
                <p className="text-sm font-semibold mb-4">Income vs Expenses</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="incomeGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(220, 95%, 60%)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(220, 95%, 60%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(280, 80%, 65%)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(280, 80%, 65%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 30%, 92%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220,15%,55%)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(220,15%,55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(220,30%,92%)", borderRadius: "12px", fontSize: "12px", boxShadow: "0 10px 30px -10px rgba(120,90,220,0.2)" }} formatter={(v: number) => `₹${v.toLocaleString()}`} />
                    <Area type="monotone" dataKey="income" stroke="hsl(220, 95%, 60%)" fill="url(#incomeGrad2)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="expense" stroke="hsl(280, 80%, 65%)" fill="url(#expenseGrad2)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl bg-white border border-white/90 p-4 shadow-sm">
                <p className="text-sm font-semibold mb-2">By Category</p>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={32} outerRadius={56} dataKey="value" strokeWidth={0}>
                      {categoryData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {categoryData.map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[i] }} />
                        <span className="text-foreground/65">{cat.name}</span>
                      </div>
                      <span className="font-medium">₹{cat.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-white/90 p-4 md:p-5 shadow-sm">
              <p className="text-sm font-semibold mb-3">Recent Transactions</p>
              <div className="space-y-2.5">
                {transactions.map((tx) => (
                  <div key={tx.name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={getCategoryIcon(tx.category)} alt="" className="w-9 h-9 rounded-xl object-contain bg-gradient-to-br from-[hsl(220,100%,97%)] to-[hsl(280,100%,98%)] p-1.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.name}</p>
                        <p className="text-[11px] text-foreground/55">{tx.category} · {tx.date}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold whitespace-nowrap ${tx.amount > 0 ? "text-[hsl(150,70%,40%)]" : "text-foreground"}`}>
                      {tx.amount > 0 ? "+" : "-"}₹{Math.abs(tx.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardPreview;
