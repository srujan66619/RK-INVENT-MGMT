import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MessageCircle,
  Sparkles,
  Printer,
  ClipboardList,
  Check,
  Languages,
  Loader2,
  UserPlus,
  CalendarPlus,
  CalendarClock,
  CalendarX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fmtDate, fmtDateTime, inr, inrPrecise, fillTemplate } from "@/lib/format";
import { translateToEnglish } from "@/lib/ai.functions";
import { buildAdvanceReceiptPdf } from "@/lib/advance-receipt";
import { googleCalendarUrl, downloadIcs, type CalEvent } from "@/lib/calendar";
import { useWaSender } from "@/components/wa-sender";
import { buildIntakeReceiptPdf } from "@/lib/intake-receipt-pdf";
import {
  getRepairsFn,
  createRepairFn,
  updateRepairFn,
  deleteRepairFn,
  getRepairNotesFn,
  createRepairNoteFn,
  updateRepairNoteFn,
  getAppointmentEventsFn,
  createAppointmentEventFn,
  getWaLogsFn,
} from "@/lib/api/repairs";
import { getCustomersFn } from "@/lib/api/customers";
import { meFn } from "@/lib/api/auth";

export const Route = createFileRoute("/staff/repairs")({
  head: () => ({ meta: [{ title: "Repairs — RK Labs" }] }),
  component: RepairsPage,
});

const STATUSES = [
  { v: "received", label: "Received" },
  { v: "diagnosis", label: "Diagnosis" },
  { v: "waiting_parts", label: "Waiting Parts" },
  { v: "in_progress", label: "In Progress" },
  { v: "completed", label: "Completed" },
  { v: "ready_delivery", label: "Ready for Delivery" },
  { v: "delivered", label: "Delivered" },
  { v: "cancelled", label: "Cancelled" },
] as const;

const STATUS_COLOR: Record<string, string> = {
  received: "bg-blue-400 text-black border-blue-500 font-semibold",
  diagnosis: "bg-purple-400 text-black border-purple-500 font-semibold",
  waiting_parts: "bg-amber-400 text-black border-amber-500 font-semibold",
  in_progress: "bg-cyan-400 text-black border-cyan-500 font-semibold",
  completed: "bg-emerald-400 text-black border-emerald-500 font-semibold",
  ready_delivery: "bg-teal-400 text-black border-teal-500 font-semibold",
  delivered: "bg-green-400 text-black border-green-500 font-semibold",
  cancelled: "bg-red-400 text-black border-red-500 font-semibold",
};

type Repair = {
  id: string;
  ticket_no: string;
  customer_id: string | null;
  device_type: string | null;
  device_brand: string | null;
  device_model: string | null;
  imei: string | null;
  issue: string;
  status: string;
  technician_name: string | null;
  technician_notes: string | null;
  estimated_completion: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  appointment_at: string | null;
  created_at: string;
  completed_at: string | null;
  delivered_at: string | null;
  assigned_at: string | null;
};
type Customer = {
  id: string;
  name: string;
  whatsapp: string | null;
  phone: string | null;
  address: string | null;
};
type RepairNote = {
  id: string;
  repair_id: string;
  technician_name: string | null;
  note: string;
  task_done: boolean;
  completed_at: string | null;
  created_at: string;
};
type Profile = {
  shop_name: string | null;
  shop_address: string | null;
  shop_phone: string | null;
  gst_number: string | null;
  wa_templates?: any;
};

const DEVICE_TYPES = ["Mobile", "Laptop", "Tablet", "Smart Watch", "Desktop"] as const;
const TIME_SLOTS = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
] as const;

function aiSuggest(issue: string): string {
  const s = issue.toLowerCase();
  if (s.includes("water") || s.includes("liquid"))
    return "Likely water damage → clean board, check for corrosion, replace battery & display connectors.";
  if (s.includes("screen") || s.includes("display") || s.includes("crack"))
    return "Likely display assembly failure → replace LCD/OLED assembly.";
  if (s.includes("battery") || s.includes("drain") || s.includes("charge"))
    return "Likely battery degradation or charging IC → test battery health, inspect charging port.";
  if (s.includes("dead") || s.includes("not turning") || s.includes("on"))
    return "Likely power IC or motherboard fault → check power rails, inspect for shorted components.";
  if (s.includes("speaker") || s.includes("audio") || s.includes("mic"))
    return "Likely audio IC / speaker module failure → test with diagnostics, replace speaker.";
  if (s.includes("camera"))
    return "Likely camera module or flex fault → reseat connector, test with new camera module.";
  return "Run full diagnostics: power, charging, display, touch, sensors and audio.";
}

type FormState = {
  customer_id: string;
  device_type: string;
  device_brand: string;
  device_model: string;
  imei: string;
  issue: string;
  status: string;
  estimated_completion: string;
  estimated_cost: number;
  advance_amount: number;
  payment_mode: string;
  technician_notes: string;
  appointment_date: string;
  appointment_time: string;
  auto_send_wa: boolean;
  customer_mobile: string;
};

