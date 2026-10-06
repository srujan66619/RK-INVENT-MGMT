import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Edit, AlertTriangle, Boxes } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inr } from "@/lib/format";
import {
  getInventoryItemsFn,
  createInventoryItemFn,
  updateInventoryItemFn,
  deleteInventoryItemFn,
} from "@/lib/api/inventory";

export const Route = createFileRoute("/inventory/dashboard")({
  head: () => ({ meta: [{ title: "Inventory — RK Labs" }] }),
  component: InventoryPage,
});

type Item = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  cost_price: number;
  selling_price: number;
  supplier: string | null;
  warranty_months: number | null;
  low_stock_threshold: number;
};

function InventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [reason, setReason] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const data = await getInventoryItemsFn();
      // Rename fields to match frontend expectations if necessary
      return data.map((i) => ({
        ...i,
        quantity: i.stock_level,
        low_stock_threshold: i.min_stock_level ?? 5,
        supplier: null,
        warranty_months: null,
      })) as Item[];
    },
  });

  const filtered = items.filter(
    (i) =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku?.toLowerCase().includes(search.toLowerCase()),
  );
  const lowStock = items.filter((i) => i.quantity <= i.low_stock_threshold);
  const totalValue = items.reduce((s, i) => s + i.quantity * Number(i.cost_price), 0);

  const save = useMutation({
    mutationFn: async (form: Partial<Item>) => {
      const payload = {
        name: form.name!,
        sku: form.sku,
        category: form.category,
        cost_price: form.cost_price ?? 0,
        selling_price: form.selling_price ?? 0,
        stock_level: form.quantity ?? 0,
        min_stock_level: form.low_stock_threshold ?? 5,
      };

      if (editing) {
        await updateInventoryItemFn({ data: { id: editing.id, data: payload, reason: form.reason } });
      } else {
        await createInventoryItemFn({ data: payload });
      }
    },
    onSuccess: () => {
      toast.success("Saved", { description: "Inventory item updated successfully." });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setOpen(false);
      setEditing(null);
      setReason("");
    },
    onError: (e: any) => toast.error("Error", { description: e.message }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await deleteInventoryItemFn({ data: id });
    },
    onSuccess: () => {
      toast.success("Deleted", { description: "Item removed from inventory." });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (e: any) => toast.error("Error", { description: e.message }),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    save.mutate({
      name: String(fd.get("name")),
      sku: String(fd.get("sku") || "") || null,
      category: String(fd.get("category") || "") || null,
      quantity: Number(fd.get("quantity") || 0),
      cost_price: Number(fd.get("cost_price") || 0),
      selling_price: Number(fd.get("selling_price") || 0),
      supplier: String(fd.get("supplier") || "") || null,
      warranty_months: Number(fd.get("warranty_months") || 0),
      low_stock_threshold: Number(fd.get("low_stock_threshold") || 5),
      reason,
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Spare parts, accessories and tools</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setEditing(null);
              setReason("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="h-10 px-5 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" /> Add custom item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto custom-scrollbar shadow-floating border-border">
            <DialogHeader className="border-b border-border pb-4 mb-4">
              <DialogTitle className="text-xl tracking-tight">
                {editing ? "Edit" : "Add new"} inventory item
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground -mt-2 mb-4">
              Enter any product — spare part, accessory, new device or refurbished unit — with your
              own name, SKU, price and stock quantity.
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F
                  label="Name"
                  name="name"
                  defaultValue={editing?.name}
                  required
                  className="bg-muted border-border focus:border-primary/50"
                />
                <F
                  label="SKU"
                  name="sku"
                  defaultValue={editing?.sku ?? ""}
                  className="bg-muted border-border focus:border-primary/50"
                />
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Category</Label>
                  <Input
                    list="category-list"
                    name="category"
                    defaultValue={editing?.category ?? ""}
                    placeholder="Refurbished Laptop / New Mobile / Spare…"
                    className="bg-muted border-border focus:border-primary/50"
                  />
                  <datalist id="category-list">
                    <option value="Spare Part" />
                    <option value="Accessory" />
                    <option value="Tool" />
                    <option value="Mobile Charger" />
                    <option value="Screen Guard" />
                    <option value="Cable" />
                    <option value="Wire" />
                    <option value="Earphones" />
                    <option value="Battery" />
                    <option value="New Mobile" />
                    <option value="New Laptop" />
                    <option value="New Tablet" />
                    <option value="New Smart Watch" />
                    <option value="New Desktop" />
                    <option value="Refurbished Mobile" />
                    <option value="Refurbished Laptop" />
                    <option value="Refurbished Tablet" />
                    <option value="Refurbished Smart Watch" />
                    <option value="Refurbished Desktop" />
                    <option value="Others" />
                  </datalist>
                </div>

                <F
                  label="Supplier"
                  name="supplier"
                  defaultValue={editing?.supplier ?? ""}
                  className="bg-muted border-border focus:border-primary/50"
                />
                <F
                  label="Quantity"
                  name="quantity"
                  type="number"
                  defaultValue={editing?.quantity ?? 0}
                  required
                  className="bg-muted border-border focus:border-primary/50"
                />
                <F
                  label="Low stock threshold"
                  name="low_stock_threshold"
                  type="number"
                  defaultValue={editing?.low_stock_threshold ?? 5}
                  className="bg-muted border-border focus:border-primary/50"
                />
                <F
                  label="Cost price (₹)"
                  name="cost_price"
                  type="number"
                  step="0.01"
                  defaultValue={editing?.cost_price ?? 0}
                  className="bg-muted border-border focus:border-primary/50"
                />
                <F
                  label="Selling price (₹)"
                  name="selling_price"
                  type="number"
                  step="0.01"
                  defaultValue={editing?.selling_price ?? 0}
                  className="bg-muted border-border focus:border-primary/50"
                />
                <F
                  label="Warranty (months)"
                  name="warranty_months"
                  type="number"
                  defaultValue={editing?.warranty_months ?? 0}
                  className="bg-muted border-border focus:border-primary/50"
                />
              </div>
              
              {editing && (
                <div className="space-y-1.5 pt-2">
                  <Label className="text-muted-foreground">Adjustment Reason (Required if changing quantity)</Label>
                  <Input 
                    placeholder="e.g. Damaged screens, stock recount..." 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-muted border-border focus:border-primary/50" 
                  />
                </div>
              )}
              
              <DialogFooter className="pt-4 border-t border-border">
                <Button
                  type="submit"
                  disabled={save.isPending}
                  className="shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Boxes} label="Items" value={String(items.length)} color="#3b82f6" delay={0} />
        <Stat
          icon={AlertTriangle}
          label="Low stock"
          value={String(lowStock.length)}
          tone="warn"
          color="#ef4444"
          delay={0.1}
        />
        <Stat icon={Boxes} label="Inventory value" value={inr(totalValue)} color="#10b981" delay={0.2} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-subtle hover:shadow-elevated transition-shadow duration-300">
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-muted/50 border-border"
          />
        </div>
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                      <div className="h-5 w-5 rounded-full border-2 border-primary border-r-transparent animate-spin" />
                    </motion.div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No items found.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((i, index) => (
                <motion.tr
                  key={i.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.5) }} // Cap stagger at 10 items
                  className="group border-b border-border/50 hover:bg-accent/30 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">{i.name}</TableCell>
                  <TableCell className="text-muted-foreground">{i.sku ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{i.category ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        i.quantity <= i.low_stock_threshold
                          ? "text-red-400 font-bold"
                          : "text-foreground"
                      }
                    >
                      {i.quantity}
                    </span>
                    {i.quantity <= i.low_stock_threshold && (
                      <Badge
                        variant="outline"
                        className="ml-2 border-red-500/40 text-red-400 bg-red-500/10"
                      >
                        Low
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{inr(i.cost_price)}</TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {inr(i.selling_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        aria-label={`Edit ${i.name}`}
                        onClick={() => {
                          setEditing(i);
                          setReason("");
                          setOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                        aria-label={`Delete ${i.name}`}
                        onClick={() => {
                          if (confirm("Delete?")) del.mutate(i.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
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

function Stat({
  icon: Icon,
  label,
  value,
  tone,
  color = "#22d3ee",
  delay = 0,
}: {
  icon: any;
  label: string;
  value: string;
  tone?: "warn";
  color?: string;
  delay?: number;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-subtle transition-all duration-300 hover:bg-accent/20 hover:shadow-elevated hover:-translate-y-1"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          <div
            className={
              "mt-2 text-2xl font-bold tracking-tight " +
              (tone === "warn" ? "text-red-400" : "text-foreground")
            }
          >
            {value}
          </div>
        </div>
        <div
          className="grid h-9 w-9 place-items-center rounded-xl border border-border/50 bg-white/[0.02]"
          style={{ color }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}
