import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(330, 81%, 60%)",
  "hsl(217, 91%, 60%)",
  "hsl(152, 69%, 41%)",
];

const transactions = [
  { name: "Swiggy Order", category: "Food", amount: -520, date: "Today" },
  { name: "Salary Credit", category: "Income", amount: 55000, date: "Yesterday" },
  { name: "Uber Ride", category: "Transport", amount: -340, date: "Yesterday" },
  { name: "Netflix", category: "Entertainment", amount: -649, date: "2 days ago" },
  { name: "Grocery Store", category: "Food", amount: -1240, date: "3 days ago" },
];

const DashboardPreview = () => {
  return (
    <section id="dashboard" className="section-padding bg-secondary/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4 font-medium">
            Your command center
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
            Everything at a glance
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-card p-6 md:p-8 max-w-5xl mx-auto shadow-2xl shadow-foreground/5"
        >
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Balance", value: "₹1,24,500", change: "+12%" },
              { label: "Income", value: "₹55,000", change: "+8%" },
              { label: "Expenses", value: "₹27,940", change: "-5%" },
              { label: "Savings Goal", value: "68%", change: "₹3.4L / 5L" },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="p-4 rounded-xl bg-background border border-border"
              >
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="font-display text-lg md:text-xl font-bold mt-1">
                  {card.value}
                </p>
                <p className="text-xs text-success mt-0.5">{card.change}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Area chart */}
            <div className="md:col-span-2 bg-background rounded-xl border border-border p-4">
              <p className="text-sm font-medium mb-4">Income vs Expenses</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(152, 69%, 41%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(152, 69%, 41%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(0,0%,100%)",
                      border: "1px solid hsl(0,0%,91%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => `₹${v.toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="income" stroke="hsl(152, 69%, 41%)" fill="url(#incomeGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="hsl(0, 72%, 51%)" fill="url(#expenseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="bg-background rounded-xl border border-border p-4">
              <p className="text-sm font-medium mb-2">By Category</p>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[i] }} />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className="font-medium">₹{cat.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-background rounded-xl border border-border p-4">
            <p className="text-sm font-medium mb-3">Recent Transactions</p>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{tx.name}</p>
                    <p className="text-xs text-muted-foreground">{tx.category} · {tx.date}</p>
                  </div>
                  <p className={`text-sm font-medium ${tx.amount > 0 ? "text-success" : "text-foreground"}`}>
                    {tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardPreview;