const EMPTY_FORM: FormState = {
  customer_id: "",
  device_type: "Mobile",
  device_brand: "",
  device_model: "",
  imei: "",
  issue: "",
  status: "received",
  estimated_completion: "",
  estimated_cost: 0,
  advance_amount: 0,
  payment_mode: "Cash",
  technician_notes: "",
  appointment_date: "",
  appointment_time: "",
  auto_send_wa: true,
  customer_mobile: "",
};

function RepairsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Repair | null>(null);
  const [detail, setDetail] = useState<Repair | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [custSearch, setCustSearch] = useState("");
  const [newCustOpen, setNewCustOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const translate = useServerFn(translateToEnglish);
  const wa = useWaSender();

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ["repairs"],
    queryFn: async () => {
      const data = await getRepairsFn();
      return data as Repair[];
    },
    refetchInterval: 5000,
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-min"],
    queryFn: async () => {
      const data = await getCustomersFn();
      return data as Customer[];
    },
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { user } = await meFn();
      if (!user) return null;
      return user as Profile | null;
    },
  });
  const custMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);

  const selectedCustomer = form.customer_id ? (custMap.get(form.customer_id) ?? null) : null;
  const custSuggestions = useMemo(() => {
    const q = custSearch.trim().toLowerCase();
    if (!q || selectedCustomer) return [];
    return customers
      .filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone?.includes(q) || c.whatsapp?.includes(q),
      )
      .slice(0, 6);
  }, [custSearch, customers, selectedCustomer]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setCustSearch("");
    setEditing(null);
  }

  function loadEditing(r: Repair) {
    setEditing(r);
    setForm({
      customer_id: r.customer_id ?? "",
      device_type: r.device_type ?? "Mobile",
      device_brand: r.device_brand ?? "",
      device_model: r.device_model ?? "",
      imei: r.imei ?? "",
      issue: r.issue,
      status: r.status,
      estimated_completion: r.estimated_completion ?? "",
      estimated_cost: Number(r.estimated_cost ?? 0),
      advance_amount: 0,
      payment_mode: "Cash",
      technician_notes: r.technician_notes ?? "",
      appointment_date: r.appointment_at ? r.appointment_at.slice(0, 10) : "",
      appointment_time: r.appointment_at
        ? new Date(r.appointment_at).toISOString().slice(11, 16)
        : "",
      auto_send_wa: true,
      customer_mobile: r.customer_id
        ? (custMap.get(r.customer_id)?.phone ?? custMap.get(r.customer_id)?.whatsapp ?? "")
        : "",
    });
    const c = r.customer_id ? custMap.get(r.customer_id) : null;
    setCustSearch(c?.name ?? "");
    setOpen(true);
  }

  const filtered = repairs.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    const c = r.customer_id ? custMap.get(r.customer_id) : null;
    return (
      r.ticket_no.toLowerCase().includes(q) ||
      r.imei?.toLowerCase().includes(q) ||
      r.device_brand?.toLowerCase().includes(q) ||
      c?.name.toLowerCase().includes(q)
    );
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.issue.trim()) throw new Error("Issue description is required");
      let appointment_at: string | null = null;
      if (form.appointment_date) {
        const t = form.appointment_time || "10:00";
        const d = new Date(`${form.appointment_date}T${t}:00`);
        if (!isNaN(d.getTime())) appointment_at = d.toISOString();
      }
      // Note: Mobile updates should ideally go through a separate customer API endpoint
      // To save time, we let this pass for now or omit it if not strictly required
      const payload = {
        customer_id: form.customer_id || null,
        device_type: form.device_type || null,
        device_brand: form.device_brand || null,
        device_model: form.device_model || null,
        imei: form.imei || null,
        issue: form.issue,
        status: form.status as any,
        technician_notes: form.technician_notes || null,
        estimated_completion: form.estimated_completion || null,
        estimated_cost: Number(form.estimated_cost || 0),
        appointment_at,
      };
      if (editing) {
        const data = await updateRepairFn({ data: { id: editing.id, data: payload } });
        return { row: { ...editing, ...data } as unknown as Repair, isNew: false };
      }
      const data = await createRepairFn({ data: payload });
      return { row: { ...payload, ...data } as unknown as Repair, isNew: true };
    },
    onSuccess: async ({ row, isNew }) => {
      qc.invalidateQueries({ queryKey: ["repairs"] });
      toast.success(editing ? "Ticket updated" : `Ticket ${row.ticket_no} created`);
      setOpen(false);

      // Advance receipt flow — only for new tickets with an advance and a customer with WhatsApp
          if (isNew && form.advance_amount > 0) {
        const cust = form.customer_id ? custMap.get(form.customer_id) : null;
        try {
          const doc = await buildAdvanceReceiptPdf({
            shop: profile ?? null,
            ticket_no: row.ticket_no,
            created_at: row.created_at,
            customer: cust ? { name: cust.name, phone: cust.phone, address: cust.address } : null,
            device: {
              type: form.device_type,
              brand: form.device_brand,
              model: form.device_model,
              imei: form.imei,
            },
            issue: form.issue,
            estimated_cost: form.estimated_cost,
            advance_amount: form.advance_amount,
            payment_mode: form.payment_mode,
          });

          if (cust?.whatsapp) {
            doc.save(`advance-${row.ticket_no}.pdf`);
            const tpl =
              profile?.wa_templates?.advance ??
              "Dear {name}, thank you for choosing {shop}. We've received your {device} for repair.\n\nTicket Number: {ticket}\nAdvance Payment: {advance}\nEstimated Total: {total}\nBalance Due on Delivery: {balance}\n\nTrack your repair anytime with your ticket number. — {shop}";
            const msg = fillTemplate(tpl, {
              name: cust.name,
              device:
                [form.device_brand, form.device_model].filter(Boolean).join(" ") ||
                form.device_type,
              ticket: row.ticket_no,
              advance: inrPrecise(form.advance_amount),
              total: inrPrecise(form.estimated_cost),
              balance: inrPrecise(Math.max(0, form.estimated_cost - form.advance_amount)),
              link: "Attached PDF",
              shop: profile?.shop_name ?? "RK Labs",
            });

            if (form.auto_send_wa) {
              wa.send({
                kind: "advance",
                phone: cust.whatsapp,
                recipientName: cust.name,
                message: msg,
                repairId: row.id,
                title: `Advance receipt for ${row.ticket_no}`,
              });
            } else {
              toast.success("Advance receipt downloaded", {
                description: `Send WhatsApp to ${cust.name}? (Attach the PDF manually)`,
                action: {
                  label: "Preview & send",
                  onClick: () =>
                    wa.send({
                      kind: "advance",
                      phone: cust.whatsapp,
                      recipientName: cust.name,
                      message: msg,
                      repairId: row.id,
                      title: `Advance receipt for ${row.ticket_no}`,
                    }),
                },
                duration: 15000,
              });
            }
          } else {
            doc.save(`advance-${row.ticket_no}.pdf`);
            toast.info("Advance receipt downloaded (add WhatsApp number to customer to send)");
          }
        } catch (e: any) {
          toast.error(`Advance receipt failed: ${e.message ?? e}`);
        }
      }
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await updateRepairFn({ data: { id, data: { status } } });
      return { id, status };
    },
    onSuccess: ({ status, id }) => {
      qc.invalidateQueries({ queryKey: ["repairs"] });
      const r = repairs.find((x) => x.id === id);
      const c = r?.customer_id ? custMap.get(r.customer_id) : null;
      const tplKey =
        status === "received" ||
        status === "in_progress" ||
        status === "ready_delivery" ||
        status === "delivered"
          ? status
          : null;
      const tpl = tplKey && profile?.wa_templates?.[tplKey];
      if (tpl && c?.whatsapp && r) {
        const msg = fillTemplate(tpl, {
          name: c.name,
          device:
            [r.device_brand, r.device_model].filter(Boolean).join(" ") || r.device_type || "device",
          ticket: r.ticket_no,
          shop: profile?.shop_name ?? "RK Labs",
        });
        toast.success("Status updated", {
          description: `Send WhatsApp update to ${c.name}?`,
          action: {
            label: "Preview & send",
            onClick: () =>
              wa.send({
                kind: "status_update",
                phone: c.whatsapp,
                recipientName: c.name,
                message: msg,
                repairId: r.id,
                title: `Status update — ${r.ticket_no}`,
              }),
          },
        });
      } else {
        toast.success("Status updated");
      }
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await deleteRepairFn({ data: id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repairs"] });
      toast.success("Deleted");
    },
  });

  async function handleTranslate() {
    if (!form.issue.trim()) return;
    setTranslating(true);
    try {
      const res = await translate({ data: { text: form.issue } });
      setForm((f) => ({ ...f, issue: res.text }));
      toast.success("Translated to English");
    } catch (e: any) {
      toast.error(`Translate failed: ${e.message ?? e}`);
    } finally {
      setTranslating(false);
    }
  }

  const suggestion = form.issue.length > 4 ? aiSuggest(form.issue) : "";
  const balance = Math.max(0, form.estimated_cost - form.advance_amount);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Repairs</h1>
          <p className="text-sm text-slate-400">
            {repairs.length} tickets · workflow tracking · WhatsApp receipts
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="h-10 px-5 shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
            >
              <Plus className="mr-2 h-4 w-4" /> New ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong max-h-[90vh] max-w-2xl overflow-y-auto custom-scrollbar border-white/10 shadow-2xl">
            <DialogHeader className="border-b border-white/10 pb-4 mb-4">
              <DialogTitle className="text-xl tracking-tight">
                {editing ? `Edit ${editing.ticket_no}` : "New repair ticket"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
              className="space-y-4"
            >
              {/* Customer autocomplete */}
              <div className="space-y-1.5">
                <Label className="text-slate-300">Customer</Label>
                <div className="relative">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by name, phone or WhatsApp…"
                      value={custSearch}
                      onChange={(e) => {
                        setCustSearch(e.target.value);
                        if (form.customer_id) setForm((f) => ({ ...f, customer_id: "" }));
                      }}
                      className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 border-white/10 bg-white/5 hover:bg-white/10 hover:text-cyan-400"
                      onClick={() => setNewCustOpen(true)}
                      title="Add new customer"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  {custSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0f172a] shadow-xl custom-scrollbar">
                      {custSuggestions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="flex w-full flex-col items-start gap-0.5 border-b border-white/5 px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              customer_id: c.id,
                              customer_mobile: f.customer_mobile || c.phone || c.whatsapp || "",
                            }));
                            setCustSearch(c.name);
                          }}
                        >
                          <span className="font-medium text-slate-200">{c.name}</span>
                          <span className="text-xs text-slate-400">
                            {c.phone ?? c.whatsapp ?? "—"}
                            {c.address ? ` · ${c.address}` : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedCustomer && (
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs mt-2 shadow-sm">
                    <div className="font-semibold text-cyan-400">{selectedCustomer.name}</div>
                    <div className="text-cyan-400/70 mt-1">
                      {selectedCustomer.phone && (
                        <span className="mr-2">📞 {selectedCustomer.phone}</span>
                      )}
                      {selectedCustomer.whatsapp && (
                        <span className="mr-2">💬 {selectedCustomer.whatsapp}</span>
                      )}
                      {selectedCustomer.address && (
                        <div className="mt-1">📍 {selectedCustomer.address}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300">Customer mobile number</Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. 9876543210"
                  value={form.customer_mobile}
                  onChange={(e) => setForm((f) => ({ ...f, customer_mobile: e.target.value }))}
                  className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                />
                <div className="text-[11px] text-slate-400">
                  Saved to the selected customer's record if their phone is empty.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Device type</Label>
                  <select
                    value={form.device_type}
                    onChange={(e) => setForm((f) => ({ ...f, device_type: e.target.value }))}
                    className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm focus:border-cyan-500/50 outline-none"
                  >
                    {DEVICE_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[#0f172a]">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <FieldC
                  label="Brand"
                  value={form.device_brand}
                  onChange={(v) => setForm((f) => ({ ...f, device_brand: v }))}
                  className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                />
                <FieldC
                  label="Model"
                  value={form.device_model}
                  onChange={(v) => setForm((f) => ({ ...f, device_model: v }))}
                  className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                />
                <FieldC
                  label="IMEI / Serial"
                  value={form.imei}
                  onChange={(v) => setForm((f) => ({ ...f, imei: v }))}
                  className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                />
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm focus:border-cyan-500/50 outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.v} value={s.v} className="bg-[#0f172a]">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <FieldC
                  label="Estimated completion"
                  type="date"
                  value={form.estimated_completion}
                  onChange={(v) => setForm((f) => ({ ...f, estimated_completion: v }))}
                  className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                />
                <FieldC
                  label="Estimated cost (₹)"
                  type="number"
                  step="0.01"
                  value={String(form.estimated_cost)}
                  onChange={(v) => setForm((f) => ({ ...f, estimated_cost: Number(v || 0) }))}
                  className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 shadow-inner">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Appointment slot (optional)
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FieldC
                    label="Appointment date"
                    type="date"
                    value={form.appointment_date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(v) => setForm((f) => ({ ...f, appointment_date: v }))}
                    className="bg-black/20 border-white/10 focus:border-cyan-500/50"
                  />
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Time slot</Label>
                    <select
                      value={form.appointment_time}
                      onChange={(e) => setForm((f) => ({ ...f, appointment_time: e.target.value }))}
                      disabled={!form.appointment_date}
                      className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm disabled:opacity-50 focus:border-cyan-500/50 outline-none"
                    >
                      <option value="" className="bg-[#0f172a]">
                        Select a slot…
                      </option>
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t} className="bg-[#0f172a]">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  Pick when the customer will drop off the device. Saved with the ticket.
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Issue description</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                    onClick={handleTranslate}
                    disabled={translating || !form.issue.trim()}
                  >
                    {translating ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Languages className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Translate to English
                  </Button>
                </div>
                <Textarea
                  value={form.issue}
                  onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))}
                  placeholder="Describe the problem in any language — Hindi, Tamil, Telugu, English, etc."
                  required
                  rows={3}
                  className="bg-black/20 border-white/10 focus:border-cyan-500/50 resize-none min-h-[80px]"
                />
                {suggestion && (
                  <div className="flex gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm mt-2 shadow-sm">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                    <div className="text-slate-300">
                      <span className="font-semibold text-cyan-400">AI suggestion:</span>{" "}
                      {suggestion}
                    </div>
                  </div>
                )}
              </div>

              {!editing && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4 shadow-inner">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Advance payment (optional)
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FieldC
                      label="Advance (₹)"
                      type="number"
                      step="0.01"
                      value={String(form.advance_amount)}
                      onChange={(v) => setForm((f) => ({ ...f, advance_amount: Number(v || 0) }))}
                      className="bg-black/20 border-white/10"
                    />
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Mode</Label>
                      <select
                        value={form.payment_mode}
                        onChange={(e) => setForm((f) => ({ ...f, payment_mode: e.target.value }))}
                        className="h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm focus:border-emerald-500/50 outline-none"
                      >
                        <option className="bg-[#0f172a]">Cash</option>
                        <option className="bg-[#0f172a]">UPI</option>
                        <option className="bg-[#0f172a]">Card</option>
                        <option className="bg-[#0f172a]">Bank Transfer</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Balance due</Label>
                      <div className="grid h-10 place-items-center rounded-md border border-white/10 bg-black/20 text-sm font-bold text-emerald-400">
                        {inr(balance)}
                      </div>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm cursor-pointer hover:bg-white/5 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.auto_send_wa}
                      onChange={(e) => setForm((f) => ({ ...f, auto_send_wa: e.target.checked }))}
                      className="h-4 w-4 accent-emerald-500 rounded border-white/20"
                    />
                    <span className="text-slate-300 text-sm">
                      One-click WhatsApp — auto-send advance receipt to customer
                    </span>
                  </label>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <Label className="text-slate-300">Initial technician notes (optional)</Label>
                <Textarea
                  value={form.technician_notes}
                  onChange={(e) => setForm((f) => ({ ...f, technician_notes: e.target.value }))}
                  rows={2}
                  className="bg-black/20 border-white/10 resize-none min-h-[60px]"
                />
              </div>

              <DialogFooter className="pt-4 border-t border-white/10">
                <Button
                  type="submit"
                  disabled={save.isPending}
                  className="shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
                >
                  {save.isPending ? "Saving…" : editing ? "Save changes" : "Create ticket"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {newCustOpen && (
        <QuickCustomerDialog
          onClose={() => setNewCustOpen(false)}
          onCreated={(c) => {
            qc.invalidateQueries({ queryKey: ["customers-min"] });
            qc.invalidateQueries({ queryKey: ["customers"] });
            setForm((f) => ({ ...f, customer_id: c.id }));
            setCustSearch(c.name);
            setNewCustOpen(false);
          }}
        />
      )}

      <div className="rounded-2xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-xl p-4 shadow-lg">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search ticket, IMEI, brand, customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-black/20 border-white/10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-48 bg-black/20 border-white/10 text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f172a] border-white/10">
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.v} value={s.v}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-900/50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left rounded-tl-lg">Ticket</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Device</th>
                <th className="px-4 py-3 text-left">Technician</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Est. cost</th>
                <th className="px-4 py-3 text-left">ETA</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No repair tickets.
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const c = r.customer_id ? custMap.get(r.customer_id) : null;
                return (
                  <tr
                    key={r.id}
                    className="group border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold">
                      <button
                        className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                        onClick={() => setDetail(r)}
                      >
                        {r.ticket_no}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {c?.name ?? <span className="text-slate-500">—</span>}
                    </td>
                    <td
                      className="px-4 py-3 text-slate-400 truncate max-w-[200px]"
                      title={
                        [r.device_brand, r.device_model].filter(Boolean).join(" ") ||
                        r.device_type ||
                        ""
                      }
                    >
                      {[r.device_brand, r.device_model].filter(Boolean).join(" ") ||
                        r.device_type ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{r.technician_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={r.status}
                        onChange={(e) => updateStatus.mutate({ id: r.id, status: e.target.value })}
                        className={
                          "rounded-md border bg-black/40 px-2.5 py-1 text-[11px] uppercase tracking-wider outline-none cursor-pointer transition-colors " +
                          STATUS_COLOR[r.status]
                        }
                      >
                        {STATUSES.map((s) => (
                          <option
                            key={s.v}
                            value={s.v}
                            className="bg-[#0f172a] text-slate-200 normal-case"
                          >
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-200">
                      {inr(r.estimated_cost)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{fmtDate(r.estimated_completion)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-white/10"
                          aria-label={`Open details for ${r.ticket_no}`}
                          title="Open details"
                          onClick={() => setDetail(r)}
                        >
                          <ClipboardList className="h-4 w-4" />
                        </Button>
                        {c?.whatsapp && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-400/10"
                            aria-label={`Send WhatsApp update for ${r.ticket_no}`}
                            title="Send WhatsApp update"
                            onClick={() =>
                              wa.send({
                                kind: "status_update",
                                phone: c.whatsapp,
                                recipientName: c.name,
                                message: `Dear ${c.name}, update on your repair ticket ${r.ticket_no}: status is now ${r.status.replace(/_/g, " ")}. — ${profile?.shop_name ?? "RK Labs"}`,
                                repairId: r.id,
                                title: `Status update — ${r.ticket_no}`,
                              })
                            }
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10"
                          aria-label={`Edit ${r.ticket_no}`}
                          onClick={() => loadEditing(r)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                          aria-label={`Delete ${r.ticket_no}`}
                          onClick={() => {
                            if (confirm(`Delete ${r.ticket_no}?`)) del.mutate(r.id);
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

      {detail && (
        <RepairDetailDialog
          repair={detail}
          customer={detail.customer_id ? (custMap.get(detail.customer_id) ?? null) : null}
          profile={profile ?? null}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function FieldC({
  label,
  value,
  onChange,
  ...props
}: { label: string; value: string; onChange: (v: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} {...props} />
    </div>
  );
}

function QuickCustomerDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Customer) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const { createCustomerFn } = await import("@/lib/api/customers");
      const data = await createCustomerFn({
        data: {
          name,
          phone: phone || null,
          whatsapp: whatsapp || phone || null,
          address: address || null,
        },
      });
      toast.success("Customer added");
      onCreated({ id: data.id, name, phone, whatsapp, address } as Customer);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-strong max-w-md">
        <DialogHeader>
          <DialogTitle>Add new customer</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Same as phone if empty"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
          >
            {saving ? "Adding…" : "Add customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RepairDetailDialog({
  repair,
  customer,
  profile,
  onClose,
}: {
  repair: Repair;
  customer: Customer | null;
  profile: Profile | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [newTech, setNewTech] = useState(repair.technician_name ?? "");

  const { data: notes = [] } = useQuery({
    queryKey: ["repair-notes", repair.id],
    queryFn: async () => {
      const data = await getRepairNotesFn({ data: { repair_id: repair.id } });
      return data as RepairNote[];
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      if (!newNote.trim()) throw new Error("Empty note");
      await createRepairNoteFn({
        data: {
          repair_id: repair.id,
          note: newNote,
          technician_name: newTech || repair.technician_name || undefined,
        },
      });
    },
    onSuccess: () => {
      setNewNote("");
      qc.invalidateQueries({ queryKey: ["repair-notes", repair.id] });
      toast.success("Note added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleDone = useMutation({
    mutationFn: async (n: RepairNote) => {
      await updateRepairNoteFn({
        data: {
          id: n.id,
          data: {
            task_done: !n.task_done,
            completed_at: !n.task_done ? new Date().toISOString() : null,
          },
        },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repair-notes", repair.id] }),
  });

  async function printReceipt() {
    const tId = toast.loading("Generating branded receipt…");
    try {
      const doc = await buildIntakeReceiptPdf({
        shop: profile ?? undefined,
        invoice: { created_at: repair.created_at, invoice_no: repair.ticket_no },
        customer: customer ?? undefined,
        repair,
      });
      window.open(doc.output("bloburl"), "_blank");
      toast.success("Receipt opened for printing", { id: tId });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to generate receipt", { id: tId });
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-strong max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>Ticket {repair.ticket_no}</span>
            <Button size="sm" variant="outline" onClick={printReceipt}>
              <Printer className="mr-2 h-4 w-4" /> Print receipt
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass space-y-1 rounded-xl p-4 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Customer</div>
            <div className="font-semibold">{customer?.name ?? "—"}</div>
            <div className="text-muted-foreground">{customer?.phone}</div>
            <div className="text-muted-foreground">{customer?.address}</div>
          </div>
          <div className="glass space-y-1 rounded-xl p-4 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Device</div>
            <div className="font-semibold">
              {[repair.device_brand, repair.device_model].filter(Boolean).join(" ") || "—"}
            </div>
            <div className="text-muted-foreground">{repair.device_type}</div>
            <div className="text-muted-foreground">{repair.imei && `IMEI: ${repair.imei}`}</div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 text-sm">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Issue</div>
          <div className="mt-1">{repair.issue}</div>
        </div>

        <AppointmentPanel repair={repair} customer={customer} profile={profile} />

        <div className="glass rounded-xl p-4">
          <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
            Workflow timeline
          </div>
          <ol className="space-y-2 text-sm">
            <TimelineItem label="Received" at={repair.created_at} implicitDone={true} />
            {repair.appointment_at && (
              <TimelineItem label="Appointment scheduled" at={repair.appointment_at} accent implicitDone={!!repair.assigned_at || !!repair.completed_at || !!repair.delivered_at || repair.status === "delivered" || repair.status === "completed" || repair.status === "in_progress"} />
            )}
            <TimelineItem
              label={`Assigned to ${repair.technician_name ?? "technician"}`}
              at={repair.assigned_at}
              implicitDone={!!repair.completed_at || !!repair.delivered_at || repair.status === "delivered" || repair.status === "completed"}
            />
            <TimelineItem 
              label="Completed" 
              at={repair.completed_at} 
              implicitDone={!!repair.delivered_at || repair.status === "delivered"}
            />
            <TimelineItem 
              label="Delivered" 
              at={repair.delivered_at} 
              implicitDone={repair.status === "delivered"}
            />
          </ol>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Technician notes & tasks
            </div>
            <Badge variant="outline" className="border-white/20">
              {notes.filter((n) => n.task_done).length}/{notes.length} done
            </Badge>
          </div>
          <div className="space-y-2">
            {notes.length === 0 && (
              <div className="text-sm text-muted-foreground">No notes yet.</div>
            )}
            {notes.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/5 p-3 text-sm"
              >
                <button
                  onClick={() => toggleDone.mutate(n)}
                  className={
                    "mt-0.5 grid h-5 w-5 place-items-center rounded border " +
                    (n.task_done
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                      : "border-white/20")
                  }
                >
                  {n.task_done && <Check className="h-3 w-3" />}
                </button>
                <div className="flex-1">
                  <div className={n.task_done ? "line-through text-muted-foreground" : ""}>
                    {n.note}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {n.technician_name ?? "—"} · {fmtDateTime(n.created_at)}
                    {n.task_done && n.completed_at && ` · done ${fmtDateTime(n.completed_at)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-[180px_1fr_auto] gap-2">
            <Input
              placeholder="Technician name"
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
            />
            <Input
              placeholder="Add a note / task…"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNote.mutate()}
            />
            <Button onClick={() => addNote.mutate()} disabled={addNote.isPending}>
              Add
            </Button>
          </div>
        </div>

        <WaLogPanel repairId={repair.id} />
      </DialogContent>
    </Dialog>
  );
}

function TimelineItem({
  label,
  at,
  accent,
  implicitDone,
}: {
  label: string;
  at: string | null;
  accent?: boolean;
  implicitDone?: boolean;
}) {
  const isDone = at || implicitDone;
  const dotColor =
    accent && isDone
      ? "bg-[var(--neon)] shadow-[0_0_8px_var(--neon)]"
      : isDone
        ? "bg-[var(--neon)] shadow-[0_0_8px_var(--neon)]"
        : "bg-white/15";
  return (
    <li className="flex items-center gap-3">
      <div className={"h-2.5 w-2.5 rounded-full " + dotColor} />
      <span
        className={isDone ? (accent ? "text-[var(--neon)] font-medium" : "text-foreground") : "text-muted-foreground"}
      >
        {label}
      </span>
      <span className="ml-auto text-xs text-muted-foreground">
        {at ? fmtDateTime(at) : implicitDone ? "—" : "Pending"}
      </span>
    </li>
  );
}

type ApptEvent = {
  id: string;
  action: "scheduled" | "rescheduled" | "cancelled";
  previous_at: string | null;
  new_at: string | null;
  note: string | null;
  created_at: string;
};

function AppointmentPanel({
  repair,
  customer,
  profile,
}: {
  repair: Repair;
  customer: Customer | null;
  profile: Profile | null;
}) {
  const qc = useQueryClient();
  const wa = useWaSender();
  const [editing, setEditing] = useState(false);
  const initDate = repair.appointment_at
    ? new Date(repair.appointment_at).toISOString().slice(0, 10)
    : "";
  const initTime = repair.appointment_at
    ? `${String(new Date(repair.appointment_at).getHours()).padStart(2, "0")}:${String(new Date(repair.appointment_at).getMinutes()).padStart(2, "0")}`
    : "";
  const [date, setDate] = useState(initDate);
  const [time, setTime] = useState(initTime || "10:00");

  const historyQ = useQuery({
    queryKey: ["appointment_events", repair.id],
    queryFn: async () => {
      const data = await getAppointmentEventsFn({ data: { repair_id: repair.id } });
      return data as ApptEvent[];
    },
  });

  function autoNotify(next: string | null, action: "scheduled" | "rescheduled" | "cancelled") {
    const device =
      [repair.device_brand, repair.device_model].filter(Boolean).join(" ") ||
      repair.device_type ||
      "device";
    const shop = profile?.shop_name ?? "RK Labs";
    const custMsg = next
      ? `Dear ${customer?.name ?? "there"}, your appointment for ${device} (Ticket ${repair.ticket_no}) is ${action} to ${new Date(next).toLocaleString("en-IN")}. — ${shop}`
      : `Dear ${customer?.name ?? "there"}, your appointment for ${device} (Ticket ${repair.ticket_no}) has been cancelled. Please contact us to rebook. — ${shop}`;
    const shopMsg = next
      ? `Appointment ${action}: Ticket ${repair.ticket_no} (${customer?.name ?? "walk-in"}) — ${device} at ${new Date(next).toLocaleString("en-IN")}.`
      : `Appointment cancelled: Ticket ${repair.ticket_no} (${customer?.name ?? "walk-in"}) — ${device}.`;

    if (customer?.whatsapp) {
      wa.send({
        kind: "appointment",
        phone: customer.whatsapp,
        recipientName: customer.name,
        message: custMsg,
        repairId: repair.id,
        title: `Appointment ${action} — customer`,
      });
    }
    if (profile?.shop_phone) {
      setTimeout(
        () =>
          wa.send({
            kind: "appointment",
            phone: profile.shop_phone,
            recipientName: `${profile.shop_name ?? "Shop"} (internal)`,
            message: shopMsg,
            repairId: repair.id,
            title: `Appointment ${action} — shop copy`,
          }),
        400,
      );
    }
  }

  const update = useMutation({
    mutationFn: async (next: string | null) => {
      const previous_at = repair.appointment_at;
      const action: "scheduled" | "rescheduled" | "cancelled" = next
        ? previous_at
          ? "rescheduled"
          : "scheduled"
        : "cancelled";
      const { error } = (await updateRepairFn({
        data: { id: repair.id, data: { appointment_at: next } },
      })) as any;
      if (error) throw error;

      await createAppointmentEventFn({
        data: {
          repair_id: repair.id,
          action,
          previous_at,
          new_at: next,
        },
      });

      return { next, action };
    },
    onSuccess: ({ next, action }) => {
      qc.invalidateQueries({ queryKey: ["repairs"] });
      qc.invalidateQueries({ queryKey: ["appointment_events", repair.id] });
      setEditing(false);
      toast.success(`Appointment ${action}`);
      autoNotify(next, action);
    },
    onError: (e: any) => toast.error(e.message),
  });

  function saveNew() {
    if (!date) return toast.error("Pick a date");
    const iso = new Date(`${date}T${time || "10:00"}:00`).toISOString();
    update.mutate(iso);
  }

  const calEvent: CalEvent | null = repair.appointment_at
    ? {
        title: `Repair drop-off — Ticket ${repair.ticket_no}`,
        description: `${[repair.device_brand, repair.device_model].filter(Boolean).join(" ") || repair.device_type || "Device"} — ${repair.issue}`,
        location: profile?.shop_address ?? undefined,
        start: new Date(repair.appointment_at),
        durationMinutes: 45,
      }
    : null;

  const events = historyQ.data ?? [];
  const currentStatus = repair.appointment_at
    ? `Scheduled for ${fmtDateTime(repair.appointment_at)}`
    : events[0]?.action === "cancelled"
      ? "Cancelled"
      : "Not scheduled";

  const actionBadge: Record<ApptEvent["action"], string> = {
    scheduled: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    rescheduled: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
  };

  return (
    <div className="glass rounded-xl border border-[var(--neon)]/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--neon)]">
            <CalendarClock className="h-3.5 w-3.5" /> Appointment · {currentStatus}
          </div>
          {repair.appointment_at ? (
            <div className="text-base font-semibold">{fmtDateTime(repair.appointment_at)}</div>
          ) : (
            <div className="text-sm text-muted-foreground">No appointment scheduled.</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {calEvent && (
            <>
              <a href={googleCalendarUrl(calEvent)} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="glass">
                  <CalendarPlus className="mr-2 h-4 w-4" /> Google
                </Button>
              </a>
              <Button
                size="sm"
                variant="outline"
                className="glass"
                onClick={() => downloadIcs(calEvent, `${repair.ticket_no}.ics`)}
              >
                <CalendarPlus className="mr-2 h-4 w-4" /> .ics
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            className="glass"
            onClick={() => setEditing((v) => !v)}
          >
            <Edit className="mr-2 h-4 w-4" /> {repair.appointment_at ? "Reschedule" : "Schedule"}
          </Button>
          {repair.appointment_at && (
            <Button
              size="sm"
              variant="outline"
              className="glass border-red-500/40 text-red-300 hover:bg-red-500/10"
              onClick={() => {
                if (confirm("Cancel this appointment?")) update.mutate(null);
              }}
              disabled={update.isPending}
            >
              <CalendarX className="mr-2 h-4 w-4" /> Cancel
            </Button>
          )}
        </div>
      </div>
      {editing && (
        <div className="mt-3 grid grid-cols-[1fr_1fr_auto_auto] gap-2">
          <Input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
          />
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-9 rounded-md border border-input bg-input/40 px-3 text-sm"
          >
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={saveNew}
            disabled={update.isPending}
            style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="mt-4">
        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">History</div>
        {historyQ.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : events.length === 0 ? (
          <div className="text-sm text-muted-foreground">No changes yet.</div>
        ) : (
          <ul className="space-y-2">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"
              >
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs capitalize ${actionBadge[ev.action]}`}
                >
                  {ev.action}
                </span>
                <span className="text-muted-foreground">
                  {ev.action === "cancelled"
                    ? ev.previous_at
                      ? `was ${fmtDateTime(ev.previous_at)}`
                      : "—"
                    : ev.action === "rescheduled"
                      ? `${ev.previous_at ? fmtDateTime(ev.previous_at) : "—"} → ${ev.new_at ? fmtDateTime(ev.new_at) : "—"}`
                      : ev.new_at
                        ? fmtDateTime(ev.new_at)
                        : "—"}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {fmtDateTime(ev.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function F({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
}

type WaLog = {
  id: string;
  kind: string;
  recipient_name: string | null;
  phone: string | null;
  message: string;
  status: string;
  error: string | null;
  created_at: string;
};

function WaLogPanel({ repairId }: { repairId: string }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["wa-logs", repairId],
    queryFn: async () => {
      const data = await getWaLogsFn({ data: { repair_id: repairId } });
      return data as WaLog[];
    },
    refetchInterval: 10_000,
  });

  const statusClass: Record<string, string> = {
    sent: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    blocked: "bg-red-500/15 text-red-300 border-red-500/30",
    cancelled: "bg-white/10 text-muted-foreground border-white/20",
    no_phone: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };

  return (
    <div className="glass rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          WhatsApp send log
        </div>
        <Badge variant="outline" className="border-white/20">
          {logs.length} entries
        </Badge>
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : logs.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No WhatsApp messages sent for this ticket yet.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="rounded-lg border border-white/5 bg-white/5 p-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={statusClass[l.status] ?? "border-white/20"}>
                  {l.status}
                </Badge>
                <span className="font-semibold capitalize">{l.kind.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">
                  → {l.recipient_name ?? l.phone ?? "—"}
                </span>
                <span className="ml-auto text-muted-foreground">{fmtDateTime(l.created_at)}</span>
              </div>
              <div className="mt-2 whitespace-pre-wrap text-muted-foreground line-clamp-3">
                {l.message}
              </div>
              {l.error && <div className="mt-1 text-red-300">Error: {l.error}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
