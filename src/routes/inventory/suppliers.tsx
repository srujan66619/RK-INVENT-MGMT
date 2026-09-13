import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Truck, FileText, History, PackageCheck } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtDateTime, inr, inrPrecise } from "@/lib/format";
import {
  getSuppliersFn,
  createSupplierFn,
  updateSupplierFn,
  deleteSupplierFn,
  getPurchaseOrdersFn,
  createPurchaseOrderFn,
  updatePurchaseOrderFn,
  deletePurchaseOrderFn,
  getStockMovementsFn,
  getPurchaseOrderItemsFn,
} from "@/lib/api/inventory";
import { getInventoryItemsFn, updateInventoryItemFn } from "@/lib/api/inventory";

export const Route = createFileRoute("/inventory/suppliers")({
  head: () => ({ meta: [{ title: "Suppliers — RK Labs" }] }),
  component: SuppliersPage,
});

type Supplier = {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  notes: string | null;
};
type Item = { id: string; name: string; quantity: number; cost_price: number };
type PO = {
  id: string;
  po_no: string;
  supplier_id: string | null;
  status: string;
  total: number;
  created_at: string;
  received_at: string | null;
  notes: string | null;
};
type POLine = { description: string; quantity: number; unit_cost: number; item_id?: string | null };
type Movement = {
  id: string;
  item_id: string | null;
  item_name: string;
  change: number;
  balance_after: number | null;
  movement_type: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
};

function SuppliersPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-1.5 border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Suppliers & Stock</h1>
        <p className="text-sm text-muted-foreground">
          Manage suppliers, purchase orders, and full stock history.
        </p>
      </header>
      <Tabs defaultValue="suppliers">
        <TabsList className="bg-card/80 backdrop-blur-xl border border-border p-1 h-auto rounded-lg">
          <TabsTrigger
            value="suppliers"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Truck className="mr-2 h-4 w-4" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger
            value="po"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <FileText className="mr-2 h-4 w-4" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <History className="mr-2 h-4 w-4" />
            Stock History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="suppliers" className="mt-6">
          <SuppliersTab />
        </TabsContent>
        <TabsContent value="po" className="mt-6">
          <PurchaseOrdersTab />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <StockHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SuppliersTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const data = await getSuppliersFn();
      return data as Supplier[];
    },
  });

  const save = useMutation({
    mutationFn: async (form: any) => {
      if (editing) {
        await updateSupplierFn({ data: { id: editing.id, data: form } });
      } else {
        await createSupplierFn({ data: form });
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await deleteSupplierFn({ data: id });
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    save.mutate({
      name: String(fd.get("name")),
      contact_person: String(fd.get("contact_person") || "") || null,
      phone: String(fd.get("phone") || "") || null,
      email: String(fd.get("email") || "") || null,
      address: String(fd.get("address") || "") || null,
      gst_number: String(fd.get("gst_number") || "") || null,
      notes: String(fd.get("notes") || "") || null,
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-4 shadow-lg">
      <div className="mb-4 flex justify-end">
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="h-10 px-5 shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto custom-scrollbar border-border shadow-2xl">
            <DialogHeader className="border-b border-border pb-4 mb-4">
              <DialogTitle className="text-xl tracking-tight">
                {editing ? "Edit" : "Add"} supplier
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F
                  label="Supplier name"
                  name="name"
                  defaultValue={editing?.name ?? ""}
                  required
                  className="bg-muted border-border focus:border-primary/50"
                />
                <F
                  label="Contact person"
                  name="contact_person"
                  defaultValue={editing?.contact_person ?? ""}
                  className="bg-muted border-border focus:border-primary/50"
                />
                <F
                  label="Phone"
                  name="phone"
                  defaultValue={editing?.phone ?? ""}
                  className="bg-muted border-border focus:border-primary/50"
                />
                <F
                  label="Email"
                  name="email"
                  type="email"
                  defaultValue={editing?.email ?? ""}
                  className="bg-muted border-border focus:border-primary/50"
                />
                <F
                  label="GSTIN"
                  name="gst_number"
                  defaultValue={editing?.gst_number ?? ""}
                  className="bg-muted border-border focus:border-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Address</Label>
                <Textarea
                  name="address"
                  rows={2}
                  defaultValue={editing?.address ?? ""}
                  className="bg-muted border-border focus:border-primary/50 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Notes</Label>
                <Textarea
                  name="notes"
                  rows={2}
                  defaultValue={editing?.notes ?? ""}
                  className="bg-muted border-border focus:border-primary/50 resize-none"
                />
              </div>
              <DialogFooter className="pt-4 border-t border-border">
                <Button
                  type="submit"
                  disabled={save.isPending}
                  className="shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
                >
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-card/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left rounded-tl-lg">Supplier</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">GSTIN</th>
              <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && suppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No suppliers yet.
                </td>
              </tr>
            )}
            {suppliers.map((s) => (
              <tr
                key={s.id}
                className="group border-b border-border/50 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.contact_person ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.phone ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {s.gst_number ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => {
                        setEditing(s);
                        setOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => {
                        if (confirm("Delete?")) del.mutate(s.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PurchaseOrdersTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<POLine[]>([{ description: "", quantity: 1, unit_cost: 0 }]);

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ["purchase_orders"],
    queryFn: async () => {
      const data = await getPurchaseOrdersFn();
      return data as PO[];
    },
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-min"],
    queryFn: async () => (await getSuppliersFn()) as Pick<Supplier, "id" | "name">[],
  });
  const { data: items = [] } = useQuery({
    queryKey: ["inventory-min"],
    queryFn: async () => (await getInventoryItemsFn()) as any[],
  });

  const total = lines.reduce((s, l) => s + l.quantity * l.unit_cost, 0);

  const create = useMutation({
    mutationFn: async () => {
      const cleaned = lines.filter((l) => l.description && l.quantity > 0);
      if (cleaned.length === 0) throw new Error("Add at least one item");

      const payload = {
        supplier_id: supplierId || null,
        total,
        notes: notes || null,
        lines: cleaned.map((l) => ({
          item_id: l.item_id || null,
          quantity: l.quantity,
          unit_cost: l.unit_cost,
        })),
      };

      await createPurchaseOrderFn({ data: payload });
    },
    onSuccess: () => {
      toast.success("Purchase order created");
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      setOpen(false);
      setLines([{ description: "", quantity: 1, unit_cost: 0 }]);
      setSupplierId("");
      setNotes("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const receive = useMutation({
    mutationFn: async (po: PO) => {
      if (po.status === "received") throw new Error("Already received");

      const poItems = await getPurchaseOrderItemsFn({ data: { po_id: po.id } });

      for (const li of poItems ?? []) {
        if (li.item_id) {
          const it = items.find((i) => i.id === li.item_id);
          if (it) {
            await updateInventoryItemFn({
              data: {
                id: li.item_id,
                data: {
                  stock_level: it.stock_level + li.quantity,
                  cost_price: li.unit_cost || it.cost_price,
                },
              },
            });
          }
        }
      }

      await updatePurchaseOrderFn({
        data: { id: po.id, data: { status: "received", received_at: new Date().toISOString() } },
      });
    },
    onSuccess: () => {
      toast.success("Stock received");
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory-min"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-4 shadow-lg">
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="h-10 px-5 shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
            >
              <Plus className="mr-2 h-4 w-4" /> New PO
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong max-h-[90vh] max-w-3xl overflow-y-auto custom-scrollbar border-border shadow-2xl">
            <DialogHeader className="border-b border-border pb-4 mb-4">
              <DialogTitle className="text-xl tracking-tight">New purchase order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Supplier</Label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm focus:border-primary/50 outline-none"
                >
                  <option value="" className="bg-card">
                    — Select supplier —
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id} className="bg-card">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Line items</Label>
                {lines.map((l, idx) => (
                  <div key={idx} className="grid grid-cols-[1.5fr_1fr_70px_110px_40px] gap-2">
                    <Input
                      placeholder="Description"
                      value={l.description}
                      onChange={(e) =>
                        setLines(
                          lines.map((x, i) =>
                            i === idx ? { ...x, description: e.target.value } : x,
                          ),
                        )
                      }
                      className="bg-muted border-border focus:border-primary/50"
                    />
                    <select
                      className="h-10 rounded-md border border-border bg-muted px-2 text-xs focus:border-primary/50 outline-none"
                      value={l.item_id ?? ""}
                      onChange={(e) => {
                        const it = items.find((x) => x.id === e.target.value);
                        setLines(
                          lines.map((x, i) =>
                            i === idx
                              ? {
                                  ...x,
                                  item_id: e.target.value || null,
                                  description: x.description || it?.name || "",
                                  unit_cost: x.unit_cost || Number(it?.cost_price ?? 0),
                                }
                              : x,
                          ),
                        );
                      }}
                    >
                      <option value="" className="bg-card">
                        — Link inventory —
                      </option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id} className="bg-card">
                          {it.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min={1}
                      value={l.quantity}
                      onChange={(e) =>
                        setLines(
                          lines.map((x, i) =>
                            i === idx ? { ...x, quantity: Number(e.target.value) } : x,
                          ),
                        )
                      }
                      className="bg-muted border-border focus:border-primary/50"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Unit ₹"
                      value={l.unit_cost}
                      onChange={(e) =>
                        setLines(
                          lines.map((x, i) =>
                            i === idx ? { ...x, unit_cost: Number(e.target.value) } : x,
                          ),
                        )
                      }
                      className="bg-muted border-border focus:border-primary/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 border-border bg-secondary hover:bg-cardccent"
                  onClick={() =>
                    setLines([...lines, { description: "", quantity: 1, unit_cost: 0 }])
                  }
                >
                  <Plus className="mr-1 h-4 w-4" /> Add line
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="bg-muted border-border focus:border-primary/50 resize-none"
                />
              </div>
              <div className="text-right text-xl font-bold text-foreground pt-4">
                Total: <span className="text-primary">{inrPrecise(total)}</span>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-border">
              <Button
                onClick={() => create.mutate()}
                disabled={create.isPending}
                className="shadow-lg transition-transform hover:scale-105 active:scale-95"
                style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
              >
                Create PO
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-card/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left rounded-tl-lg">PO #</th>
              <th className="px-4 py-3 text-left">Supplier</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && pos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No purchase orders yet.
                </td>
              </tr>
            )}
            {pos.map((p) => (
              <tr
                key={p.id}
                className="group border-b border-border/50 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                  {p.po_no}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {p.supplier_id ? (supplierMap.get(p.supplier_id) ?? "—") : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDateTime(p.created_at)}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{inr(p.total)}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      p.status === "received"
                        ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                        : "border-amber-500/40 text-amber-400 bg-cardmber-500/10"
                    }
                  >
                    {p.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {p.status !== "received" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => receive.mutate(p)}
                    >
                      <PackageCheck className="mr-2 h-4 w-4" />
                      Mark received
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockHistoryTab() {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stock_movements"],
    queryFn: async () => {
      const data = await getStockMovementsFn();
      return data as Movement[];
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-4 shadow-lg">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-card/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left rounded-tl-lg">When</th>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Change</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-left rounded-tr-lg">Notes</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && movements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No movements yet.
                </td>
              </tr>
            )}
            {movements.map((m) => (
              <tr
                key={m.id}
                className="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-3 text-muted-foreground">{fmtDateTime(m.created_at)}</td>
                <td className="px-4 py-3 font-medium text-foreground">{m.item_name}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className="border-white/20 text-[11px] text-muted-foreground bg-secondary"
                  >
                    {m.movement_type}
                  </Badge>
                </td>
                <td
                  className={
                    "px-4 py-3 text-right font-semibold " +
                    (m.change > 0 ? "text-emerald-400" : "text-red-400")
                  }
                >
                  {m.change > 0 ? "+" : ""}
                  {m.change}
                </td>
                <td className="px-4 py-3 text-right font-medium text-foreground">
                  {m.balance_after ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{m.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function F({
  label,
  className,
  ...props
}: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground">{label}</Label>
      <Input className={className} {...props} />
    </div>
  );
}
