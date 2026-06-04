// Phase 6 — Premium investor-grade PDF report system.
// 10-page report with branded layout, gradient hero, charts, AI summaries,
// forecasts, transaction intelligence and a forward action plan.
// Every figure is derived from real Supabase data passed in via ReportInput.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { computeHealthScore } from "./financialHealth";
import { computeForecast } from "./forecastEngine";
import { supabase } from "@/integrations/supabase/client";

export type ReportKind =
  | "monthly"
  | "goals"
  | "ai_insights"
  | "spending"
  | "elite_forecast";

export interface ReportTx {
  id: string;
  title: string;
  amount: number;
  type: string;
  category: string | null;
  transaction_date: string;
  recurring?: boolean | null;
  payment_method?: string | null;
}
export interface ReportGoal {
  id?: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  category: string | null;
}
export interface ReportBudget {
  id?: string;
  category: string;
  monthly_limit: number;
  spent_amount: number;
  month: string;
}

export interface ReportInput {
  kind: ReportKind;
  userName: string;
  userId?: string;
  currency: string;
  monthlyIncome: number;
  transactions: ReportTx[];
  goals: ReportGoal[];
  budgets?: ReportBudget[];
  stats: { income: number; expenses: number; balance: number; savings: number; savingsRate: number };
  categoryData: Array<{ name: string; value: number }>;
  trendData: Array<{ name: string; income: number; expense: number }>;
  tier: "free" | "pro" | "elite";
}

// ----- design tokens -----
const INK: [number, number, number] = [15, 23, 42];        // slate-900
const MUTED: [number, number, number] = [100, 116, 139];   // slate-500
const LINE: [number, number, number] = [226, 232, 240];    // slate-200
const SURFACE: [number, number, number] = [248, 250, 252]; // slate-50
const PRIMARY: [number, number, number] = [99, 102, 241];  // indigo-500
const ACCENT: [number, number, number] = [139, 92, 246];   // violet-500
const PINK: [number, number, number] = [217, 70, 239];     // fuchsia-500
const GOOD: [number, number, number] = [16, 185, 129];
const BAD: [number, number, number] = [239, 68, 68];
const WARN: [number, number, number] = [245, 158, 11];

const CAT_HEX: Record<string, [number, number, number]> = {
  Food: [245, 158, 11], Shopping: [236, 72, 153], Travel: [59, 130, 246],
  Bills: [139, 92, 246], Entertainment: [6, 182, 212], Health: [16, 185, 129],
  Education: [99, 102, 241], Salary: [34, 197, 94], Investment: [14, 165, 233],
  Other: [148, 163, 184],
};
const palette = (i: number): [number, number, number] => {
  const arr: [number, number, number][] = [PRIMARY, ACCENT, PINK, GOOD, WARN, [59,130,246], [236,72,153], [6,182,212], [16,185,129], [148,163,184]];
  return arr[i % arr.length];
};

const fmt = (n: number, c = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n || 0);
const pct = (n: number) => `${Math.round(n)}%`;

// ----- low-level helpers -----
type Doc = jsPDF;
const W = (d: Doc) => d.internal.pageSize.getWidth();
const H = (d: Doc) => d.internal.pageSize.getHeight();

function gradientFill(doc: Doc, x: number, y: number, w: number, h: number, stops: [number, number, number][]) {
  const bands = 80;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    const seg = t * (stops.length - 1);
    const idx = Math.floor(seg); const local = seg - idx;
    const a = stops[idx]; const b = stops[Math.min(stops.length - 1, idx + 1)];
    const r = a[0] + (b[0] - a[0]) * local;
    const g = a[1] + (b[1] - a[1]) * local;
    const bl = a[2] + (b[2] - a[2]) * local;
    doc.setFillColor(r, g, bl);
    doc.rect(x + (w / bands) * i, y, w / bands + 0.6, h, "F");
  }
}

function brandedHeader(doc: Doc, title: string, subtitle: string, tier: string) {
  gradientFill(doc, 0, 0, W(doc), 44, [PRIMARY, ACCENT, PINK]);
  // logo
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, 12, 22, 22, 5, 5, "F");
  doc.setTextColor(...PRIMARY);
  doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("FT", 31, 26, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("FinTrack AI", 50, 22);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("Personal Financial Operating System", 50, 30);
  // tier pill
  const pill = tier === "elite" ? "ELITE AI+" : tier === "pro" ? "PRO AI" : "STARTER";
  const pw = doc.getTextWidth(pill) + 14;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(W(doc) - pw - 20, 14, pw, 16, 8, 8, "F");
  doc.setTextColor(...PRIMARY);
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text(pill, W(doc) - pw / 2 - 20, 24, { align: "center" });
  // title
  doc.setTextColor(...INK); doc.setFontSize(18); doc.setFont("helvetica", "bold");
  doc.text(title, 20, 64);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
  doc.text(subtitle, 20, 72);
}

function pageNumbersAndFooter(doc: Doc) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE); doc.setLineWidth(0.4);
    doc.line(20, H(doc) - 22, W(doc) - 20, H(doc) - 22);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
    doc.text("FinTrack AI · Confidential financial intelligence", 20, H(doc) - 12);
    doc.text(`Page ${i} of ${total}`, W(doc) - 20, H(doc) - 12, { align: "right" });
  }
}

function sectionLabel(doc: Doc, kicker: string, title: string, y: number) {
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY);
  doc.text(kicker.toUpperCase(), 20, y);
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
  doc.text(title, 20, y + 10);
  doc.setDrawColor(...PRIMARY); doc.setLineWidth(1);
  doc.line(20, y + 14, 44, y + 14);
  return y + 26;
}

function statCard(doc: Doc, x: number, y: number, w: number, h: number, label: string, value: string, accent: [number, number, number]) {
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 6, 6, "F");
  doc.setDrawColor(...LINE); doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 6, 6, "S");
  // accent bar
  doc.setFillColor(...accent);
  doc.roundedRect(x, y, 3, h, 1.5, 1.5, "F");
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), x + 9, y + 11);
  doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
  doc.text(value, x + 9, y + 24);
}

