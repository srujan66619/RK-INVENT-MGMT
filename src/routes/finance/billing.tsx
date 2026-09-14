import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  FileDown,
  MessageCircle,
  Receipt as ReceiptIcon,
  IndianRupee,
  Send,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { fmtDate, inr, inrPrecise, fillTemplate } from "@/lib/format";
import { generatePdfFromHtml } from "@/lib/html-pdf";
import { useWaSender } from "@/components/wa-sender";
import {
  getInvoicesFn,
  createInvoiceFn,
  deleteInvoiceFn,
  getInvoiceItemsFn,
  createInvoiceItemsFn,
} from "@/lib/api/invoices";
import { getCustomersFn } from "@/lib/api/customers";
import { getRepairsFn } from "@/lib/api/repairs";
import { getProfileFn } from "@/lib/api/settings";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export const Route = createFileRoute("/finance/billing")({
  head: () => ({ meta: [{ title: "Billing — RK Labs" }] }),
  component: BillingPage,
});

type LineItem = { description: string; quantity: number; unit_price: number };
type Invoice = {
  id: string;
  invoice_no: string;
  customer_id: string | null;
  repair_id: string | null;
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payment_method: string | null;
  payment_status: "unpaid" | "partial" | "paid";
  created_at: string;
};
type Customer = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
};
type Repair = {
  id: string;
  ticket_no: string;
  device_brand: string | null;
  device_model: string | null;
  imei: string | null;
};
type Profile = {
  id?: string;
  shop_name: string | null;
  shop_address: string | null;
  shop_phone: string | null;
  gst_number: string | null;
  gst_percent: number | null;
  wa_templates?: any;
};

const QUICK_ITEMS: { label: string; price: number }[] = [
  { label: "Mobile Charger", price: 299 },
  { label: "Screen Guard", price: 149 },
  { label: "USB Cable", price: 199 },
  { label: "Earphones", price: 399 },
  { label: "Back Cover", price: 199 },
  { label: "Battery Replacement", price: 899 },
  { label: "Display Replacement", price: 1999 },
  { label: "Diagnostic Charge", price: 200 },
];

