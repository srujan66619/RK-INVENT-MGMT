import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Plus,
  Trash2,
  FileDown,
  Calculator,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { inr, inrPdf, fmtDate } from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDF_COLORS, drawPdfHeader, drawPdfFooter, getStandardTableStyles } from "@/lib/pdf-template";
import { getPnlDataFn, createExpenseFn, deleteExpenseFn } from "@/lib/api/reports";

export const Route = createFileRoute("/finance/pnl")({
  head: () => ({ meta: [{ title: "P&L — RK Labs" }] }),
  component: PnLPage,
});

const EXPENSE_CATEGORIES = [
  "Rent",
  "Salaries",
  "Utilities",
  "Internet & Phone",
  "Marketing",
  "Transport",
  "Software & Tools",
  "Repairs & Maintenance",
  "Tax",
  "Miscellaneous",
];

function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);
  return { from, to };
}
function defaultMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function PnLPage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(defaultMonth());
  const { from, to } = useMemo(() => monthRange(month), [month]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    category: "Rent",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().slice(0, 10),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["pnl-data", month],
    queryFn: async () => {
      return await getPnlDataFn({ data: { from: from.toISOString(), to: to.toISOString() } });
    },
  });

  const invoices = data?.invoices || [];
  const invoiceItems = data?.invoiceItems || [];
  const inventory = data?.inventory || [];
  const purchaseOrders = data?.purchaseOrders || [];
  const expenses = data?.expenses || [];

  // --- Calculations ---
  const totalRevenue = (invoices as any[]).reduce((s, i) => s + Number(i.total || 0), 0);
  const paidRevenue = (invoices as any[])
    .filter((i) => i.payment_status === "paid")
    .reduce((s, i) => s + Number(i.total || 0), 0);
  const outstanding = (invoices as any[])
    .filter((i) => i.payment_status !== "paid")
    .reduce((s, i) => s + Number(i.total || 0), 0);
  const gstCollected = (invoices as any[]).reduce((s, i) => s + Number(i.gst_amount || 0), 0);
  const discountsGiven = (invoices as any[]).reduce((s, i) => s + Number(i.discount || 0), 0);

  // COGS — match invoice line descriptions to inventory cost_price; fallback 60% of unit_price
  const invByName = new Map(
    (inventory as any[]).map((it) => [String(it.name).toLowerCase(), Number(it.cost_price || 0)]),
  );
  const cogs = (invoiceItems as any[]).reduce((s, it) => {
    const key = String(it.description || "").toLowerCase();
    const cost = invByName.get(key);
    const qty = Number(it.quantity || 0);
    if (cost && cost > 0) return s + cost * qty;
    return s + Number(it.unit_price || 0) * qty * 0.6;
  }, 0);

  const purchasesThisMonth = (purchaseOrders as any[]).reduce(
    (s, p) => s + Number(p.total || 0),
    0,
  );

  const expensesByCat = (expenses as any[]).reduce<Record<string, number>>((m, e) => {
    m[e.category] = (m[e.category] || 0) + Number(e.amount || 0);
    return m;
  }, {});
  const totalExpenses = Object.values(expensesByCat).reduce((a, b) => a + b, 0);

  const grossProfit = totalRevenue - cogs;
  const grossMargin = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;
  const netProfit = grossProfit - totalExpenses;
  const netMargin = totalRevenue ? (netProfit / totalRevenue) * 100 : 0;

  // Daily series
  const daily = useMemo(() => {
    const map = new Map<string, { day: string; revenue: number; expense: number }>();
    for (const i of invoices as any[]) {
      const d = new Date(i.created_at).toISOString().slice(0, 10);
      const cur = map.get(d) ?? { day: d.slice(8), revenue: 0, expense: 0 };
      cur.revenue += Number(i.total || 0);
      map.set(d, cur);
    }
    for (const e of expenses as any[]) {
      const cur = map.get(e.expense_date) ?? {
        day: e.expense_date.slice(8),
        revenue: 0,
        expense: 0,
      };
      cur.expense += Number(e.amount || 0);
      map.set(e.expense_date, cur);
    }
    return [...map.values()].sort((a, b) => a.day.localeCompare(b.day));
  }, [invoices, expenses]);

  const pieData = [
    { name: "COGS", value: Math.max(0, cogs), color: "#f97316" },
    { name: "Operating Expenses", value: Math.max(0, totalExpenses), color: "#ef4444" },
    { name: "Net Profit", value: Math.max(0, netProfit), color: "#22c55e" },
  ].filter((d) => d.value > 0);

  const addExpense = useMutation({
    mutationFn: async () => {
      await createExpenseFn({
        data: {
          category: form.category,
          description: form.description || null,
          amount: Number(form.amount || 0),
          expense_date: form.expense_date,
        },
      });
    },
    onSuccess: () => {
      toast.success("Expense added");
      setOpen(false);
      setForm({
        category: "Rent",
        description: "",
        amount: "",
        expense_date: new Date().toISOString().slice(0, 10),
      });
      qc.invalidateQueries({ queryKey: ["pnl-data"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delExpense = useMutation({
    mutationFn: async (id: string) => {
      await deleteExpenseFn({ data: id });
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["pnl-data"] });
    },
  });

  async function exportPDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    await drawPdfHeader(doc, "PROFIT & LOSS REPORT", month, "PERIOD");

    let currentY = 175;

    autoTable(doc, {
      startY: currentY,
      ...getStandardTableStyles(),
      head: [["Income", "Amount (INR)"]],
      body: [
        ["Total Revenue (Invoiced)", inrPdf(totalRevenue)],
        ["  Paid", inrPdf(paidRevenue)],
        ["  Outstanding", inrPdf(outstanding)],
        ["GST Collected", inrPdf(gstCollected)],
        ["Discounts Given", inrPdf(discountsGiven)],
      ],
      columnStyles: { 1: { halign: "right" } },
    });
    autoTable(doc, {
      ...getStandardTableStyles(),
      head: [["Cost of Goods Sold", "Amount (INR)"]],
      body: [
        ["COGS (parts used in invoices)", inrPdf(cogs)],
        ["Inventory Purchases (POs received)", inrPdf(purchasesThisMonth)],
        ["Gross Profit", inrPdf(grossProfit)],
        ["Gross Margin %", grossMargin.toFixed(2) + " %"],
      ],
      columnStyles: { 1: { halign: "right" } },
    });
    autoTable(doc, {
      ...getStandardTableStyles(),
      head: [["Operating Expenses", "Amount (INR)"]],
      body: [
        ...Object.entries(expensesByCat).map(([k, v]) => [k, inrPdf(v)]),
        ["Total Operating Expenses", inrPdf(totalExpenses)],
      ],
      columnStyles: { 1: { halign: "right" } },
    });
    autoTable(doc, {
      ...getStandardTableStyles(),
      head: [["Summary", "Amount"]],
      body: [
        ["Net Profit / Loss", inrPdf(netProfit)],
        ["Net Margin %", netMargin.toFixed(2) + " %"],
      ],
      columnStyles: { 1: { halign: "right" } },
      headStyles: { ...getStandardTableStyles().headStyles, fillColor: netProfit >= 0 ? [34, 197, 94] : [239, 68, 68] },
    });
    await drawPdfFooter(doc, 750);
    doc.save(`pnl-${month}.pdf`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1.5">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <Calculator className="h-8 w-8 text-cyan-400" /> Profit & Loss
          </h1>
          <p className="text-sm text-slate-400">
            Monthly P&L from revenue, COGS, and operating expenses.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              Month
            </Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-44 h-10 bg-black/20 border-white/10 focus:ring-cyan-500/50"
            />
          </div>
          <Button
            variant="outline"
            className="h-10 border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
            onClick={exportPDF}
          >
            <FileDown className="mr-2 h-4 w-4 text-red-400" />
            Export PDF
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="h-10 px-5 shadow-lg transition-transform hover:scale-105 active:scale-95"
                style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-white/10 shadow-2xl">
              <DialogHeader className="border-b border-white/10 pb-4 mb-4">
                <DialogTitle className="text-xl tracking-tight">Add Operating Expense</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10 focus:ring-cyan-500/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem
                          key={c}
                          value={c}
                          className="focus:bg-cyan-500/20 focus:text-cyan-400"
                        >
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Amount (INR)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Date</Label>
                  <Input
                    type="date"
                    value={form.expense_date}
                    onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                    className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Description (optional)</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4 border-t border-white/10">
                <Button
                  onClick={() => addExpense.mutate()}
                  disabled={!form.amount || addExpense.isPending}
                  className="shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPI
          icon={<IndianRupee className="h-5 w-5" />}
          label="Revenue"
          value={inr(totalRevenue)}
          hint={`${inr(paidRevenue)} paid`}
          tone="cyan"
        />
        <KPI
          icon={<TrendingDown className="h-5 w-5" />}
          label="COGS"
          value={inr(cogs)}
          hint="Parts used"
          tone="amber"
        />
        <KPI
          icon={<TrendingDown className="h-5 w-5" />}
          label="Op. Expenses"
          value={inr(totalExpenses)}
          hint={`${(expenses as any[]).length} entries`}
          tone="red"
        />
        <KPI
          icon={
            netProfit >= 0 ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )
          }
          label={netProfit >= 0 ? "Net Profit" : "Net Loss"}
          value={inr(Math.abs(netProfit))}
          hint={`${netMargin.toFixed(1)}% margin`}
          tone={netProfit >= 0 ? "green" : "red"}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-xl p-5 shadow-lg lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
            Daily Revenue vs Expenses
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="day"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                }}
                formatter={(v: any) => inr(Number(v))}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Bar dataKey="revenue" fill="#22d3ee" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-xl p-5 shadow-lg">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
            Cost Breakdown
          </h3>
          {pieData.length === 0 ? (
            <div className="grid h-[260px] place-items-center text-sm text-slate-500">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                  formatter={(v: any) => inr(Number(v))}
                />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* P&L Statement */}
      <div className="rounded-2xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-xl p-6 shadow-lg">
        <h3 className="mb-5 text-sm font-bold uppercase tracking-widest text-slate-400">
          P&L Statement — {month}
        </h3>
        <div className="space-y-1 text-sm">
          <Row label="Total Revenue (Invoiced)" value={inr(totalRevenue)} />
          <Row label="— Paid" value={inr(paidRevenue)} muted />
          <Row label="— Outstanding" value={inr(outstanding)} muted />
          <Row label="GST Collected" value={inr(gstCollected)} muted />
          <Row label="Discounts Given" value={`- ${inr(discountsGiven)}`} muted />
          <div className="my-3 h-px bg-white/10" />
          <Row label="Cost of Goods Sold (parts)" value={`- ${inr(cogs)}`} />
          <Row
            label="Gross Profit"
            value={inr(grossProfit)}
            bold
            tone={grossProfit >= 0 ? "green" : "red"}
          />
          <Row label="Gross Margin" value={`${grossMargin.toFixed(2)} %`} muted />
          <div className="my-3 h-px bg-white/10" />
          {Object.entries(expensesByCat).map(([k, v]) => (
            <Row key={k} label={k} value={`- ${inr(v)}`} muted />
          ))}
          <Row label="Total Operating Expenses" value={`- ${inr(totalExpenses)}`} />
          <div className="my-3 h-px bg-white/10" />
          <Row
            label={netProfit >= 0 ? "NET PROFIT" : "NET LOSS"}
            value={inr(Math.abs(netProfit))}
            bold
            tone={netProfit >= 0 ? "green" : "red"}
            big
          />
          <Row label="Net Margin" value={`${netMargin.toFixed(2)} %`} muted />
          <div className="mt-4 rounded-lg bg-white/5 p-3 text-xs text-slate-400">
            <strong className="text-slate-300">Info:</strong> Inventory purchases (POs received this
            month): <span className="text-slate-200 font-mono">{inr(purchasesThisMonth)}</span> —
            shown for reference, not subtracted (COGS is matched per invoice).
          </div>
        </div>
      </div>

      {/* Expenses table */}
      <div className="rounded-2xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-xl p-0 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-white/[0.02]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Operating Expenses — {month}
          </h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar p-1">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-900/50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(expenses as any[]).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    No expenses logged for this month.
                  </td>
                </tr>
              ) : (
                (expenses as any[]).map((e) => (
                  <tr
                    key={e.id}
                    className="group border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-400">{fmtDate(e.expense_date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{e.category}</td>
                    <td className="px-4 py-3 text-slate-400">{e.description || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-200">
                      {inr(Number(e.amount))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => delExpense.mutate(e.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone: "cyan" | "green" | "red" | "amber";
}) {
  const toneMap = { cyan: "#22d3ee", green: "#4ade80", red: "#f87171", amber: "#fbbf24" };
  const color = toneMap[tone];
  const textCls = {
    cyan: "text-cyan-400",
    green: "text-emerald-400",
    red: "text-red-400",
    amber: "text-amber-400",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-xl p-5 shadow-lg transition-all hover:bg-white/5 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-xl">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
        style={{ background: color }}
      />
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </div>
        <div
          className={`grid h-8 w-8 place-items-center rounded-lg border border-white/5 bg-white/[0.02] ${textCls}`}
        >
          {icon}
        </div>
      </div>
      <div className={`mt-2 text-2xl font-bold tracking-tight ${textCls}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
  big,
  tone,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
  big?: boolean;
  tone?: "green" | "red";
}) {
  const toneCls =
    tone === "green" ? "text-emerald-400" : tone === "red" ? "text-red-400" : "text-slate-200";
  return (
    <div
      className={`flex items-center justify-between py-1.5 transition-colors hover:bg-white/[0.02] px-2 -mx-2 rounded-md ${muted ? "text-slate-400 text-xs pl-6" : ""} ${bold ? "font-bold" : ""} ${big ? "text-xl font-black tracking-tight" : ""}`}
    >
      <span>{label}</span>
      <span className={toneCls}>{value}</span>
    </div>
  );
}