function statRow(doc: Doc, y: number, items: { label: string; value: string; tone?: [number, number, number] }[]) {
  const gap = 8;
  const totalW = W(doc) - 40;
  const cw = (totalW - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => statCard(doc, 20 + i * (cw + gap), y, cw, 34, it.label, it.value, it.tone || PRIMARY));
  return y + 42;
}

function donut(doc: Doc, cx: number, cy: number, r: number, data: { name: string; value: number }[]) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    doc.setDrawColor(...LINE); doc.setLineWidth(8);
    doc.circle(cx, cy, r, "S"); return;
  }
  let start = -Math.PI / 2;
  data.forEach((d, i) => {
    const angle = (d.value / total) * Math.PI * 2;
    const steps = Math.max(8, Math.ceil(angle * 18));
    const col = CAT_HEX[d.name] || palette(i);
    doc.setDrawColor(...col); doc.setLineWidth(10);
    for (let s = 0; s < steps; s++) {
      const t1 = start + (angle * s) / steps;
      const t2 = start + (angle * (s + 1)) / steps;
      doc.line(cx + Math.cos(t1) * r, cy + Math.sin(t1) * r, cx + Math.cos(t2) * r, cy + Math.sin(t2) * r);
    }
    start += angle;
  });
  // center hole disc
  doc.setFillColor(255, 255, 255); doc.circle(cx, cy, r - 7, "F");
}

function lineChart(doc: Doc, x: number, y: number, w: number, h: number, series: { color: [number, number, number]; values: number[]; label: string }[], labels: string[]) {
  // panel
  doc.setFillColor(...SURFACE); doc.roundedRect(x, y, w, h, 6, 6, "F");
  const padL = 24, padR = 8, padT = 12, padB = 16;
  const ix = x + padL, iy = y + padT, iw = w - padL - padR, ih = h - padT - padB;
  const allVals = series.flatMap((s) => s.values);
  const max = Math.max(1, ...allVals);
  const min = Math.min(0, ...allVals);
  // y grid
  doc.setDrawColor(...LINE); doc.setLineWidth(0.2);
  for (let g = 0; g <= 4; g++) {
    const yy = iy + (ih / 4) * g;
    doc.line(ix, yy, ix + iw, yy);
    const val = max - ((max - min) / 4) * g;
    doc.setFontSize(6); doc.setTextColor(...MUTED);
    doc.text(String(Math.round(val)), x + 4, yy + 2);
  }
  // x labels
  labels.forEach((l, i) => {
    const xx = ix + (iw / Math.max(1, labels.length - 1)) * i;
    doc.setFontSize(6); doc.setTextColor(...MUTED);
    doc.text(l, xx, y + h - 4, { align: "center" });
  });
  // series
  series.forEach((s) => {
    doc.setDrawColor(...s.color); doc.setLineWidth(1.2);
    for (let i = 0; i < s.values.length - 1; i++) {
      const x1 = ix + (iw / Math.max(1, s.values.length - 1)) * i;
      const x2 = ix + (iw / Math.max(1, s.values.length - 1)) * (i + 1);
      const y1 = iy + ih - ((s.values[i] - min) / Math.max(1, max - min)) * ih;
      const y2 = iy + ih - ((s.values[i + 1] - min) / Math.max(1, max - min)) * ih;
      doc.line(x1, y1, x2, y2);
    }
    s.values.forEach((v, i) => {
      const xx = ix + (iw / Math.max(1, s.values.length - 1)) * i;
      const yy = iy + ih - ((v - min) / Math.max(1, max - min)) * ih;
      doc.setFillColor(...s.color); doc.circle(xx, yy, 1.2, "F");
    });
  });
  // legend
  let lx = x + padL;
  series.forEach((s) => {
    doc.setFillColor(...s.color); doc.circle(lx, y + 8, 1.5, "F");
    doc.setFontSize(7); doc.setTextColor(...MUTED); doc.text(s.label, lx + 4, y + 10);
    lx += doc.getTextWidth(s.label) + 16;
  });
}

function barsChart(doc: Doc, x: number, y: number, w: number, h: number, data: { label: string; income: number; expense: number }[]) {
  doc.setFillColor(...SURFACE); doc.roundedRect(x, y, w, h, 6, 6, "F");
  const padL = 24, padR = 8, padT = 16, padB = 18;
  const iw = w - padL - padR, ih = h - padT - padB;
  const ix = x + padL, iy = y + padT;
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const slot = iw / data.length;
  const bw = Math.min(10, slot / 3);
  data.forEach((d, i) => {
    const cx = ix + slot * i + slot / 2;
    const incH = (d.income / max) * ih;
    const expH = (d.expense / max) * ih;
    doc.setFillColor(...GOOD); doc.roundedRect(cx - bw - 1, iy + ih - incH, bw, incH, 1, 1, "F");
    doc.setFillColor(...BAD); doc.roundedRect(cx + 1, iy + ih - expH, bw, expH, 1, 1, "F");
    doc.setFontSize(6); doc.setTextColor(...MUTED);
    doc.text(d.label, cx, y + h - 4, { align: "center" });
  });
  doc.setFillColor(...GOOD); doc.circle(x + padL, y + 8, 1.5, "F");
  doc.setFontSize(7); doc.setTextColor(...MUTED); doc.text("Income", x + padL + 4, y + 10);
  doc.setFillColor(...BAD); doc.circle(x + padL + 38, y + 8, 1.5, "F");
  doc.text("Expense", x + padL + 42, y + 10);
}

