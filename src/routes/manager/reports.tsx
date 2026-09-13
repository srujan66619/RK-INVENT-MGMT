import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileDown, FileSpreadsheet, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtDate, inr, inrPdf } from "@/lib/format";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDF_COLORS, drawPdfHeader, drawPdfFooter, getStandardTableStyles } from "@/lib/pdf-template";

export const Route = createFileRoute("/manager/reports")({
  head: () => ({ meta: [{ title: "Reports — RK Labs" }] }),
  component: ReportsPage,
});

type Range = "day" | "week" | "month" | "year";

function startOf(range: Range): Date {
  const d = new Date();
  if (range === "day") {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "week") {
    const t = new Date();
    t.setDate(t.getDate() - 7);
    t.setHours(0, 0, 0, 0);
    return t;
  }
  if (range === "month") {
    const t = new Date();
    t.setDate(1);
    t.setHours(0, 0, 0, 0);
    return t;
  }
  const t = new Date();
  t.setMonth(0, 1);
  t.setHours(0, 0, 0, 0);
  return t;
}

import { getReportsDataFn } from "@/lib/api/reports";

function ReportsPage() {
  const [range, setRange] = useState<Range>("month");
  const from = useMemo(() => startOf(range), [range]);

  const { data, isLoading } = useQuery({
    queryKey: ["reports-data", range],
    queryFn: async () => {
      return await getReportsDataFn({ data: { from: from.toISOString() } });
    },
  });

  const invoices = data?.invoices || [];
  const repairs = data?.repairs || [];
  const customers = data?.customers || [];

  const custName = new Map(customers.map((c: any) => [c.id, c.name]));
  const revenue = invoices
    .filter((i: any) => i.payment_status === "paid")
    .reduce((s: number, i: any) => s + Number(i.total), 0);
  const outstanding = invoices
    .filter((i: any) => i.payment_status !== "paid")
    .reduce((s: number, i: any) => s + Number(i.total), 0);

  const techStats = useMemo(() => {
    const map = new Map<string, { jobs: number; completed: number; revenue: number }>();
    for (const r of repairs as any[]) {
      const key = r.technician_name || "Unassigned";
      const cur = map.get(key) ?? { jobs: 0, completed: 0, revenue: 0 };
      cur.jobs += 1;
      if (r.status === "delivered" || r.status === "completed" || r.status === "ready_delivery")
        cur.completed += 1;
      cur.revenue += Number(r.final_cost || r.estimated_cost || 0);
      map.set(key, cur);
    }
    return [...map.entries()]
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [repairs]);

  const custStats = useMemo(() => {
    const map = new Map<string, { name: string; repairs: number; spend: number }>();
    for (const r of repairs as any[]) {
      const key = r.customer_id || "walkin";
      const cur = map.get(key) ?? {
        name: custName.get(r.customer_id) || "Walk-in",
        repairs: 0,
        spend: 0,
      };
      cur.repairs += 1;
      map.set(key, cur);
    }
    for (const i of invoices as any[]) {
      const key = i.customer_id || "walkin";
      const cur = map.get(key) ?? {
        name: custName.get(i.customer_id) || "Walk-in",
        repairs: 0,
        spend: 0,
      };
      cur.spend += Number(i.total);
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.spend - a.spend).slice(0, 50);
  }, [repairs, invoices, custName]);

  function exportXlsx(sheetName: string, rows: any[], filename: string) {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  }

  async function exportPdf(title: string, head: string[], body: any[][], filename: string) {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    await drawPdfHeader(doc, "REPAIRS REPORT", `Total: ${body.length}`, "RECORDS");

    let currentY = 175;

    autoTable(doc, {
      startY: currentY,
      ...getStandardTableStyles(),
      head: [head],
      body,
      columnStyles: { 
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "center" }
      },
    });
    await drawPdfFooter(doc, 750);
    doc.save(filename);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Export daily, weekly, monthly summaries with per-technician and per-customer breakdowns.
          </p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="w-44 h-10 bg-muted border-border focus:ring-primary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="day" className="focus:bg-primary/20 focus:text-primary">
              Today
            </SelectItem>
            <SelectItem value="week" className="focus:bg-primary/20 focus:text-primary">
              Last 7 days
            </SelectItem>
            <SelectItem value="month" className="focus:bg-primary/20 focus:text-primary">
              This month
            </SelectItem>
            <SelectItem value="year" className="focus:bg-primary/20 focus:text-primary">
              This year
            </SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Invoices" value={String(invoices.length)} />
        <Stat label="Repairs" value={String(repairs.length)} />
        <Stat label="Revenue (paid)" value={inr(revenue)} color="#10b981" />
        <Stat label="Outstanding" value={inr(outstanding)} tone="warn" color="#ef4444" />
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="bg-card/80 backdrop-blur-xl border border-border p-1 h-auto rounded-lg">
          <TabsTrigger
            value="sales"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger
            value="tech"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Technicians
          </TabsTrigger>
          <TabsTrigger
            value="cust"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Customers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6 space-y-4">
          <Toolbar
            onXlsx={() =>
              exportXlsx(
                "Invoices",
                (invoices as any[]).map((i) => ({
                  invoice_no: i.invoice_no,
                  date: fmtDate(i.created_at),
                  customer: custName.get(i.customer_id) || "Walk-in",
                  total: Number(i.total),
                  gst: Number(i.gst_amount),
                  status: i.payment_status,
                  mode: i.payment_mode,
                })),
                `sales-${range}.xlsx`,
              )
            }
            onPdf={() =>
              exportPdf(
                "Sales report",
                ["Invoice", "Date", "Customer", "Total", "GST", "Status"],
                (invoices as any[]).map((i) => [
                  i.invoice_no,
                  fmtDate(i.created_at),
                  custName.get(i.customer_id) || "Walk-in",
                  inrPdf(i.total),
                  inrPdf(i.gst_amount),
                  i.payment_status,
                ]),
                `sales-${range}.pdf`,
              )
            }
          />
          <DataTable
            head={["Invoice", "Date", "Customer", "Total", "Status"]}
            rows={(invoices as any[]).map((i) => [
              i.invoice_no,
              fmtDate(i.created_at),
              custName.get(i.customer_id) || "Walk-in",
              inr(i.total),
              i.payment_status,
            ])}
          />
        </TabsContent>

        <TabsContent value="tech" className="mt-6 space-y-4">
          <Toolbar
            onXlsx={() => exportXlsx("Technicians", techStats, `technicians-${range}.xlsx`)}
            onPdf={() =>
              exportPdf(
                "Technician performance",
                ["Technician", "Jobs", "Completed", "Revenue"],
                techStats.map((t) => [
                  t.name,
                  String(t.jobs),
                  String(t.completed),
                  inrPdf(t.revenue),
                ]),
                `technicians-${range}.pdf`,
              )
            }
          />
          <DataTable
            head={["Technician", "Jobs", "Completed", "Revenue"]}
            rows={techStats.map((t) => [
              t.name,
              String(t.jobs),
              String(t.completed),
              inr(t.revenue),
            ])}
          />
        </TabsContent>

        <TabsContent value="cust" className="mt-6 space-y-4">
          <Toolbar
            onXlsx={() => exportXlsx("Customers", custStats, `customers-${range}.xlsx`)}
            onPdf={() =>
              exportPdf(
                "Customer report",
                ["Customer", "Repairs", "Total spend"],
                custStats.map((c) => [c.name, String(c.repairs), inrPdf(c.spend)]),
                `customers-${range}.pdf`,
              )
            }
          />
          <DataTable
            head={["Customer", "Repairs", "Spend"]}
            rows={custStats.map((c) => [c.name, String(c.repairs), inr(c.spend)])}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Toolbar({ onXlsx, onPdf }: { onXlsx: () => void; onPdf: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        className="border-border bg-secondary hover:bg-cardccent text-muted-foreground"
        onClick={onXlsx}
      >
        <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-400" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="border-border bg-secondary hover:bg-cardccent text-muted-foreground"
        onClick={onPdf}
      >
        <FileDown className="mr-2 h-4 w-4 text-red-400" />
        PDF
      </Button>
    </div>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-4 shadow-lg">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-card/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {head.map((h, idx) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-left ${idx === 0 ? "rounded-tl-lg" : ""} ${idx === head.length - 1 ? "rounded-tr-lg" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={head.length} className="px-4 py-12 text-center text-muted-foreground">
                  No data in selected range.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr
                key={i}
                className="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
              >
                {r.map((c, j) => (
                  <td
                    key={j}
                    className={`px-4 py-3 ${j === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  color = "#22d3ee",
}: {
  label: string;
  value: string;
  tone?: "warn";
  color?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-5 shadow-lg transition-all hover:bg-secondary hover:border-white/20 hover:-translate-y-0.5 hover:shadow-xl">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
        style={{ background: color }}
      />
      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={
          "mt-2 text-3xl font-bold tracking-tight " +
          (tone === "warn" ? "text-red-400" : "text-foreground")
        }
      >
        {value}
      </div>
    </div>
  );
}
