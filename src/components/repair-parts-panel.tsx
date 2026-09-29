import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Loader2, Package, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { inr } from "@/lib/format";
import {
  getRepairPartsFn,
  consumeRepairPartFn,
  reverseRepairPartFn,
} from "@/lib/api/repair-parts";
import { getInventoryItemsFn } from "@/lib/api/inventory";

export function RepairPartsPanel({ repairId }: { repairId: string }) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ["repair-parts", repairId],
    queryFn: async () => {
      const data = await getRepairPartsFn({ data: { repair_id: repairId } });
      return data;
    },
  });

  const reversePart = useMutation({
    mutationFn: async (partId: string) => {
      await reverseRepairPartFn({ data: { part_id: partId } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repair-parts", repairId] });
      qc.invalidateQueries({ queryKey: ["inventory"] }); // Invalidate inventory where visible
      toast.success("Part removed and stock restored");
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to remove part");
    },
  });

  const totalPartsCost = parts.reduce((sum: number, p: any) => sum + p.quantity * p.unit_cost, 0);

  return (
    <div className="glass rounded-xl p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Package className="h-4 w-4" /> Parts Used
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 shadow-sm transition-transform hover:scale-105 active:scale-95"
          style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)", border: "none" }}
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Part
        </Button>
      </div>

      {isLoading ? (
        <div className="py-6 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : parts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/20 bg-secondary/30 p-6 text-center">
          <div className="text-sm text-muted-foreground">
            No inventory parts have been consumed for this repair.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            {parts.map((p: any) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/50 bg-secondary/50 p-3 transition-colors hover:bg-secondary"
              >
                <div>
                  <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                    {p.inventory_item?.name || "Unknown Item"}
                    <Link to={`/inventory/${p.item_id}`} className="text-xs text-primary hover:underline font-normal">
                      [View Item]
                    </Link>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex items-center gap-3">
                    <span>Qty: {p.quantity}</span>
                    <span>Unit Cost: {inr(p.unit_cost)}</span>
                    <span className="font-medium text-foreground">Total: {inr(p.quantity * p.unit_cost)}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 shrink-0 self-end sm:self-auto"
                  onClick={() => {
                    if (confirm("Remove this part from the repair?\n\nThis will return the consumed quantity to inventory.")) {
                      reversePart.mutate(p.id);
                    }
                  }}
                  disabled={reversePart.isPending}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-white/10">
            <span className="text-sm font-medium text-muted-foreground">Parts Cost:</span>
            <span className="text-sm font-bold text-foreground">{inr(totalPartsCost)}</span>
          </div>
        </div>
      )}

      {addOpen && (
        <AddRepairPartDialog
          repairId={repairId}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

function AddRepairPartDialog({
  repairId,
  onClose,
}: {
  repairId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  // Use the existing inventory query
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const data = await getInventoryItemsFn();
      return data;
    },
  });

  const consumePart = useMutation({
    mutationFn: async () => {
      if (!selectedItemId) throw new Error("Please select an item");
      if (quantity < 1 || !Number.isInteger(quantity)) throw new Error("Quantity must be a positive integer");
      
      const item = inventory.find((i: any) => i.id === selectedItemId);
      if (!item) throw new Error("Item not found");
      
      await consumeRepairPartFn({
        data: {
          repair_id: repairId,
          item_id: selectedItemId,
          quantity: quantity,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repair-parts", repairId] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Part added successfully");
      onClose();
    },
    onError: (e: any) => {
      let msg = e.message || "Unable to add the part. Please try again.";
      if (msg.includes("INSUFFICIENT_STOCK") || msg.toLowerCase().includes("insufficient stock")) {
        const item = inventory.find((i: any) => i.id === selectedItemId);
        msg = `Insufficient stock.\n\nOnly ${item?.stock_level ?? 0} units are currently available.`;
      }
      toast.error(msg);
    },
  });

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return inventory.slice(0, 50); // don't show all if empty search
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

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-strong max-w-md border-border">
        <DialogHeader>
          <DialogTitle>Add Part to Repair</DialogTitle>
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
          <Button variant="outline" onClick={onClose} disabled={consumePart.isPending}>
            Cancel
          </Button>
          {selectedItem && (
            <Button
              onClick={() => consumePart.mutate()}
              disabled={
                consumePart.isPending || 
                selectedItem.stock_level <= 0 || 
                quantity > selectedItem.stock_level ||
                quantity < 1 ||
                !Number.isInteger(quantity)
              }
              style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
            >
              {consumePart.isPending ? "Adding..." : "Use Part"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