function paragraph(doc: Doc, x: number, y: number, w: number, text: string, opts: { size?: number; color?: [number, number, number]; bold?: boolean } = {}) {
  doc.setFontSize(opts.size || 9);
  doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  doc.setTextColor(...(opts.color || INK));
  const lines = doc.splitTextToSize(text, w);
  doc.text(lines, x, y);
  return y + lines.length * (opts.size ? opts.size * 1.25 : 11);
}

function bulletList(doc: Doc, x: number, y: number, w: number, items: string[]) {
  items.forEach((it) => {
    doc.setFillColor(...PRIMARY); doc.circle(x + 2, y - 2, 1.2, "F");
    y = paragraph(doc, x + 8, y, w - 8, it) + 4;
  });
  return y;
}

function panel(doc: Doc, x: number, y: number, w: number, h: number, title?: string) {
  doc.setFillColor(255, 255, 255); doc.roundedRect(x, y, w, h, 6, 6, "F");
  doc.setDrawColor(...LINE); doc.setLineWidth(0.4); doc.roundedRect(x, y, w, h, 6, 6, "S");
  if (title) {
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...MUTED);
    doc.text(title.toUpperCase(), x + 10, y + 12);
  }
}

// ----- analytics derivations -----
function dailyTrend(txs: ReportTx[], days: number) {
  const out: { name: string; income: number; expense: number; balance: number }[] = [];
  let running = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const day = txs.filter((t) => t.transaction_date === key);
    const inc = day.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const exp = day.filter((t) => t.type !== "income").reduce((s, t) => s + Number(t.amount), 0);
    running += inc - exp;
    out.push({ name: d.toLocaleDateString("en", { month: "short", day: "numeric" }), income: inc, expense: exp, balance: running });
  }
  return out;
}

function weeklyTrend(txs: ReportTx[], weeks: number) {
  const out: { name: string; income: number; expense: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(); end.setDate(end.getDate() - i * 7);
    const start = new Date(end); start.setDate(start.getDate() - 6);
    const s = start.toISOString().slice(0, 10), e = end.toISOString().slice(0, 10);
    const week = txs.filter((t) => t.transaction_date >= s && t.transaction_date <= e);
    out.push({
      name: `W${weeks - i}`,
      income: week.filter((t) => t.type === "income").reduce((a, t) => a + Number(t.amount), 0),
      expense: week.filter((t) => t.type !== "income").reduce((a, t) => a + Number(t.amount), 0),
    });
  }
  return out;
}

function monthlyTrend(txs: ReportTx[], months: number) {
  const out: { name: string; income: number; expense: number; savings: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    const m = txs.filter((t) => t.transaction_date.startsWith(key));
    const inc = m.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const exp = m.filter((t) => t.type !== "income").reduce((s, t) => s + Number(t.amount), 0);
    out.push({ name: d.toLocaleDateString("en", { month: "short" }), income: inc, expense: exp, savings: inc - exp });
  }
  return out;
}

function topMerchants(txs: ReportTx[]) {
  const map = new Map<string, { count: number; total: number }>();
  txs.filter((t) => t.type !== "income").forEach((t) => {
    const k = (t.title || "Unknown").trim();
    const cur = map.get(k) || { count: 0, total: 0 };
    cur.count += 1; cur.total += Number(t.amount);
    map.set(k, cur);
  });
  return Array.from(map.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total).slice(0, 6);
}

function detectSubs(txs: ReportTx[]) {
  // signature: same merchant + similar amount appearing in >=2 distinct months
  const sig = new Map<string, { name: string; amount: number; months: Set<string>; total: number }>();
  txs.filter((t) => t.type !== "income").forEach((t) => {
    const key = `${(t.title || "").toLowerCase().trim()}::${Math.round(Number(t.amount) / 10) * 10}`;
    const cur = sig.get(key) || { name: t.title || "Unknown", amount: Number(t.amount), months: new Set(), total: 0 };
    cur.months.add(t.transaction_date.slice(0, 7));
    cur.total += Number(t.amount);
    sig.set(key, cur);
  });
  return Array.from(sig.values()).filter((s) => s.months.size >= 2 || txs.find((t) => t.recurring && t.title === s.name))
    .sort((a, b) => b.months.size - a.months.size).slice(0, 8);
}

// ===== PAGES =====

