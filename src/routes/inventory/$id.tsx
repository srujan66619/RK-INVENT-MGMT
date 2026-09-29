import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, History, Wrench, Package, PackageCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { inr, fmtDateTime } from "@/lib/format";
import { getInventoryItemsFn, getStockMovementsFn } from "@/lib/api/inventory";
import { getRepairPartsFn } from "@/lib/api/repair-parts";

export const Route = createFileRoute("/inventory/$id")({
  head: () => ({ meta: [{ title: "Inventory Item — RK Labs" }] }),
  component: InventoryItemPage,
});

function InventoryItemPage() {
  const { id } = Route.useParams();

  // We reuse existing endpoints and filter in-memory since the data scale is manageable.
  // A production app with millions of rows would need parameterized endpoints.
  
  const { data: items = [], isLoading: loadingItem } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => await getInventoryItemsFn(),
  });
  
  const item = items.find((i: any) => i.id === id);

  const { data: movements = [], isLoading: loadingMovements } = useQuery({
    queryKey: ["stock_movements"],
    queryFn: async () => await getStockMovementsFn(),
  });
  
  const itemMovements = movements
    .filter((m: any) => m.item_id === id)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // To get "Used in Repairs", we can't easily fetch ALL repair parts if the API doesn't support it without repair_id.
  // Wait, getRepairPartsFn might not support fetching by item_id. 
  // Let's create an endpoint for it if it doesn't exist, or just use what we have.
  // I will make a new query specifically for this item's repair parts.
  const { data: repairParts = [], isLoading: loadingRepairs } = useQuery({
    queryKey: ["repair-parts-by-item", id],
    queryFn: async () => {
      // We will create getRepairPartsByItemFn in api/repair-parts.ts
      const { getRepairPartsByItemFn } = await import("@/lib/api/repair-parts");
      return await getRepairPartsByItemFn({ data: { item_id: id } });
    },
  });

  if (loadingItem) {
    return <div className="p-12 text-center text-muted-foreground">Loading item...</div>;
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="p-12 text-center text-muted-foreground">Inventory item not found.</div>
      </div>
    );
  }

  const stockStatus =
    item.stock_level <= 0
      ? { label: "Out of Stock", color: "text-red-400 bg-red-400/10 border-red-400/20" }
      : item.stock_level <= (item.min_stock_level ?? 5)
        ? { label: "Low Stock", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" }
        : { label: "In Stock", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <header className="flex items-center gap-4 border-b border-border pb-6">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Link to="/inventory/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{item.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {item.sku && <span>SKU: {item.sku}</span>}
            {item.category && <span>• {item.category}</span>}
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          
          <div className="rounded-2xl border border-border bg-card/50 p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" /> Item Information
            </h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <div className="text-muted-foreground mb-1 text-xs">Cost Price</div>
                <div className="font-medium text-foreground">{inr(item.cost_price)}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1 text-xs">Selling Price</div>
                <div className="font-medium text-foreground">{inr(item.selling_price)}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1 text-xs">Supplier</div>
                <div className="font-medium text-foreground">{item.supplier || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1 text-xs">Location</div>
                <div className="font-medium text-foreground">{item.location || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1 text-xs">Current Stock</div>
                <div className="font-medium text-foreground text-lg">{item.stock_level}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1 text-xs">Min/Reorder Level</div>
                <div className="font-medium text-foreground">{item.min_stock_level ?? "—"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/50 p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <History className="h-4 w-4" /> Stock History
            </h2>
            
            {loadingMovements ? (
              <div className="text-center text-xs text-muted-foreground py-4">Loading history...</div>
            ) : itemMovements.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8 border border-dashed border-border/50 rounded-lg">
                No stock movements found.
              </div>
            ) : (
              <div className="space-y-4">
                {itemMovements.map((m: any) => {
                  
                  let label = m.movement_type;
                  let isRepair = m.reference_type === "repair";
                  
                  if (m.movement_type === "out" && isRepair) label = "Repair Consumption";
                  else if (m.movement_type === "in" && isRepair) label = "Repair Return";
                  else if (m.movement_type === "in" && m.reference_type === "purchase_order") label = "Purchase";
                  else if (m.movement_type === "in" && m.reference_type === "adjustment_in") label = "Adjustment In";
                  else if (m.movement_type === "out" && m.reference_type === "adjustment_out") label = "Adjustment Out";
                  else if (m.movement_type === "out" && m.reference_type === "damage") label = "Damage";

                  return (
                    <div key={m.id} className="relative pl-6 pb-4 border-l border-border/50 last:pb-0 last:border-transparent">
                      <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-border" />
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">{fmtDateTime(m.created_at)}</div>
                          <div className="text-sm font-medium text-foreground">{label}</div>
                          
                          {isRepair && m.reference && (
                            <Link 
                              to={`/staff/repairs?search=${m.reference}`}
                              className="text-xs text-primary hover:underline mt-1 inline-block"
                            >
                              Repair: {m.reference}
                            </Link>
                          )}
                          {!isRepair && m.reference && (
                            <div className="text-xs text-muted-foreground mt-1">Ref: {m.reference}</div>
                          )}
                          
                          {m.notes && (
                            <div className="text-xs text-muted-foreground mt-1 italic">"{m.notes}"</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-base font-bold ${m.change > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {m.change > 0 ? "+" : ""}{m.change}
                          </div>
                          {m.balance_after !== null && m.balance_after !== undefined && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Stock: {m.balance_after}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card/50 p-6 text-center shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Status</div>
            <Badge variant="outline" className={`px-3 py-1 ${stockStatus.color}`}>
              {stockStatus.label}
            </Badge>
          </div>

          <div className="rounded-2xl border border-border bg-card/50 p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Used In Repairs
            </h2>
            
            {loadingRepairs ? (
              <div className="text-center text-xs text-muted-foreground py-4">Loading repairs...</div>
            ) : repairParts.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-6 border border-dashed border-border/50 rounded-lg">
                Never used in any repairs.
              </div>
            ) : (
              <div className="space-y-3">
                {repairParts.map((rp: any) => (
                  <div key={rp.id} className="rounded-lg bg-secondary/50 p-3 text-sm border border-border/30">
                    <div className="flex justify-between items-start mb-1">
                      <Link 
                        to={`/staff/repairs?search=${rp.repair?.ticket_no}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {rp.repair?.ticket_no || "Unknown Ticket"}
                      </Link>
                      <div className="font-bold text-foreground">Qty: {rp.quantity}</div>
                    </div>
                    {rp.repair?.customer?.name && (
                      <div className="text-xs text-muted-foreground">Customer: {rp.repair.customer.name}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">Date: {fmtDateTime(rp.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dummy Button component if not imported
function Button(props: any) {
  const { asChild, className, variant, size, ...rest } = props;
  const Comp = asChild ? (props.children.type) : "button";
  return <Comp className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${className}`} {...rest} />;
}
