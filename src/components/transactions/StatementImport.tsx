import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, Check, AlertCircle, Loader2, Sparkles, Trash2, History as HistoryIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Parsed = {
  date: string;
  description: string;
  merchant: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  balance: number | null;
  recurring: boolean;
  _dup?: boolean;
  _skip?: boolean;
};

const CATEGORIES = ["Food", "Shopping", "Travel", "Bills", "Entertainment", "Health", "Education", "Salary", "Investment", "Transfer", "Other"];

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  onImported: () => void;
  existing: { transaction_date: string; amount: number; title: string }[];
  currency?: string;
}

export default function StatementImport({ open, onClose, userId, onImported, existing, currency = "INR" }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"upload" | "parsing" | "preview" | "saving" | "done">("upload");
  const [rows, setRows] = useState<Parsed[]>([]);
  const [meta, setMeta] = useState<{ bank?: string; period?: string }>({});
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    supabase.from("statement_imports").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => setHistory(data || []));
  }, [open, userId, stage]);

  const reset = () => {
    setFile(null); setStage("upload"); setRows([]); setMeta({}); setSummary(null);
  };

  const handleFile = async (f: File) => {
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF statement");
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      toast.error("File too large (max 15 MB)");
      return;
    }
    setFile(f);
    setStage("parsing");

    try {
      const base64 = await fileToBase64(f);
      const { data, error } = await supabase.functions.invoke("parse-statement", {
        body: { fileBase64: base64, fileName: f.name, mimeType: f.type || "application/pdf" },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);

      const parsed = (data as any).transactions as Parsed[];
      // Duplicate detection
      const existingKeys = new Set(existing.map(e => keyFor(e.transaction_date, e.amount, e.title)));
      const flagged = parsed.map(r => ({
        ...r,
        _dup: existingKeys.has(keyFor(r.date, r.amount, r.merchant || r.description)),
        _skip: false,
      }));
      setRows(flagged);
      setMeta({ bank: (data as any).bank, period: (data as any).period });
      setStage("preview");
    } catch (e: any) {
      toast.error(e.message || "Failed to parse statement");
      setStage("upload");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
  };

  const updateRow = (i: number, patch: Partial<Parsed>) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const importNow = async () => {
    setStage("saving");
    try {
      // Upload file to storage
      const path = `${userId}/${Date.now()}-${file!.name}`;
      const upRes = await supabase.storage.from("statements").upload(path, file!, {
        contentType: file!.type || "application/pdf", upsert: false,
      });
      // ignore storage error softly — continue with import metadata

      const toImport = rows.filter(r => !r._skip && !r._dup);
      const skipped = rows.filter(r => r._skip).length;
      const duplicates = rows.filter(r => r._dup).length;

      const insights = buildSummary(toImport);

      // Create statement_imports row first
      const { data: imp, error: impErr } = await supabase.from("statement_imports").insert({
        user_id: userId,
        file_name: file!.name,
        file_path: upRes.error ? null : path,
        file_size: file!.size,
        source_type: "pdf",
        bank_hint: meta.bank || null,
        transaction_count: toImport.length,
        skipped_count: skipped,
        duplicate_count: duplicates,
        status: "completed",
        summary: insights,
      }).select().single();
      if (impErr) throw impErr;

      if (toImport.length > 0) {
        const payload = toImport.map(r => ({
          user_id: userId,
          title: r.merchant || r.description.slice(0, 80),
          amount: r.amount,
          type: r.type === "transfer" ? "expense" : r.type,
          category: r.category,
          note: r.description,
          recurring: r.recurring || false,
          transaction_date: r.date,
          source: `statement:${meta.bank || "pdf"}`,
          statement_import_id: imp.id,
        }));
        // chunked insert
        for (let i = 0; i < payload.length; i += 100) {
          const slice = payload.slice(i, i + 100);
          const { error } = await supabase.from("transactions").insert(slice);
          if (error) throw error;
        }
      }

      setSummary({ ...insights, imported: toImport.length, skipped, duplicates });
      setStage("done");
      onImported();
      toast.success(`Imported ${toImport.length} transactions`);
    } catch (e: any) {
      toast.error(e.message || "Import failed");
      setStage("preview");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" /> Smart Statement Import
            </h2>
            <p className="text-sm text-gray-500 mt-1">Upload a PDF — AI extracts and categorizes every transaction.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {stage === "upload" && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
                  dragging ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-gray-300 bg-gray-50"
                }`}
              >
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="font-semibold text-gray-900">Drop your PDF here, or click to browse</p>
                <p className="text-sm text-gray-500 mt-1">Supports HDFC, ICICI, SBI, Axis, Kotak, IDFC, Yes, AU & more</p>
                <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>

              {history.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <HistoryIcon className="w-4 h-4" /> Recent imports
                  </h3>
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div key={h.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{h.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(h.created_at).toLocaleDateString()} • {h.transaction_count} imported
                              {h.duplicate_count > 0 && ` • ${h.duplicate_count} duplicates`}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">{h.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === "parsing" && (
            <div className="py-20 text-center">
              <Loader2 className="w-10 h-10 mx-auto text-violet-500 animate-spin mb-4" />
              <p className="font-semibold text-gray-900">Reading your statement…</p>
              <p className="text-sm text-gray-500 mt-1">Extracting transactions and categorizing with AI.</p>
            </div>
          )}

          {stage === "preview" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                  {rows.length} transactions found
                </span>
                {meta.bank && <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">{meta.bank}</span>}
                {meta.period && <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">{meta.period}</span>}
                <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
                  {rows.filter(r => r._dup).length} duplicates
                </span>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="max-h-[50vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                        <th className="p-3">Date</th>
                        <th className="p-3">Merchant</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Type</th>
                        <th className="p-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} className={`border-t border-gray-100 ${r._dup ? "bg-amber-50/40" : r._skip ? "opacity-40" : ""}`}>
                          <td className="p-3 text-gray-600 whitespace-nowrap">{r.date}</td>
                          <td className="p-3">
                            <input value={r.merchant || r.description} onChange={(e) => updateRow(i, { merchant: e.target.value })}
                              className="w-full bg-transparent focus:bg-white border border-transparent focus:border-gray-200 rounded-lg px-2 py-1 outline-none" />
                            {r._dup && <span className="text-[10px] text-amber-700 ml-2">duplicate</span>}
                          </td>
                          <td className="p-3 text-right font-medium tabular-nums">
                            <input type="number" value={r.amount} onChange={(e) => updateRow(i, { amount: Number(e.target.value) })}
                              className="w-24 text-right bg-transparent focus:bg-white border border-transparent focus:border-gray-200 rounded-lg px-2 py-1 outline-none" />
                          </td>
                          <td className="p-3">
                            <select value={r.category} onChange={(e) => updateRow(i, { category: e.target.value })}
                              className="bg-transparent focus:bg-white border border-transparent focus:border-gray-200 rounded-lg px-2 py-1 outline-none">
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td className="p-3">
                            <select value={r.type} onChange={(e) => updateRow(i, { type: e.target.value as any })}
                              className="bg-transparent focus:bg-white border border-transparent focus:border-gray-200 rounded-lg px-2 py-1 outline-none">
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                              <option value="transfer">Transfer</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <button onClick={() => updateRow(i, { _skip: !r._skip })}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {stage === "saving" && (
            <div className="py-20 text-center">
              <Loader2 className="w-10 h-10 mx-auto text-violet-500 animate-spin mb-4" />
              <p className="font-semibold text-gray-900">Saving transactions…</p>
            </div>
          )}

          {stage === "done" && summary && (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-violet-50 border border-emerald-100 text-center">
                <Check className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
                <h3 className="font-display text-xl font-bold text-gray-900">Import complete</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Imported <b>{summary.imported}</b> • Skipped <b>{summary.skipped}</b> • Duplicates <b>{summary.duplicates}</b>
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Stat label="Income" value={fmt(summary.income, currency)} tone="emerald" />
                <Stat label="Expenses" value={fmt(summary.expenses, currency)} tone="rose" />
                <Stat label="Savings rate" value={`${summary.savingsRate}%`} tone="violet" />
                <Stat label="Largest txn" value={fmt(summary.largest, currency)} />
                <Stat label="Top category" value={summary.topCategory || "—"} />
                <Stat label="Top merchant" value={summary.topMerchant || "—"} />
              </div>
              {summary.subscriptions?.length > 0 && (
                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Detected subscriptions</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.subscriptions.map((s: string) => (
                      <span key={s} className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Files stay private to your account.
          </div>
          <div className="flex items-center gap-2">
            {stage === "preview" && (
              <>
                <button onClick={reset} className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-sm">Cancel</button>
                <button onClick={importNow} className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800">
                  Import {rows.filter(r => !r._skip && !r._dup).length} transactions
                </button>
              </>
            )}
            {stage === "done" && (
              <button onClick={() => { reset(); onClose(); }} className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800">
                Done
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const toneClasses: Record<string, string> = {
    emerald: "text-emerald-600",
    rose: "text-rose-600",
    violet: "text-violet-600",
  };
  return (
    <div className="p-4 rounded-2xl border border-gray-100 bg-white">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-lg font-display font-bold mt-1 ${tone ? toneClasses[tone] : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function fileToBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = reader.result as string;
      resolve(s.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });
}

function keyFor(date: string, amount: number, title: string) {
  return `${date}|${Math.round(amount * 100)}|${title.toLowerCase().slice(0, 30)}`;
}

function fmt(n: number, c: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n || 0);
}

function buildSummary(txns: Parsed[]) {
  const income = txns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = txns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expenses) / income) * 100)) : 0;
  const largest = txns.reduce((m, t) => Math.max(m, t.amount), 0);
  const catMap: Record<string, number> = {};
  const merchMap: Record<string, number> = {};
  for (const t of txns) {
    if (t.type !== "expense") continue;
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    const m = t.merchant || t.description;
    if (m) merchMap[m] = (merchMap[m] || 0) + t.amount;
  }
  const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topMerchant = Object.entries(merchMap).sort((a, b) => b[1] - a[1])[0]?.[0];
  const subscriptions = txns.filter(t => t.recurring).map(t => t.merchant || t.description).slice(0, 8);
  return { income, expenses, savingsRate, largest, topCategory, topMerchant, subscriptions };
}