function pageCover(doc: Doc, input: ReportInput, healthScore: number) {
  // full bleed gradient cover
  gradientFill(doc, 0, 0, W(doc), H(doc), [[30, 27, 75], PRIMARY, ACCENT, PINK]);
  // soft overlay shapes
  doc.setFillColor(255, 255, 255);
  // logo block
  doc.roundedRect(40, 60, 32, 32, 8, 8, "F");
  doc.setTextColor(...PRIMARY); doc.setFontSize(18); doc.setFont("helvetica", "bold");
  doc.text("FT", 56, 81, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text("FinTrack AI", 80, 76);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("Personal Financial Operating System", 80, 84);

  // title
  doc.setFontSize(34); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text(titleFor(input.kind), 40, 240);
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.setTextColor(230, 230, 255);
  paragraph(doc, 40, 256, W(doc) - 80, subtitleFor(input.kind), { size: 11, color: [230, 230, 255] });

  // meta card
  const cy = 320;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(40, cy, W(doc) - 80, 130, 10, 10, "F");
  const half = (W(doc) - 80) / 2;
  const metas = [
    ["PREPARED FOR", input.userName],
    ["PLAN", input.tier === "elite" ? "Elite AI+" : input.tier === "pro" ? "Pro AI" : "Starter"],
    ["PERIOD", `${new Date(Date.now() - 30 * 86_400_000).toLocaleDateString("en", { month: "short", day: "numeric" })} → ${new Date().toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}`],
    ["GENERATED", new Date().toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })],
  ];
  metas.forEach((m, i) => {
    const col = i % 2; const row = Math.floor(i / 2);
    const x = 56 + col * half; const y = cy + 24 + row * 42;
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...MUTED);
    doc.text(m[0], x, y);
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
    doc.text(m[1], x, y + 14);
  });

  // health score badge
  const bx = W(doc) / 2;
  const by = 520;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(40, by, W(doc) - 80, 140, 10, 10, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...MUTED);
  doc.text("FINANCIAL HEALTH SCORE", 56, by + 22);
  // ring
  const rx = W(doc) - 90; const ry = by + 70;
  doc.setDrawColor(...LINE); doc.setLineWidth(8); doc.circle(rx, ry, 32, "S");
  const col: [number, number, number] = healthScore >= 75 ? GOOD : healthScore >= 50 ? PRIMARY : healthScore >= 30 ? WARN : BAD;
  doc.setDrawColor(...col); doc.setLineWidth(8);
  const steps = Math.max(8, Math.round((healthScore / 100) * 36));
  for (let i = 0; i < steps; i++) {
    const t1 = -Math.PI / 2 + ((Math.PI * 2) / 36) * i;
    const t2 = -Math.PI / 2 + ((Math.PI * 2) / 36) * (i + 1);
    doc.line(rx + Math.cos(t1) * 32, ry + Math.sin(t1) * 32, rx + Math.cos(t2) * 32, ry + Math.sin(t2) * 32);
  }
  doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.text(String(healthScore), rx, ry + 4, { align: "center" });
  doc.setFontSize(7); doc.setTextColor(...MUTED); doc.text("/ 100", rx, ry + 14, { align: "center" });
  // grade text
  doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
  const grade = healthScore >= 75 ? "Excellent" : healthScore >= 50 ? "Good" : healthScore >= 30 ? "Fair" : "Needs Attention";
  doc.text(grade, 56, by + 60);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
  paragraph(doc, 56, by + 76, W(doc) - 200, "A composite of savings rate, budget adherence, goal progress, income stability and subscription health.", { size: 9, color: MUTED });

  // footer brand line
  doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("Confidential · For internal review only · Generated by Lumo AI", W(doc) / 2, H(doc) - 24, { align: "center" });
}

function titleFor(k: ReportKind) {
  return ({
    monthly: "Monthly Financial Report",
    goals: "Goal Progress Report",
    ai_insights: "AI Insights Report",
    spending: "Spending Analytics Report",
    elite_forecast: "Elite Wealth Forecast",
  } as Record<ReportKind, string>)[k];
}
function subtitleFor(k: ReportKind) {
  return ({
    monthly: "A complete investor-grade snapshot of your financial life this period.",
    goals: "Every milestone toward your financial goals, with completion forecasts.",
    ai_insights: "Lumo AI's personalized observations, opportunities and warnings.",
    spending: "Where every unit of currency goes — categorized, ranked and modeled.",
    elite_forecast: "Forward-looking projections across spending, savings and wealth.",
  } as Record<ReportKind, string>)[k];
}

function pageExec(doc: Doc, input: ReportInput, healthScore: number) {
  brandedHeader(doc, "Executive Summary", "Your finances at a glance for this reporting period.", input.tier);
  let y = 92;
  y = statRow(doc, y, [
    { label: "Income", value: fmt(input.stats.income, input.currency), tone: GOOD },
    { label: "Expenses", value: fmt(input.stats.expenses, input.currency), tone: BAD },
    { label: "Net", value: fmt(input.stats.balance, input.currency), tone: input.stats.balance >= 0 ? GOOD : BAD },
    { label: "Savings Rate", value: pct(input.stats.savingsRate), tone: input.stats.savingsRate >= 20 ? GOOD : WARN },
  ]);

  // budget performance panel
  panel(doc, 20, y, W(doc) - 40, 110, "Budget Performance");
  const budgets = input.budgets || [];
  if (budgets.length === 0) {
    paragraph(doc, 28, y + 30, W(doc) - 56, "No budgets configured for this period. Define category budgets to unlock performance tracking, alerts and adherence scoring.", { color: MUTED });
  } else {
    let by = y + 22;
    budgets.slice(0, 5).forEach((b) => {
      const ratio = Math.min(1.4, Number(b.spent_amount) / Math.max(1, Number(b.monthly_limit)));
      const status: [number, number, number] = ratio > 1 ? BAD : ratio > 0.85 ? WARN : GOOD;
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
      doc.text(b.category, 28, by);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
      doc.text(`${fmt(Number(b.spent_amount), input.currency)} / ${fmt(Number(b.monthly_limit), input.currency)}`, W(doc) - 28, by, { align: "right" });
      by += 2;
      doc.setFillColor(...LINE); doc.roundedRect(28, by, W(doc) - 56, 3, 1.5, 1.5, "F");
      doc.setFillColor(...status); doc.roundedRect(28, by, (W(doc) - 56) * Math.min(1, ratio), 3, 1.5, 1.5, "F");
      by += 12;
    });
  }
  y += 122;

  // goal summary
  panel(doc, 20, y, W(doc) - 40, 110, "Goals Snapshot");
  if (input.goals.length === 0) {
    paragraph(doc, 28, y + 30, W(doc) - 56, "No active goals. Define an emergency fund target (3–6 months of expenses) as a starting point.", { color: MUTED });
  } else {
    let gy = y + 22;
    input.goals.slice(0, 4).forEach((g) => {
      const ratio = Math.min(1, Number(g.current_amount) / Math.max(1, Number(g.target_amount)));
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
      doc.text(g.goal_name, 28, gy);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
      doc.text(`${pct(ratio * 100)} · ${fmt(Number(g.current_amount), input.currency)} / ${fmt(Number(g.target_amount), input.currency)}`, W(doc) - 28, gy, { align: "right" });
      gy += 2;
      doc.setFillColor(...LINE); doc.roundedRect(28, gy, W(doc) - 56, 3, 1.5, 1.5, "F");
      doc.setFillColor(...ACCENT); doc.roundedRect(28, gy, (W(doc) - 56) * ratio, 3, 1.5, 1.5, "F");
      gy += 12;
    });
  }
  y += 122;

  // exec overview
  panel(doc, 20, y, W(doc) - 40, 130, "AI Executive Overview");
  const overview = execOverview(input, healthScore);
  paragraph(doc, 28, y + 26, W(doc) - 56, overview, { size: 9 });
}

