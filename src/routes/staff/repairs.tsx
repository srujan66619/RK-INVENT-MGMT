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
  RotateCw,
  Boxes,
  Clock,
  CheckCircle2,
  Wrench,
  Filter,
  Phone,
  AlertCircle,
  Eye,
  User,
  Laptop,
  IndianRupee,
  History,
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
import { useAuth } from "@/hooks/use-auth";
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
import { RepairPartsPanel } from "@/components/repair-parts-panel";

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
  received: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 font-semibold",
  diagnosis: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 font-semibold",
  waiting_parts: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold",
  in_progress: "bg-primary/15 text-primary border-primary/30 font-semibold",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold",
  ready_delivery: "bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30 font-semibold",
  delivered: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 font-semibold",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 font-semibold",
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
  estimated_cost: number | string;
  estimate_change_reason?: string;
  advance_amount: number;
  payment_mode: string;
  technician_name: string;
  technician_notes: string;
  appointment_date: string;
  appointment_time: string;
  auto_send_wa: boolean;
  customer_mobile: string;
  parts_used: { item_id: string; item_name: string; sku: string | null; quantity: number; available: number }[];
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
  estimated_cost: "0",
  estimate_change_reason: "",
  advance_amount: 0,
  payment_mode: "Cash",
  technician_name: "",
  technician_notes: "",
  appointment_date: "",
  appointment_time: "",
  auto_send_wa: true,
  customer_mobile: "",
  parts_used: [],
};

function RepairsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canEditEstimatedCost = user?.role === "admin" || user?.role === "manager" || user?.role === "owner";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "est_high" | "est_low">("newest");
  const [activeKpi, setActiveKpi] = useState<string>("all");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Repair | null>(null);
  const [detail, setDetail] = useState<Repair | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [custSearch, setCustSearch] = useState("");
  const [newCustOpen, setNewCustOpen] = useState(false);
  const [addPartOpen, setAddPartOpen] = useState(false);
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

  // Compute live KPI metrics from real repairs records
  const kpis = useMemo(() => {
    const total = repairs.length;
    const newReceived = repairs.filter(r => r.status === "received" || r.status === "diagnosis").length;
    const inProgress = repairs.filter(r => r.status === "in_progress").length;
    const waitingParts = repairs.filter(r => r.status === "waiting_parts").length;
    const readyDelivery = repairs.filter(r => r.status === "ready_delivery").length;
    const completedDelivered = repairs.filter(r => r.status === "completed" || r.status === "delivered").length;
    return { total, newReceived, inProgress, waitingParts, readyDelivery, completedDelivered };
  }, [repairs]);

  // Unique technicians for filtering
  const technicianList = useMemo(() => {
    const set = new Set<string>();
    repairs.forEach(r => {
      if (r.technician_name && r.technician_name.trim() && r.technician_name !== "Unassigned") {
        set.add(r.technician_name.trim());
      }
    });
    return Array.from(set).sort();
  }, [repairs]);

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
      estimated_cost: r.estimated_cost != null ? String(r.estimated_cost) : "0",
      estimate_change_reason: "",
      advance_amount: 0,
      payment_mode: "Cash",
      technician_name: r.technician_name ?? "",
      technician_notes: r.technician_notes ?? "",
      appointment_date: r.appointment_at ? r.appointment_at.slice(0, 10) : "",
      appointment_time: r.appointment_at
        ? new Date(r.appointment_at).toISOString().slice(11, 16)
        : "",
      auto_send_wa: true,
      customer_mobile: r.customer_id
        ? (custMap.get(r.customer_id)?.phone ?? custMap.get(r.customer_id)?.whatsapp ?? "")
        : "",
      parts_used: [],
    });
    const c = r.customer_id ? custMap.get(r.customer_id) : null;
    setCustSearch(c?.name ?? "");
    setOpen(true);
  }

  // Filter & sort repairs
  const filtered = useMemo(() => {
    return repairs
      .filter((r) => {
        // KPI active filter
        if (activeKpi === "new_received" && !(r.status === "received" || r.status === "diagnosis")) return false;
        if (activeKpi === "in_progress" && r.status !== "in_progress") return false;
        if (activeKpi === "waiting_parts" && r.status !== "waiting_parts") return false;
        if (activeKpi === "ready_delivery" && r.status !== "ready_delivery") return false;
        if (activeKpi === "completed_delivered" && !(r.status === "completed" || r.status === "delivered")) return false;

        // Status dropdown filter
        if (statusFilter !== "all" && r.status !== statusFilter) return false;

        // Technician filter
        if (techFilter !== "all" && r.technician_name !== techFilter) return false;

        // Search query
        const q = search.trim().toLowerCase();
        if (!q) return true;

        const c = r.customer_id ? custMap.get(r.customer_id) : null;
        return (
          r.ticket_no.toLowerCase().includes(q) ||
          (r.imei && r.imei.toLowerCase().includes(q)) ||
          (r.device_brand && r.device_brand.toLowerCase().includes(q)) ||
          (r.device_model && r.device_model.toLowerCase().includes(q)) ||
          (r.issue && r.issue.toLowerCase().includes(q)) ||
          (c?.name && c.name.toLowerCase().includes(q)) ||
          (c?.phone && c.phone.includes(q)) ||
          (c?.whatsapp && c.whatsapp.includes(q))
        );
      })
      .sort((a, b) => {
        if (sortOrder === "newest") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortOrder === "oldest") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortOrder === "est_high") {
          return Number(b.estimated_cost ?? 0) - Number(a.estimated_cost ?? 0);
        }
        if (sortOrder === "est_low") {
          return Number(a.estimated_cost ?? 0) - Number(b.estimated_cost ?? 0);
        }
        return 0;
      });
  }, [repairs, activeKpi, statusFilter, techFilter, search, sortOrder, custMap]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.issue.trim()) throw new Error("Issue description is required");

      const numEst = Number(form.estimated_cost);
      if (isNaN(numEst) || numEst < 0) {
        throw new Error("Estimated repair cost must be a valid non-negative number.");
      }

      let customerId = form.customer_id || null;
      // Auto-create customer if staff entered a customer name in search box but didn't select an existing record
      if (!customerId && custSearch.trim() && custSearch.trim().toLowerCase() !== "walk-in") {
        try {
          const { createCustomerFn } = await import("@/lib/api/customers");
          const createdCust = await createCustomerFn({
            data: {
              name: custSearch.trim(),
              phone: form.customer_mobile.trim() || null,
              whatsapp: form.customer_mobile.trim() || null,
            },
          });
          customerId = createdCust.id;
          qc.invalidateQueries({ queryKey: ["customers-min"] });
        } catch (e: any) {
          console.warn("Could not auto-create customer, proceeding as walk-in:", e);
        }
      }

      // Update phone on existing customer if provided and currently empty
      if (customerId && form.customer_mobile.trim()) {
        const existing = custMap.get(customerId);
        if (existing && !existing.phone) {
          try {
            const { updateCustomerFn } = await import("@/lib/api/customers");
            await updateCustomerFn({
              data: {
                id: customerId,
                data: {
                  phone: form.customer_mobile.trim(),
                  whatsapp: existing.whatsapp || form.customer_mobile.trim(),
                },
              },
            });
            qc.invalidateQueries({ queryKey: ["customers-min"] });
          } catch (e) {
            console.warn("Could not update customer phone:", e);
          }
        }
      }

      let appointment_at: string | null = null;
      if (form.appointment_date) {
        const t = form.appointment_time || "10:00";
        const d = new Date(`${form.appointment_date}T${t}:00`);
        if (!isNaN(d.getTime())) appointment_at = d.toISOString();
      }

      const payload = {
        customer_id: customerId,
        device_type: form.device_type || null,
        device_brand: form.device_brand || null,
        device_model: form.device_model || null,
        imei: form.imei || null,
        issue: form.issue.trim(),
        status: form.status as any,
        technician_name: form.technician_name.trim() || "Unassigned",
        technician_notes: form.technician_notes || null,
        estimated_completion: form.estimated_completion || null,
        estimated_cost: numEst,
        appointment_at,
      };
      if (editing) {
        const data = await updateRepairFn({
          data: {
            id: editing.id,
            data: payload,
            estimate_change_reason: form.estimate_change_reason?.trim() || undefined,
          },
        });
        return { row: { ...editing, ...data } as unknown as Repair, isNew: false };
      }
      const newPayload = { ...payload, parts_used: form.parts_used.map(p => ({ item_id: p.item_id, quantity: p.quantity })) };
      const data = await createRepairFn({ data: newPayload });
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
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Repairs Management</h1>
            <Badge variant="outline" className="font-mono text-xs border-primary/40 bg-primary/5 text-primary">
              Live Workshop
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {repairs.length} total tickets · workflow tracking · instant WhatsApp updates
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["repairs"] });
              toast.info("Refreshed repair tickets");
            }}
            disabled={isLoading}
            className="h-10 px-3.5 border-border bg-background hover:bg-muted text-foreground transition-all shadow-xs cursor-pointer"
            title="Refresh ticket data"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline ml-2 text-xs font-semibold">Refresh</span>
          </Button>

          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => setOpen(true)}
                className="h-10 px-5 shadow-md shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" /> New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong max-h-[90vh] max-w-2xl overflow-y-auto custom-scrollbar border-border shadow-2xl">
              <DialogHeader className="border-b border-border pb-4 mb-4">
                <DialogTitle className="text-xl tracking-tight text-foreground">
                  {editing ? `Edit Ticket ${editing.ticket_no}` : "New Repair Ticket"}
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
                  <Label className="text-foreground font-medium text-xs">Customer</Label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search by name, phone or WhatsApp…"
                        value={custSearch}
                        onChange={(e) => {
                          setCustSearch(e.target.value);
                          if (form.customer_id) setForm((f) => ({ ...f, customer_id: "" }));
                        }}
                        className="bg-muted border-border focus:border-primary/50"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 border-border bg-secondary hover:bg-accent hover:text-primary cursor-pointer"
                        onClick={() => setNewCustOpen(true)}
                        title="Add new customer"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    {custSuggestions.length > 0 && (
                      <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-xl custom-scrollbar">
                        {custSuggestions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="flex w-full flex-col items-start gap-0.5 border-b border-border/50 px-4 py-3 text-left text-sm hover:bg-secondary transition-colors"
                            onClick={() => {
                              setForm((f) => ({
                                ...f,
                                customer_id: c.id,
                                customer_mobile: f.customer_mobile || c.phone || c.whatsapp || "",
                              }));
                              setCustSearch(c.name);
                            }}
                          >
                            <span className="font-medium text-foreground">{c.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {c.phone ?? c.whatsapp ?? "—"}
                              {c.address ? ` · ${c.address}` : ""}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedCustomer && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs mt-2 shadow-sm">
                      <div className="font-semibold text-primary">{selectedCustomer.name}</div>
                      <div className="text-primary/70 mt-1">
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

                {/* Technician input */}
                <div className="space-y-1.5">
                  <Label className="text-foreground font-medium text-xs">Technician</Label>
                  <Input
                    placeholder="Technician name (or leave unassigned)"
                    value={form.technician_name}
                    onChange={(e) => setForm((f) => ({ ...f, technician_name: e.target.value }))}
                    className="bg-muted border-border focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-foreground font-medium text-xs">Customer mobile number</Label>
                  <Input
                    type="tel"
                    inputMode="tel"
                    placeholder="e.g. 9876543210"
                    value={form.customer_mobile}
                    onChange={(e) => setForm((f) => ({ ...f, customer_mobile: e.target.value }))}
                    className="bg-muted border-border focus:border-primary/50"
                  />
                  <div className="text-[11px] text-muted-foreground">
                    Saved to customer record if empty.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-foreground font-medium text-xs">Device type</Label>
                    <select
                      value={form.device_type}
                      onChange={(e) => setForm((f) => ({ ...f, device_type: e.target.value }))}
                      className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm focus:border-primary/50 outline-none"
                    >
                      {DEVICE_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-card">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <FieldC
                    label="Brand"
                    value={form.device_brand}
                    onChange={(v) => setForm((f) => ({ ...f, device_brand: v }))}
                    className="bg-muted border-border focus:border-primary/50"
                  />
                  <FieldC
                    label="Model"
                    value={form.device_model}
                    onChange={(v) => setForm((f) => ({ ...f, device_model: v }))}
                    className="bg-muted border-border focus:border-primary/50"
                  />
                  <FieldC
                    label="IMEI / Serial"
                    value={form.imei}
                    onChange={(v) => setForm((f) => ({ ...f, imei: v }))}
                    className="bg-muted border-border focus:border-primary/50"
                  />
                  <div className="space-y-1.5">
                    <Label className="text-foreground font-medium text-xs">Status</Label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm focus:border-primary/50 outline-none"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.v} value={s.v} className="bg-card">
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
                    className="bg-muted border-border focus:border-primary/50"
                  />

                  {/* EDITABLE ESTIMATED COST FIELD (MODIFICATION 3) */}
                  <div className="space-y-1.5 col-span-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground font-semibold text-xs flex items-center gap-1.5">
                        <span>Estimated Repair Cost (₹)</span>
                        {editing && !canEditEstimatedCost && (
                          <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
                            Admin / Manager Only
                          </Badge>
                        )}
                      </Label>
                      {Number(form.estimated_cost) > 0 && (
                        <span className="text-xs font-mono font-bold text-primary">
                          {inr(Number(form.estimated_cost))}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                        ₹
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={editing ? !canEditEstimatedCost : false}
                        placeholder="0.00"
                        value={form.estimated_cost}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((f) => ({ ...f, estimated_cost: val }));
                        }}
                        className="pl-8 bg-muted border-border font-semibold text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:border-primary/50"
                      />
                    </div>
                    {Number(form.estimated_cost) < 0 && (
                      <p className="text-xs text-destructive font-medium">
                        Estimated cost cannot be negative.
                      </p>
                    )}
                    {editing && canEditEstimatedCost && (
                      <div className="pt-1.5 space-y-1">
                        <Input
                          placeholder="Reason for estimate update (optional, e.g. Diagnostic revealed screen defect)"
                          value={form.estimate_change_reason}
                          onChange={(e) => setForm((f) => ({ ...f, estimate_change_reason: e.target.value }))}
                          className="text-xs bg-muted/60 border-border"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Modifying the estimate creates an audit trail entry and does not affect finalized invoices or inventory costs.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-secondary p-4 space-y-3 shadow-inner">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    Appointment slot (optional)
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldC
                      label="Appointment date"
                      type="date"
                      value={form.appointment_date}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(v) => setForm((f) => ({ ...f, appointment_date: v }))}
                      className="bg-muted border-border focus:border-primary/50"
                    />
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground">Time slot</Label>
                      <select
                        value={form.appointment_time}
                        onChange={(e) => setForm((f) => ({ ...f, appointment_time: e.target.value }))}
                        disabled={!form.appointment_date}
                        className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm disabled:opacity-50 focus:border-primary/50 outline-none"
                      >
                        <option value="" className="bg-card">
                          Select a slot…
                        </option>
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t} className="bg-card">
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Pick when the customer will drop off the device. Saved with the ticket.
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">Issue description</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
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
                    className="bg-muted border-border focus:border-primary/50 resize-none min-h-[80px]"
                  />
                  {suggestion && (
                    <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm mt-2 shadow-sm">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="text-muted-foreground">
                        <span className="font-semibold text-primary">AI suggestion:</span>{" "}
                        {suggestion}
                      </div>
                    </div>
                  )}
                </div>

                {!editing && (
                  <div className="rounded-xl border border-border bg-secondary p-4 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Parts / Inventory Used
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setAddPartOpen(true)}
                        className="h-8 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Inventory Item
                      </Button>
                    </div>
                    {form.parts_used.length > 0 ? (
                      <div className="space-y-2">
                        {form.parts_used.map((p, idx) => (
                          <div key={idx} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/50 p-3 text-sm">
                            <div>
                              <div className="font-semibold">{p.item_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {p.sku ? `SKU: ${p.sku}` : "No SKU"} · Qty: {p.quantity} · Available after: {p.available - p.quantity}
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                              onClick={() => {
                                setForm(f => ({ ...f, parts_used: f.parts_used.filter((_, i) => i !== idx) }));
                              }}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">No parts selected.</div>
                    )}
                  </div>
                )}

                {!editing && (
                  <div className="rounded-xl border border-border bg-secondary p-4 space-y-4 shadow-inner">
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
                        className="bg-muted border-border"
                      />
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground">Mode</Label>
                        <select
                          value={form.payment_mode}
                          onChange={(e) => setForm((f) => ({ ...f, payment_mode: e.target.value }))}
                          className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm focus:border-emerald-500/50 outline-none"
                        >
                          <option className="bg-card">Cash</option>
                          <option className="bg-card">UPI</option>
                          <option className="bg-card">Card</option>
                          <option className="bg-card">Bank Transfer</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground">Balance due</Label>
                        <div className="grid h-10 place-items-center rounded-md border border-border bg-muted text-sm font-bold text-emerald-400">
                          {inr(balance)}
                        </div>
                      </div>
                    </div>
                    <label className="flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3 text-sm cursor-pointer hover:bg-secondary transition-colors">
                      <input
                        type="checkbox"
                        checked={form.auto_send_wa}
                        onChange={(e) => setForm((f) => ({ ...f, auto_send_wa: e.target.checked }))}
                        className="h-4 w-4 accent-emerald-500 rounded border-white/20"
                      />
                      <span className="text-muted-foreground text-sm">
                        One-click WhatsApp — auto-send advance receipt to customer
                      </span>
                    </label>
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  <Label className="text-muted-foreground">Initial technician notes (optional)</Label>
                  <Textarea
                    value={form.technician_notes}
                    onChange={(e) => setForm((f) => ({ ...f, technician_notes: e.target.value }))}
                    rows={2}
                    className="bg-muted border-border resize-none min-h-[60px]"
                  />
                </div>

                {editing && (
                  <div className="pt-2">
                    <RepairPartsPanel repairId={editing.id} />
                  </div>
                )}

                <DialogFooter className="pt-4 border-t border-border">
                  <Button
                    type="submit"
                    disabled={save.isPending}
                    className="shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    {save.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                      </span>
                    ) : editing ? (
                      "Save changes"
                    ) : (
                      "Create ticket"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* KPI Overview Cards (Clickable filtering based on live DB values) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: "all", label: "Total Repairs", count: kpis.total, icon: Wrench, color: "text-primary", border: "border-primary/30", bg: "bg-primary/5" },
          { id: "new_received", label: "New / Received", count: kpis.newReceived, icon: Sparkles, color: "text-blue-600 dark:text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/5" },
          { id: "in_progress", label: "In Progress", count: kpis.inProgress, icon: Clock, color: "text-sky-600 dark:text-sky-400", border: "border-sky-500/30", bg: "bg-sky-500/5" },
          { id: "waiting_parts", label: "Waiting Parts", count: kpis.waitingParts, icon: Boxes, color: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5" },
          { id: "ready_delivery", label: "Ready for Delivery", count: kpis.readyDelivery, icon: CheckCircle2, color: "text-teal-600 dark:text-teal-400", border: "border-teal-500/30", bg: "bg-teal-500/5" },
          { id: "completed_delivered", label: "Delivered", count: kpis.completedDelivered, icon: Check, color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5" },
        ].map((k) => {
          const isActive = activeKpi === k.id;
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => {
                setActiveKpi(activeKpi === k.id ? "all" : k.id);
                if (k.id !== "all") setStatusFilter("all");
              }}
              className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${k.bg} ${
                isActive
                  ? `${k.border} ring-2 ring-primary shadow-md scale-[1.02]`
                  : "border-border/80 hover:border-primary/40 hover:shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                <span className="truncate pr-1">{k.label}</span>
                <k.icon className={`h-3.5 w-3.5 shrink-0 ${k.color}`} />
              </div>
              <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${k.color}`}>
                {k.count}
              </div>
            </button>
          );
        })}
      </div>

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

      {addPartOpen && (
        <AddPartToNewRepairDialog
          onClose={() => setAddPartOpen(false)}
          onAdd={(part) => {
            setForm(f => {
              const existingIdx = f.parts_used.findIndex(p => p.item_id === part.item_id);
              if (existingIdx !== -1) {
                const updated = [...f.parts_used];
                updated[existingIdx].quantity += part.quantity;
                return { ...f, parts_used: updated };
              }
              return { ...f, parts_used: [...f.parts_used, part] };
            });
            setAddPartOpen(false);
          }}
        />
      )}

      {/* Advanced Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ticket #, customer, phone, device, IMEI…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-9.5 bg-muted border-border text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              if (val !== "all") setActiveKpi("all");
            }}
          >
            <SelectTrigger className="h-9.5 w-44 bg-muted border-border text-xs font-semibold text-foreground">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.v} value={s.v} className="text-xs">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Technician Dropdown Filter */}
          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger className="h-9.5 w-40 bg-muted border-border text-xs font-semibold text-foreground">
              <SelectValue placeholder="Technician" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Technicians</SelectItem>
              {technicianList.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
            <SelectTrigger className="h-9.5 w-36 bg-muted border-border text-xs font-semibold text-foreground">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
              <SelectItem value="oldest" className="text-xs">Oldest First</SelectItem>
              <SelectItem value="est_high" className="text-xs">Est. Cost: High → Low</SelectItem>
              <SelectItem value="est_low" className="text-xs">Est. Cost: Low → High</SelectItem>
            </SelectContent>
          </Select>

          {(search || statusFilter !== "all" || techFilter !== "all" || activeKpi !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setTechFilter("all");
                setActiveKpi("all");
              }}
              className="h-9.5 px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="mr-1.5 h-3.5 w-3.5" /> Clear Filters
            </Button>
          )}
        </div>

        <div className="text-xs font-medium text-muted-foreground px-1 shrink-0">
          Showing <strong className="text-foreground">{filtered.length}</strong> of {repairs.length}
        </div>
      </div>

      {/* Repairs Table / Cards Container */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/80">
              <tr>
                <th className="px-4 py-3.5 text-left font-semibold">Ticket</th>
                <th className="px-4 py-3.5 text-left font-semibold">Customer</th>
                <th className="px-4 py-3.5 text-left font-semibold">Device</th>
                <th className="px-4 py-3.5 text-left font-semibold">Technician</th>
                <th className="px-4 py-3.5 text-left font-semibold">Status</th>
                <th className="px-4 py-3.5 text-right font-semibold">Est. Cost</th>
                <th className="px-4 py-3.5 text-left font-semibold">ETA</th>
                <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading repair tickets…
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No repair tickets match the selected filters.
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const c = r.customer_id ? custMap.get(r.customer_id) : null;
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border/60 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs font-bold">
                      <button
                        className="text-primary hover:text-primary/80 hover:underline transition-colors cursor-pointer"
                        onClick={() => setDetail(r)}
                        title="Click to view full ticket details"
                      >
                        {r.ticket_no}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-foreground font-medium">
                      <div className="flex flex-col">
                        <span>{c?.name ?? <span className="text-muted-foreground italic">Walk-in</span>}</span>
                        {(c?.phone || c?.whatsapp) && (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {c.phone || c.whatsapp}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-foreground">
                      <div className="flex flex-col max-w-[200px]">
                        <span className="truncate font-medium text-xs">
                          {[r.device_brand, r.device_model].filter(Boolean).join(" ") || r.device_type || "—"}
                        </span>
                        {r.device_type && (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {r.device_type}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {r.technician_name && r.technician_name !== "Unassigned" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary text-foreground font-medium">
                          {r.technician_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={r.status}
                        onChange={(e) => updateStatus.mutate({ id: r.id, status: e.target.value })}
                        className={
                          "rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider outline-none cursor-pointer transition-all " +
                          STATUS_COLOR[r.status]
                        }
                      >
                        {STATUSES.map((s) => (
                          <option
                            key={s.v}
                            value={s.v}
                            className="bg-card text-foreground normal-case font-normal"
                          >
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground">
                      {inr(r.estimated_cost)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {fmtDate(r.estimated_completion)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {/* ACTION BUTTONS: Always visible with high contrast in light & dark mode */}
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 bg-background border-border text-foreground hover:bg-muted shadow-xs font-medium text-xs flex items-center gap-1.5 focus-visible:ring-2 cursor-pointer"
                          aria-label={`Open details for ${r.ticket_no}`}
                          title="Open details"
                          onClick={() => setDetail(r)}
                        >
                          <ClipboardList className="h-3.5 w-3.5 text-primary" />
                          <span className="hidden xl:inline">Details</span>
                        </Button>

                        {c?.whatsapp && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-xs font-medium text-xs flex items-center gap-1.5 focus-visible:ring-2 cursor-pointer"
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
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="hidden xl:inline">WhatsApp</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 shadow-xs font-medium text-xs flex items-center gap-1.5 focus-visible:ring-2 cursor-pointer"
                          aria-label={`Edit ${r.ticket_no}`}
                          title="Edit ticket"
                          onClick={() => loadEditing(r)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">Edit</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 shadow-xs font-medium text-xs flex items-center justify-center focus-visible:ring-2 cursor-pointer"
                          aria-label={`Delete ${r.ticket_no}`}
                          title="Delete ticket"
                          onClick={() => {
                            if (confirm(`Delete ${r.ticket_no}?`)) del.mutate(r.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="block md:hidden p-3 space-y-3">
          {isLoading && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
              Loading tickets…
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No repair tickets found.
            </div>
          )}
          {filtered.map((r) => {
            const c = r.customer_id ? custMap.get(r.customer_id) : null;
            return (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setDetail(r)}
                    className="font-mono font-bold text-primary hover:underline text-sm cursor-pointer"
                  >
                    {r.ticket_no}
                  </button>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${STATUS_COLOR[r.status]}`}>
                    {r.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Customer: </span>
                    <span className="font-semibold text-foreground">{c?.name ?? "Walk-in"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Cost: </span>
                    <span className="font-bold text-foreground">{inr(r.estimated_cost)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Device: </span>
                    <span className="font-medium text-foreground">
                      {[r.device_brand, r.device_model].filter(Boolean).join(" ") || r.device_type || "—"}
                    </span>
                  </div>
                </div>

                {/* Mobile Action Buttons: Visible at all times with crisp borders */}
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/70">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs bg-background border-border text-foreground hover:bg-muted"
                    onClick={() => setDetail(r)}
                  >
                    <ClipboardList className="mr-1 h-3.5 w-3.5 text-primary" /> Details
                  </Button>

                  {c?.whatsapp && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
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
                      <MessageCircle className="mr-1 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> WhatsApp
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={() => loadEditing(r)}
                  >
                    <Edit className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 text-xs border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                    onClick={() => {
                      if (confirm(`Delete ${r.ticket_no}?`)) del.mutate(r.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
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
      doc.save(`service intake ${repair.ticket_no}.pdf`);
      toast.success("Receipt downloaded successfully", { id: tId });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to generate receipt", { id: tId });
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-strong max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 pr-8">
            <span>Ticket {repair.ticket_no}</span>
            <Button size="sm" variant="outline" onClick={printReceipt}>
              <Printer className="mr-2 h-4 w-4" /> Print receipt
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass space-y-1.5 rounded-xl p-4 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" /> Customer Info
            </div>
            <div className="font-semibold text-foreground pt-1">{customer?.name ?? "Walk-in"}</div>
            <div className="text-muted-foreground">{customer?.phone || "No phone recorded"}</div>
            <div className="text-xs text-muted-foreground truncate">{customer?.address || "No address on file"}</div>
          </div>
          <div className="glass space-y-1.5 rounded-xl p-4 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Laptop className="h-3.5 w-3.5 text-primary" /> Device Info
            </div>
            <div className="font-semibold text-foreground pt-1">
              {[repair.device_brand, repair.device_model].filter(Boolean).join(" ") || "—"}
            </div>
            <div className="text-muted-foreground capitalize">{repair.device_type}</div>
            <div className="text-xs text-muted-foreground font-mono">{repair.imei ? `IMEI: ${repair.imei}` : "No IMEI"}</div>
          </div>
          <div className="glass space-y-1.5 rounded-xl p-4 text-sm border-l-2 border-primary/40">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-primary" /> Financials & Estimate
            </div>
            <div className="pt-1 flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Estimated Cost:</span>
              <span className="font-bold text-primary font-mono text-base">₹{Number(repair.estimated_cost || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">Final Cost:</span>
              <span className="font-medium text-foreground font-mono">
                {repair.final_cost != null ? `₹${Number(repair.final_cost).toLocaleString("en-IN")}` : "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground">Status:</span>
              <StatusBadge status={repair.status} />
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 text-sm">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Reported Issue & Diagnosis</div>
          <div className="mt-1.5 text-foreground leading-relaxed">{repair.issue}</div>
        </div>

        <RepairPartsPanel repairId={repair.id} />

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
              label={`Assigned to ${repair.technician_name || "technician"}`}
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
            <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-semibold">
              <History className="h-3.5 w-3.5 text-primary" /> Technician notes & Audit Trail
            </div>
            <Badge variant="outline" className="border-border">
              {notes.filter((n) => n.task_done).length}/{notes.length} done
            </Badge>
          </div>
          <div className="space-y-2">
            {notes.length === 0 && (
              <div className="text-sm text-muted-foreground">No notes or audit events yet.</div>
            )}
            {notes.map((n) => {
              const isAudit = n.note?.startsWith("[Estimate Revised]");
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                    isAudit
                      ? "border-amber-500/30 bg-amber-500/5 text-foreground"
                      : "border-border/60 bg-secondary/40 text-foreground"
                  }`}
                >
                  {!isAudit ? (
                    <button
                      onClick={() => toggleDone.mutate(n)}
                      className={
                        "mt-0.5 grid h-5 w-5 place-items-center rounded border transition-colors " +
                        (n.task_done
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                          : "border-border hover:border-primary")
                      }
                      title={n.task_done ? "Mark as pending" : "Mark as completed"}
                    >
                      {n.task_done && <Check className="h-3 w-3" />}
                    </button>
                  ) : (
                    <div className="mt-0.5 grid h-5 w-5 place-items-center rounded border border-amber-500/40 bg-amber-500/10 text-amber-500">
                      <History className="h-3 w-3" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={n.task_done ? "line-through text-muted-foreground" : ""}>
                        {n.note}
                      </div>
                      {isAudit && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 py-0 h-4">
                          Audit Log
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {n.technician_name || "System"} · {fmtDateTime(n.created_at)}
                      {n.task_done && n.completed_at && ` · done ${fmtDateTime(n.completed_at)}`}
                    </div>
                  </div>
                </div>
              );
            })}
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
        {at ? fmtDateTime(at) : implicitDone ? "Done" : "Pending"}
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
    rescheduled: "bg-cardmber-500/15 text-amber-300 border-amber-500/30",
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
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-white/[0.02] px-3 py-2 text-sm"
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
    no_phone: "bg-cardmber-500/15 text-amber-300 border-amber-500/30",
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
            <div key={l.id} className="rounded-lg border border-border/50 bg-secondary p-3 text-xs">
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
              <div className="mt-1.5 pl-[72px] text-muted-foreground">{l.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddPartToNewRepairDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (part: { item_id: string; item_name: string; sku: string | null; quantity: number; available: number }) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { getInventoryItemsFn } = await import("@/lib/api/inventory");
      return await getInventoryItemsFn();
    },
  });

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return inventory.slice(0, 50);
    return inventory
      .filter(
        (i: any) =>
          i.name.toLowerCase().includes(q) ||
          (i.sku && i.sku.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q))
      )
      .slice(0, 50);
  }, [inventory, search]);

  const selectedItem = useMemo(() => {
    return inventory.find((i: any) => i.id === selectedItemId);
  }, [inventory, selectedItemId]);

  function handleAdd() {
    if (!selectedItem) return;
    if (quantity < 1 || !Number.isInteger(quantity) || quantity > selectedItem.stock_level) return;
    
    onAdd({
      item_id: selectedItem.id,
      item_name: selectedItem.name,
      sku: selectedItem.sku,
      quantity,
      available: selectedItem.stock_level
    });
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-strong max-w-md border-border">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {!selectedItem ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search inventory by name, SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-muted border-border focus:border-primary/50"
                  autoFocus
                />
              </div>

              <div className="max-h-60 overflow-y-auto custom-scrollbar rounded-md border border-border/50 bg-secondary/30">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground text-xs">Loading inventory...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-xs">No items found.</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {filteredItems.map((item: any) => (
                      <button
                        key={item.id}
                        type="button"
                        className="w-full flex flex-col items-start gap-1 p-3 text-left hover:bg-primary/10 transition-colors"
                        onClick={() => {
                          setSelectedItemId(item.id);
                          setQuantity(1);
                        }}
                      >
                        <span className="font-semibold text-foreground line-clamp-1">{item.name}</span>
                        <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                          <span>{item.sku ? `SKU: ${item.sku}` : 'No SKU'}</span>
                          <span className={item.stock_level > 0 ? "text-emerald-400" : "text-red-400"}>
                            {item.stock_level > 0 ? `Stock: ${item.stock_level}` : "OUT OF STOCK"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/50 bg-secondary/50 p-4 relative">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:bg-black/20"
                  onClick={() => setSelectedItemId("")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <div className="font-semibold text-base text-foreground pr-8">{selectedItem.name}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>SKU: {selectedItem.sku || "—"}</div>
                  <div>Cost: {inr(selectedItem.cost_price)}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">Available Stock:</span>
                    <span className={selectedItem.stock_level > 0 ? "font-bold text-emerald-400" : "font-bold text-red-400"}>
                      {selectedItem.stock_level > 0 ? selectedItem.stock_level : "OUT OF STOCK"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-muted border-border"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={selectedItem.stock_level}
                    value={quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) {
                        setQuantity(Math.max(1, Math.min(v, selectedItem.stock_level)));
                      }
                    }}
                    className="h-9 w-20 text-center bg-muted border-border focus:border-primary/50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-muted border-border"
                    onClick={() => setQuantity(q => Math.min(selectedItem.stock_level, q + 1))}
                    disabled={quantity >= selectedItem.stock_level}
                  >
                    +
                  </Button>
                </div>
                
                {quantity > selectedItem.stock_level && selectedItem.stock_level > 0 && (
                  <div className="text-xs text-red-400 mt-1">
                    Insufficient stock. Available quantity: {selectedItem.stock_level}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {selectedItem && (
            <Button
              onClick={handleAdd}
              disabled={
                selectedItem.stock_level <= 0 || 
                quantity > selectedItem.stock_level ||
                quantity < 1 ||
                !Number.isInteger(quantity)
              }
            >
              Add Item
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