function BillingPage() {
  const qc = useQueryClient();
  const wa = useWaSender();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LineItem[]>([
    { description: "Repair charges", quantity: 1, unit_price: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(18);
  const [customerId, setCustomerId] = useState("");
  const [repairId, setRepairId] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "partial" | "paid">("paid");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [sendWa, setSendWa] = useState(true);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const data = await getInvoicesFn();
      return data as Invoice[];
    },
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-min"],
    queryFn: async () => (await getCustomersFn()) as Customer[],
  });
  const { data: repairs = [] } = useQuery({
    queryKey: ["repairs-min"],
    queryFn: async () => (await getRepairsFn()) as Repair[],
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        return await getProfileFn();
      } catch (e) {
        return null;
      }
    },
  });

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const taxable = Math.max(0, subtotal - discount);
  const gstAmount = (taxable * gst) / 100;
  const total = taxable + gstAmount;

  const create = useMutation({
    mutationFn: async () => {
      if (items.length === 0 || items.every((i) => !i.description))
        throw new Error("Add at least one item");

      const ticketNo = invoiceNo.trim() || `INV-${Date.now().toString().slice(-6)}`;

      const payload: any = {
        invoice_no: ticketNo,
        customer_id: customerId || null,
        repair_id: repairId || null,
        subtotal,
        discount,
        tax_rate: gst,
        tax_amount: gstAmount,
        total,
        payment_method: paymentMode,
        payment_status: paymentStatus,
      };

      const inv = await createInvoiceFn({ data: payload });

      const rows = items
        .filter((i) => i.description)
        .map((i) => ({
          invoice_id: inv.id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.quantity * i.unit_price,
        }));
      if (rows.length) await createInvoiceItemsFn({ data: rows });
      return { ...payload, id: inv.id, created_at: inv.created_at } as Invoice;
    },
    onSuccess: async (inv) => {
      toast.success(`Invoice ${inv.invoice_no} created`);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setOpen(false);
      const shouldSend = sendWa;
      const savedCust = customerId;
      setItems([{ description: "Repair charges", quantity: 1, unit_price: 0 }]);
      setDiscount(0);
      setCustomerId("");
      setRepairId("");
      setInvoiceNo("");

      if (shouldSend && savedCust) {
        // wait a tick so state settles before opening WA
        setTimeout(() => shareWhatsApp(inv), 200);
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await deleteInvoiceFn({ data: id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Deleted");
    },
  });

  async function getPdfDoc(inv: Invoice) {
    const lineItems = await getInvoiceItemsFn({ data: { invoice_id: inv.id } });
    const cust = customers.find((c) => c.id === inv.customer_id) ?? null;
    const rep = repairs.find((r) => r.id === inv.repair_id) ?? null;
    return generatePdfFromHtml({
      type: "invoice",
      shop: profile ?? null,
      invoice: inv as any,
      customer: cust,
      repair: rep,
      items: (lineItems ?? []) as any,
    });
  }

  async function downloadPdf(inv: Invoice) {
    const tId = toast.loading("Generating PDF...");
    try {
      const doc = await getPdfDoc(inv);
      doc.save(`${inv.invoice_no}.pdf`);
      toast.success("Invoice downloaded", { id: tId });
    } catch (e: any) {
      toast.error(e.message || "Failed to generate PDF", { id: tId });
    }
  }

  async function previewPdf(inv: Invoice) {
    const tId = toast.loading("Generating preview...");
    try {
      const doc = await getPdfDoc(inv);
      const pdfBlobUrl = doc.output("bloburl").toString();
      setPreviewPdfUrl(pdfBlobUrl);
      toast.success("Preview ready", { id: tId });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to generate preview", { id: tId });
    }
  }

  async function uploadAndGetUrl(inv: Invoice): Promise<string> {
    const doc = await getPdfDoc(inv);
    doc.save(`${inv.invoice_no}.pdf`);
    toast.info("PDF downloaded! Please attach it to the WhatsApp chat when it opens.", {
      duration: 8000,
    });
    return "[Please attach downloaded PDF manually]";
  }

  function resolveWaPhone(cust: Customer | undefined) {
    const raw = (cust?.whatsapp?.trim() || cust?.phone?.trim() || "").replace(/\D/g, "");
    if (!raw) return null;
    // Assume Indian numbers when no country code is present
    return raw.length === 10 ? `91${raw}` : raw;
  }

  async function shareWhatsApp(inv: Invoice) {
    const cust = customers.find((c) => c.id === inv.customer_id);
    if (!cust) return toast.error("Walk-in invoice — no customer to send to");
    const phone = resolveWaPhone(cust);
    if (!phone) return toast.error(`${cust.name} has no phone or WhatsApp number on file`);
    const t = toast.loading("Uploading PDF…");
    try {
      const link = await uploadAndGetUrl(inv);
      const tpl =
        profile?.wa_templates?.invoice ??
        "Dear {name}, thank you for choosing {shop}.\n\nInvoice: {invoice_no}\nAmount: {amount}\n\nDownload your invoice here: {link}\n\nWe appreciate your business!";
      const msg = fillTemplate(tpl, {
        name: cust.name,
        invoice_no: inv.invoice_no,
        amount: inrPrecise(inv.total),
        shop: profile?.shop_name ?? "RK Labs",
        link,
      });
      toast.success("PDF link ready", { id: t });
      wa.send({
        kind: "invoice",
        phone,
        recipientName: cust.name,
        message: msg,
        invoiceId: inv.id,
        repairId: inv.repair_id ?? null,
        title: `Invoice ${inv.invoice_no}`,
      });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to upload", { id: t });
    }
  }

  async function paymentReminder(inv: Invoice) {
    const cust = customers.find((c) => c.id === inv.customer_id);
    if (!cust) return toast.error("Walk-in invoice — no customer to remind");
    const phone = resolveWaPhone(cust);
    if (!phone) return toast.error(`${cust.name} has no phone or WhatsApp number on file`);
    const tpl =
      profile?.wa_templates?.payment_reminder ??
      "Dear {name}, gentle reminder: invoice {invoice_no} of {amount} is pending payment. — {shop}";
    const msg = fillTemplate(tpl, {
      name: cust.name,
      invoice_no: inv.invoice_no,
      amount: inrPrecise(inv.total),
      shop: profile?.shop_name ?? "RK Labs",
    });
    wa.send({
      kind: "payment_reminder",
      phone,
      recipientName: cust.name,
      message: msg,
      invoiceId: inv.id,
      repairId: inv.repair_id ?? null,
      title: `Payment reminder — ${inv.invoice_no}`,
    });
  }

  const totalRevenue = invoices
    .filter((i) => i.payment_status === "paid")
    .reduce((s, i) => s + Number(i.total), 0);
  const unpaid = invoices
    .filter((i) => i.payment_status !== "paid")
    .reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Billing & GST Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Manage invoices, payments, GST and customer billing
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="h-10 px-5 shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
            >
              <Plus className="mr-2 h-4 w-4" /> New invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Customer</Label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-input/40 px-3 text-sm"
                  >
                    <option value="">— Walk-in —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Repair ticket</Label>
                  <select
                    value={repairId}
                    onChange={(e) => setRepairId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-input/40 px-3 text-sm"
                  >
                    <option value="">— None —</option>
                    {repairs.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.ticket_no}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Invoice number{" "}
                  <span className="text-xs text-muted-foreground">
                    (letters + numbers — leave blank to auto-generate)
                  </span>
                </Label>
                <Input
                  placeholder="e.g. INV-2026-042 or RK/INV/0421"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  maxLength={40}
                />
              </div>

              <div className="space-y-2">
                <Label>Quick add — common items</Label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ITEMS.map((q) => (
                    <Button
                      key={q.label}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setItems((prev) => {
                          const empty = prev.findIndex((p) => !p.description.trim());
                          const newItem = {
                            description: q.label,
                            quantity: 1,
                            unit_price: q.price,
                          };
                          if (empty >= 0) return prev.map((p, i) => (i === empty ? newItem : p));
                          return [...prev, newItem];
                        });
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" /> {q.label} · {inr(q.price)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Line items</Label>
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_70px_110px_110px_40px] gap-2">
                    <Input
                      placeholder="Description"
                      value={it.description}
                      onChange={(e) =>
                        setItems(
                          items.map((x, i) =>
                            i === idx ? { ...x, description: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      value={it.quantity}
                      onChange={(e) =>
                        setItems(
                          items.map((x, i) =>
                            i === idx ? { ...x, quantity: Number(e.target.value) } : x,
                          ),
                        )
                      }
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Unit ₹"
                      value={it.unit_price}
                      onChange={(e) =>
                        setItems(
                          items.map((x, i) =>
                            i === idx ? { ...x, unit_price: Number(e.target.value) } : x,
                          ),
                        )
                      }
                    />
                    <div className="grid h-9 place-items-center rounded-md border border-border bg-secondary text-sm">
                      {inr(it.quantity * it.unit_price)}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setItems([...items, { description: "", quantity: 1, unit_price: 0 }])
                  }
                >
                  <Plus className="mr-1 h-4 w-4" /> Add line
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Discount (₹)</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>GST %</Label>
                  <Input
                    type="number"
                    value={gst}
                    onChange={(e) => setGst(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment mode</Label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-input/40 px-3 text-sm"
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="h-9 w-full rounded-md border border-input bg-input/40 px-3 text-sm"
                  >
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              <div className="glass rounded-xl p-4 text-sm">
                <Row label="Subtotal" value={inrPrecise(subtotal)} />
                <Row label="Discount" value={`- ${inrPrecise(discount)}`} />
                <Row label={`GST (${gst}%)`} value={inrPrecise(gstAmount)} />
                <div className="my-2 h-px bg-white/10" />
                <Row label="TOTAL" value={inrPrecise(total)} bold />
              </div>

              <label className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs">
                <input
                  type="checkbox"
                  checked={sendWa}
                  onChange={(e) => setSendWa(e.target.checked)}
                  disabled={!customerId}
                  className="h-4 w-4 accent-[var(--neon)]"
                />
                <span>
                  Send invoice PDF to customer on WhatsApp after creating
                  {!customerId && (
                    <span className="ml-1 text-muted-foreground">
                      (select a customer to enable)
                    </span>
                  )}
                </span>
              </label>
            </div>
            <DialogFooter>
              <Button
                onClick={() => create.mutate()}
                disabled={create.isPending}
                style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
              >
                Create invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!previewPdfUrl} onOpenChange={(o) => !o && setPreviewPdfUrl(null)}>
          <DialogContent className="glass-strong max-h-[95vh] w-[95vw] max-w-5xl overflow-hidden p-0 flex flex-col border-white/20">
            <DialogHeader className="p-4 border-b border-border shrink-0 bg-card/50">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Invoice Preview
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-[75vh] w-full bg-[#323639] relative">
              {previewPdfUrl && (
                <iframe
                  src={previewPdfUrl}
                  className="absolute inset-0 w-full h-full border-0 bg-white"
                  title="PDF Preview"
                />
              )}
            </div>
            <DialogFooter className="p-4 border-t border-border shrink-0 bg-card/50">
              <Button variant="outline" className="px-6" onClick={() => setPreviewPdfUrl(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat
          icon={ReceiptIcon}
          label="Total Invoices"
          value={String(invoices.length)}
          type="primary"
        />
        <Stat
          icon={IndianRupee}
          label="Collected Revenue"
          value={inr(totalRevenue)}
          type="success"
        />
        <Stat icon={IndianRupee} label="Pending Payment" value={inr(unpaid)} type="warning" />
      </div>

      <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-card/50 text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-4 text-left font-semibold">Invoice</th>
                <th className="px-4 py-4 text-left font-semibold">Customer</th>
                <th className="px-4 py-4 text-left font-semibold">Date</th>
                <th className="px-4 py-4 text-right font-semibold">Total</th>
                <th className="px-4 py-4 text-left font-semibold">Status</th>
                <th className="px-4 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    Loading invoices...
                  </td>
                </tr>
              )}
              {!isLoading && invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    No invoices yet. Create your first invoice to start managing billing and GST
                    records.
                  </td>
                </tr>
              )}
              {invoices.map((inv) => {
                const c = customers.find((x) => x.id === inv.customer_id);
                const statusColors = {
                  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  partial: "bg-cardmber-500/10 text-amber-400 border-amber-500/20",
                  unpaid: "bg-red-500/10 text-red-400 border-red-500/20",
                };
                return (
                  <tr key={inv.id} className="group transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-foreground">
                      {inv.invoice_no}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-muted-foreground">
                      {c?.name ?? <span className="text-muted-foreground">Walk-in</span>}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{fmtDate(inv.created_at)}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-foreground">
                      {inr(inv.total)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-md border",
                          statusColors[inv.payment_status],
                        )}
                      >
                        {inv.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-cardccent hover:text-foreground"
                          title="Preview PDF"
                          onClick={() => previewPdf(inv)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-cardccent hover:text-foreground"
                          title="Download PDF"
                          onClick={() => downloadPdf(inv)}
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-[var(--neon)]/20 hover:text-[var(--neon)] text-[var(--neon)]"
                          title="Send PDF on WhatsApp"
                          onClick={() => shareWhatsApp(inv)}
                        >
                          <WhatsAppIcon className="h-4 w-4" />
                        </Button>
                        {inv.payment_status !== "paid" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-cardmber-500/20 hover:text-amber-400 text-amber-300"
                            title="Payment reminder"
                            onClick={() => paymentReminder(inv)}
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400 text-red-400/80"
                          title="Delete Invoice"
                          onClick={() => {
                            if (confirm(`Delete ${inv.invoice_no}?`)) del.mutate(inv.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={"flex justify-between py-1 " + (bold ? "text-base font-bold" : "")}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  type,
}: {
  icon: any;
  label: string;
  value: string;
  type: "primary" | "success" | "warning";
}) {
  const colors = {
    primary: "text-primary border-primary/20 bg-primary/10",
    success: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
    warning: "text-amber-400 border-amber-400/20 bg-cardmber-400/10",
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-5 shadow-lg transition-all hover:bg-secondary hover:border-white/20">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className={cn("grid h-9 w-9 place-items-center rounded-xl border", colors[type])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</div>
    </div>
  );
}