function execOverview(input: ReportInput, hs: number) {
  const top = [...input.categoryData].sort((a, b) => b.value - a.value)[0];
  const name = input.userName.split(" ")[0] || "there";
  const parts: string[] = [];
  parts.push(`${name}, you recorded ${fmt(input.stats.income, input.currency)} in income against ${fmt(input.stats.expenses, input.currency)} in expenses this period, leaving a net of ${fmt(input.stats.balance, input.currency)} and a savings rate of ${pct(input.stats.savingsRate)}.`);
  if (top) parts.push(`${top.name} represented your largest spending bucket at ${fmt(top.value, input.currency)}.`);
  parts.push(`Your composite Financial Health Score is ${hs}/100 (${hs >= 75 ? "Excellent" : hs >= 50 ? "Good" : hs >= 30 ? "Fair" : "Needs Attention"}).`);
  if (input.goals.length > 0) parts.push(`You are tracking ${input.goals.length} active goal${input.goals.length > 1 ? "s" : ""}.`);
  parts.push("Pages 3 through 10 break this down in full detail with charts, predictions and a forward action plan.");
  return parts.join(" ");
}

function pageCashflow(doc: Doc, input: ReportInput) {
  brandedHeader(doc, "Cashflow Analysis", "Income, expenses and savings momentum across multiple horizons.", input.tier);
  let y = 100;
  // monthly area chart
  const monthly = monthlyTrend(input.transactions, 6);
  panel(doc, 20, y, W(doc) - 40, 130, "Monthly Income vs Expense (6 months)");
  barsChart(doc, 22, y + 16, W(doc) - 44, 110, monthly.map((m) => ({ label: m.name, income: m.income, expense: m.expense })));
  y += 142;
  // weekly + savings trend
  const weekly = weeklyTrend(input.transactions, 8);
  panel(doc, 20, y, (W(doc) - 50) / 2, 130, "Weekly Net (8 weeks)");
  lineChart(doc, 22, y + 16, (W(doc) - 50) / 2 - 4, 110, [
    { color: PRIMARY, label: "Net", values: weekly.map((w) => w.income - w.expense) },
  ], weekly.map((w) => w.name));
  panel(doc, 20 + (W(doc) - 50) / 2 + 10, y, (W(doc) - 50) / 2, 130, "Savings Trend (6 months)");
  lineChart(doc, 22 + (W(doc) - 50) / 2 + 10, y + 16, (W(doc) - 50) / 2 - 4, 110, [
    { color: GOOD, label: "Savings", values: monthly.map((m) => m.savings) },
  ], monthly.map((m) => m.name));
  y += 142;
  // narrative
  panel(doc, 20, y, W(doc) - 40, 90, "Cashflow Read");
  const lastSav = monthly[monthly.length - 1]?.savings || 0;
  const prevSav = monthly[monthly.length - 2]?.savings || 0;
  const delta = lastSav - prevSav;
  paragraph(doc, 28, y + 24, W(doc) - 56,
    `Monthly savings landed at ${fmt(lastSav, input.currency)}, ${delta >= 0 ? "up" : "down"} ${fmt(Math.abs(delta), input.currency)} versus the prior month. ${delta >= 0 ? "Momentum is on your side." : "Tightening discretionary categories next month could reverse the trend."} Your weekly net has averaged ${fmt(weekly.reduce((s, w) => s + w.income - w.expense, 0) / Math.max(1, weekly.length), input.currency)} over the last 8 weeks.`);
}

function pageCategory(doc: Doc, input: ReportInput) {
  brandedHeader(doc, "Category Analysis", "Where every unit of currency is allocated.", input.tier);
  let y = 100;
  panel(doc, 20, y, W(doc) - 40, 200, "Spending by Category");
  const items = [...input.categoryData].sort((a, b) => b.value - a.value);
  const total = items.reduce((s, d) => s + d.value, 0) || 1;
  // donut left
  donut(doc, 90, y + 110, 50, items.slice(0, 8));
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
  doc.text(fmt(total, input.currency), 90, y + 108, { align: "center" });
  doc.setFontSize(6); doc.setTextColor(...MUTED); doc.text("TOTAL SPEND", 90, y + 116, { align: "center" });
  // legend right
  let ly = y + 28;
  items.slice(0, 8).forEach((it, i) => {
    const col = CAT_HEX[it.name] || palette(i);
    doc.setFillColor(...col); doc.roundedRect(170, ly - 4, 6, 6, 1, 1, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
    doc.text(it.name, 182, ly);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
    doc.text(`${fmt(it.value, input.currency)} · ${pct((it.value / total) * 100)}`, W(doc) - 28, ly, { align: "right" });
    ly += 18;
  });
  y += 212;

  // top / lowest / growing
  const top = items[0];
  const low = items[items.length - 1];
  const cats30 = catTotals(input.transactions, 30);
  const cats60 = catTotals(input.transactions, 60, 30);
  let fastest: { name: string; growth: number } | null = null;
  cats30.forEach((v, k) => {
    const prev = cats60.get(k) || 0;
    if (prev > 0) {
      const g = ((v - prev) / prev) * 100;
      if (!fastest || g > fastest.growth) fastest = { name: k, growth: g };
    }
  });
  const cw = (W(doc) - 60) / 3;
  ([
    ["Top Category", top ? `${top.name}` : "—", top ? fmt(top.value, input.currency) : "", GOOD],
    ["Lowest Category", low ? `${low.name}` : "—", low ? fmt(low.value, input.currency) : "", PRIMARY],
    ["Fastest Growing", fastest ? `${(fastest as { name: string; growth: number }).name}` : "—", fastest ? `+${pct((fastest as { name: string; growth: number }).growth)} vs prior` : "Stable", PINK],
  ] as [string, string, string, [number, number, number]][]).forEach(([label, name, sub, c], i) => {
    const x = 20 + i * (cw + 10);
    panel(doc, x, y, cw, 70);
    doc.setFillColor(...c); doc.roundedRect(x, y, 3, 70, 1.5, 1.5, "F");
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x + 12, y + 16);
    doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
    doc.text(name, x + 12, y + 36);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
    doc.text(sub, x + 12, y + 52);
  });
}

function catTotals(txs: ReportTx[], days: number, offset = 0) {
  const end = new Date(Date.now() - offset * 86_400_000);
  const start = new Date(end); start.setDate(start.getDate() - days);
  const s = start.toISOString().slice(0, 10), e = end.toISOString().slice(0, 10);
  const m = new Map<string, number>();
  txs.filter((t) => t.type !== "income" && t.transaction_date >= s && t.transaction_date <= e).forEach((t) => {
    const c = t.category || "Other";
    m.set(c, (m.get(c) || 0) + Number(t.amount));
  });
  return m;
}

function pageGoals(doc: Doc, input: ReportInput) {
  brandedHeader(doc, "Goal Analysis", "Progress, completion forecasts and recommended contributions.", input.tier);
  let y = 100;
  if (input.goals.length === 0) {
    panel(doc, 20, y, W(doc) - 40, 80, "No Goals Defined");
    paragraph(doc, 28, y + 30, W(doc) - 56, "Define an emergency fund target (3–6 months of expenses) or a major savings goal to unlock prediction and pacing.", { color: MUTED });
    return;
  }
  const monthlySav = Math.max(1, input.stats.savings);
  input.goals.slice(0, 5).forEach((g) => {
    const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount));
    const months = Math.ceil(remaining / Math.max(1, monthlySav / Math.max(1, input.goals.length)));
    const eta = new Date(); eta.setMonth(eta.getMonth() + months);
    const ratio = Math.min(1, Number(g.current_amount) / Math.max(1, Number(g.target_amount)));
    panel(doc, 20, y, W(doc) - 40, 84);
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
    doc.text(g.goal_name, 28, y + 18);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
    doc.text(`${g.category || "Goal"} · target ${fmt(Number(g.target_amount), input.currency)}`, 28, y + 30);
    // progress
    doc.setFillColor(...LINE); doc.roundedRect(28, y + 38, W(doc) - 56, 6, 3, 3, "F");
    doc.setFillColor(...ACCENT); doc.roundedRect(28, y + 38, (W(doc) - 56) * ratio, 6, 3, 3, "F");
    doc.setFontSize(8); doc.setTextColor(...INK);
    doc.text(`${pct(ratio * 100)} complete`, 28, y + 54);
    doc.setTextColor(...MUTED);
    doc.text(`Saved ${fmt(Number(g.current_amount), input.currency)} · Remaining ${fmt(remaining, input.currency)}`, 28, y + 64);
    doc.setTextColor(...PRIMARY); doc.setFont("helvetica", "bold");
    doc.text(`Forecast completion: ${remaining === 0 ? "Achieved" : eta.toLocaleDateString("en", { month: "short", year: "numeric" })}`, W(doc) - 28, y + 64, { align: "right" });
    y += 92;
  });
  // recommendations
  if (y < H(doc) - 100) {
    panel(doc, 20, y, W(doc) - 40, 80, "AI Recommendations");
    const recs: string[] = [];
    const lagging = input.goals.find((g) => Number(g.current_amount) / Math.max(1, Number(g.target_amount)) < 0.3);
    if (lagging) recs.push(`Goal "${lagging.goal_name}" is below 30% — increase monthly contribution by 10–15% to stay on track.`);
    if (monthlySav <= 0) recs.push("Negative savings this period — automated round-up contributions can keep goals advancing during tight months.");
    if (recs.length === 0) recs.push("All goals tracking healthily. Consider adding an aspirational long-horizon goal (5+ years) to compound returns.");
    bulletList(doc, 28, y + 28, W(doc) - 56, recs);
  }
}

function pageTransactionIntel(doc: Doc, input: ReportInput) {
  brandedHeader(doc, "Transaction Intelligence", "Top transactions, recurring patterns, subscriptions and merchants.", input.tier);
  let y = 100;
  // top transactions
  const topTx = [...input.transactions].filter((t) => t.type !== "income").sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 6);
  panel(doc, 20, y, W(doc) - 40, 130, "Top Transactions");
  let ty = y + 22;
  topTx.forEach((t) => {
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
    doc.text(t.title, 28, ty);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
    doc.text(`${t.category || "Other"} · ${t.transaction_date}`, 28, ty + 10);
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...BAD);
    doc.text(`-${fmt(Number(t.amount), input.currency)}`, W(doc) - 28, ty + 6, { align: "right" });
    ty += 18;
  });
  y += 142;

  // subscriptions + merchants side by side
  const subs = detectSubs(input.transactions);
  const merchants = topMerchants(input.transactions);
  const cw = (W(doc) - 50) / 2;
  panel(doc, 20, y, cw, 170, "Detected Subscriptions");
  let sy = y + 22;
  if (subs.length === 0) {
    paragraph(doc, 28, sy + 4, cw - 16, "No recurring subscriptions detected. Subscriptions are inferred from repeating merchant+amount signatures across multiple months.", { color: MUTED, size: 8 });
  } else {
    subs.slice(0, 6).forEach((s) => {
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
      doc.text(s.name, 28, sy);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
      doc.text(`${s.months.size} months · ~${fmt(s.amount, input.currency)}/mo`, 28, sy + 9);
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...ACCENT);
      doc.text(fmt(s.total, input.currency), 28 + cw - 24, sy + 4, { align: "right" });
      sy += 20;
    });
  }
  panel(doc, 30 + cw, y, cw, 170, "Top Merchants");
  let my = y + 22;
  merchants.forEach((m) => {
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
    doc.text(m.name, 38 + cw, my);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
    doc.text(`${m.count} visits`, 38 + cw, my + 9);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...BAD);
    doc.text(fmt(m.total, input.currency), 30 + cw * 2 - 8, my + 4, { align: "right" });
    my += 20;
  });
}

function pageAIRecommendations(doc: Doc, input: ReportInput, healthScore: number) {
  brandedHeader(doc, "AI Recommendations", "Personalized opportunities, risks and quick wins from Lumo AI.", input.tier);
  let y = 100;
  const recs = aiRecommendations(input, healthScore);
  recs.forEach((r) => {
    const lines = doc.splitTextToSize(r.body, W(doc) - 90);
    const h = 26 + lines.length * 10;
    panel(doc, 20, y, W(doc) - 40, h);
    doc.setFillColor(...(r.tone));
    doc.roundedRect(20, y, 3, h, 1.5, 1.5, "F");
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
    doc.text(r.title, 32, y + 16);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED); doc.setFontSize(9);
    doc.text(lines, 32, y + 28);
    y += h + 8;
    if (y > H(doc) - 60) return;
  });
}

interface Rec { title: string; body: string; tone: [number, number, number]; }
function aiRecommendations(input: ReportInput, hs: number): Rec[] {
  const out: Rec[] = [];
  const { stats, categoryData, goals, transactions, currency } = input;
  const top = [...categoryData].sort((a, b) => b.value - a.value)[0];
  if (stats.savingsRate < 20) out.push({ title: "Lift your savings rate", body: `Your savings rate is ${pct(stats.savingsRate)}. Reducing ${top?.name || "discretionary"} by 15% would add ~${fmt((top?.value || 0) * 0.15, currency)} to monthly savings.`, tone: WARN });
  else out.push({ title: "Strong savings discipline", body: `A ${pct(stats.savingsRate)} savings rate puts you in the top quartile. Consider auto-routing a portion to long-horizon investments.`, tone: GOOD });
  if (top) out.push({ title: `Cap ${top.name} spending`, body: `${top.name} is your largest bucket at ${fmt(top.value, currency)}. A monthly cap or a 7-day cooldown rule would meaningfully shift the curve.`, tone: PRIMARY });
  const subs = detectSubs(transactions);
  if (subs.length > 0) {
    const monthlySub = subs.reduce((s, x) => s + x.amount, 0);
    out.push({ title: "Subscription optimization", body: `${subs.length} active subscriptions detected costing ~${fmt(monthlySub, currency)}/mo. Auditing the bottom 2 typically frees 10–20% of subscription budget.`, tone: ACCENT });
  }
  if (goals.length === 0) out.push({ title: "Define your first goal", body: "No goals defined — an emergency fund of 3–6 months of expenses is the highest-leverage starting target.", tone: PINK });
  else {
    const behind = goals.find((g) => Number(g.current_amount) / Math.max(1, Number(g.target_amount)) < 0.4);
    if (behind) out.push({ title: `Accelerate "${behind.goal_name}"`, body: `Tracking under 40%. Increasing monthly contribution by ${fmt(Math.max(500, Number(behind.target_amount) * 0.02), currency)} aligns it with the original timeline.`, tone: WARN });
  }
  if (hs < 50) out.push({ title: "Health score below target", body: `Your composite score is ${hs}/100. Focus this month on budget adherence and reducing volatility in your largest categories.`, tone: BAD });
  return out.slice(0, 6);
}

function pageForecast(doc: Doc, input: ReportInput) {
  brandedHeader(doc, "Forecast", "Forward-looking projections for spending, savings and goal completion.", input.tier);
  let y = 100;
  const fc = computeForecast({ transactions: input.transactions as never, goals: input.goals as never });
  y = statRow(doc, y, [
    { label: "Next-Month Spend", value: fmt(fc.nextMonthSpending.value, input.currency), tone: BAD },
    { label: "Next-Month Savings", value: fmt(fc.nextMonthSavings.value, input.currency), tone: fc.nextMonthSavings.value >= 0 ? GOOD : BAD },
    { label: "Cash Balance", value: fmt(fc.expectedCashBalance.value, input.currency), tone: PRIMARY },
    { label: "Subscriptions", value: fmt(fc.subscriptionCost.value, input.currency), tone: ACCENT },
  ]);
  // 6-month projection chart
  const monthly = monthlyTrend(input.transactions, 6);
  const projected = [...monthly.map((m) => m.savings), fc.nextMonthSavings.value];
  panel(doc, 20, y, W(doc) - 40, 130, "Savings Projection (6 months + next)");
  lineChart(doc, 22, y + 16, W(doc) - 44, 110, [
    { color: GOOD, label: "Historical Savings", values: monthly.map((m) => m.savings) },
    { color: PRIMARY, label: "Forecast", values: projected.slice(-2).concat(Array(monthly.length - 2).fill(NaN)).map((v) => Number.isFinite(v) ? v : projected[projected.length - 1]) },
  ], [...monthly.map((m) => m.name), "Next"]);
  y += 142;

  // goal timeline
  panel(doc, 20, y, W(doc) - 40, 130, "Goal Completion Timeline");
  let gy = y + 24;
  if (fc.goalCompletions.length === 0) {
    paragraph(doc, 28, gy, W(doc) - 56, "Add goals to unlock per-goal completion forecasts.", { color: MUTED });
  } else {
    fc.goalCompletions.slice(0, 5).forEach((g) => {
      const tone: [number, number, number] = g.risk === "low" ? GOOD : g.risk === "medium" ? WARN : BAD;
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
      doc.text(g.name, 28, gy);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
      doc.text(g.etaDate ? `ETA ${g.etaDate}` : "ETA pending — increase contribution", 28, gy + 10);
      doc.setFillColor(...tone);
      doc.roundedRect(W(doc) - 60, gy - 6, 40, 14, 7, 7, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
      doc.text(g.risk.toUpperCase(), W(doc) - 40, gy + 2, { align: "center" });
      gy += 22;
    });
  }
  y += 142;
  // risks
  if (fc.risks.length > 0 && y < H(doc) - 80) {
    panel(doc, 20, y, W(doc) - 40, 70, "Risk Indicators");
    bulletList(doc, 28, y + 24, W(doc) - 56, fc.risks.slice(0, 4));
  }
}

async function pageCoachSummary(doc: Doc, input: ReportInput) {
  brandedHeader(doc, "AI Coach Summary", "Recurring themes from your recent Lumo AI conversations.", input.tier);
  let y = 100;
  let history: { message: string; ai_response: string | null; created_at: string }[] = [];
  if (input.userId) {
    const { data } = await supabase
      .from("ai_history")
      .select("message, ai_response, created_at")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false })
      .limit(10);
    history = (data as typeof history) || [];
  }
  panel(doc, 20, y, W(doc) - 40, 60, "Coach Engagement");
  doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
  doc.text(`${history.length}`, 28, y + 38);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
  doc.text("recent conversations", 50, y + 38);
  y += 72;

  panel(doc, 20, y, W(doc) - 40, H(doc) - y - 60, "Conversation Highlights");
  let cy = y + 22;
  if (history.length === 0) {
    paragraph(doc, 28, cy, W(doc) - 56, "No coach conversations yet. Open Lumo AI Coach and ask 'Where am I overspending?' to seed your personalized advisor.", { color: MUTED });
  } else {
    history.slice(0, 6).forEach((h) => {
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY);
      doc.text(new Date(h.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }), 28, cy);
      cy = paragraph(doc, 28, cy + 8, W(doc) - 56, `You: ${h.message.slice(0, 180)}${h.message.length > 180 ? "…" : ""}`, { size: 8, bold: true });
      if (h.ai_response) cy = paragraph(doc, 28, cy + 2, W(doc) - 56, `Lumo: ${h.ai_response.slice(0, 220)}${h.ai_response.length > 220 ? "…" : ""}`, { size: 8, color: MUTED });
      cy += 8;
      if (cy > H(doc) - 80) return;
    });
  }
}

function pageActionPlan(doc: Doc, input: ReportInput, hs: number) {
  brandedHeader(doc, "Financial Action Plan", "A prioritized roadmap for the next 90 days.", input.tier);
  let y = 100;
  const top = [...input.categoryData].sort((a, b) => b.value - a.value)[0];
  const subs = detectSubs(input.transactions);
  const immediate = [
    `Review the ${subs.length} detected subscriptions and cancel any not actively used.`,
    top ? `Set a cap on ${top.name} at ${fmt((top.value || 0) * 0.85, input.currency)} for next month.` : "Define a discretionary spending cap for next month.",
    "Schedule an automatic transfer of 10% of next paycheck into savings.",
  ];
  const thirty = [
    `Lift savings rate from ${pct(input.stats.savingsRate)} toward ${pct(Math.max(20, input.stats.savingsRate + 5))}.`,
    input.goals.length === 0 ? "Open an emergency fund goal (3 months of expenses)." : "Increase contribution to the lowest-progress goal by 15%.",
    "Enable budget alerts in Automation Studio for your top 3 categories.",
  ];
  const ninety = [
    `Lift composite Financial Health Score from ${hs} toward ${Math.min(100, hs + 15)}.`,
    "Build a 6-month subscription audit cadence and remove low-value services.",
    "Allocate any surplus net savings to a long-horizon investment goal.",
  ];

  const sections: { title: string; tone: [number, number, number]; items: string[] }[] = [
    { title: "Immediate (this week)", tone: BAD, items: immediate },
    { title: "30-Day Actions", tone: WARN, items: thirty },
    { title: "90-Day Strategy", tone: GOOD, items: ninety },
  ];
  sections.forEach((s) => {
    const h = 30 + s.items.length * 16;
    panel(doc, 20, y, W(doc) - 40, h);
    doc.setFillColor(...s.tone); doc.roundedRect(20, y, 3, h, 1.5, 1.5, "F");
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
    doc.text(s.title, 32, y + 18);
    let iy = y + 32;
    s.items.forEach((it) => {
      doc.setFillColor(...s.tone); doc.circle(34, iy - 2, 1.2, "F");
      iy = paragraph(doc, 40, iy, W(doc) - 70, it, { size: 9 }) + 4;
    });
    y += h + 8;
  });
}

// ===== entry =====
export async function exportReport(input: ReportInput): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // compute health score once
  const hs = computeHealthScore({
    transactions: input.transactions as never,
    goals: input.goals as never,
    budgets: (input.budgets || []) as never,
  }).score;

  // Page 1 — Cover
  pageCover(doc, input, hs);
  // Page 2 — Executive Summary
  doc.addPage(); pageExec(doc, input, hs);
  // Page 3 — Cashflow
  doc.addPage(); pageCashflow(doc, input);
  // Page 4 — Category
  doc.addPage(); pageCategory(doc, input);
  // Page 5 — Goals
  doc.addPage(); pageGoals(doc, input);
  // Page 6 — Transaction Intelligence
  doc.addPage(); pageTransactionIntel(doc, input);
  // Page 7 — AI Recommendations
  doc.addPage(); pageAIRecommendations(doc, input, hs);
  // Page 8 — Forecast
  doc.addPage(); pageForecast(doc, input);
  // Page 9 — AI Coach Summary
  doc.addPage(); await pageCoachSummary(doc, input);
  // Page 10 — Action Plan
  doc.addPage(); pageActionPlan(doc, input, hs);

  pageNumbersAndFooter(doc);
  // (silence unused autoTable warning — kept available for future tabular pages)
  void autoTable;

  const filename = `FinTrack-${input.kind}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
