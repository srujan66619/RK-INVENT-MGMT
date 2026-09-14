"use server";
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "../auth.server";

export const getDashboardStatsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAuth();

  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startMonth = new Date();
  startMonth.setDate(1);
  startMonth.setHours(0, 0, 0, 0);

  const { repairService } = await import("@/services/repair.service");
  const { invoiceService } = await import("@/services/invoice.service");
  const { inventoryService } = await import("@/services/inventory.service");
  const { customerService } = await import("@/services/customer.service");

  const reps = await repairService.getRepairs();
  const invs = await invoiceService.getInvoices();
  const its = await inventoryService.getInventoryItems();
  const custs = await customerService.getCustomers();

  const todayRepairs = reps.filter((r) => r.created_at && new Date(r.created_at) >= startToday).length;
  const pending = reps.filter((r) => !["delivered", "cancelled"].includes(r.status)).length;
  const delivered = reps.filter((r) => r.status === "delivered").length;

  const revenue = invs
    .filter((i) => i.payment_status === "paid")
    .reduce((s, i) => s + Number(i.total), 0);
  const monthRevenue = invs
    .filter((i) => i.created_at && new Date(i.created_at) >= startMonth && i.payment_status === "paid")
    .reduce((s, i) => s + Number(i.total), 0);

  const inventoryValue = its.reduce(
    (s, i) => s + (Number(i.cost_price) || 0) * (Number(i.quantity) || 0),
    0,
  );
  const lowStock = its.filter(
    (i) => (Number(i.quantity) || 0) <= (Number(i.min_stock_level) || 5),
  ).length;

  // Last 7 days
  const dailyRepairs = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = reps.filter((r) => {
      if (!r.created_at) return false;
      const t = new Date(r.created_at);
      return t >= d && t < next;
    }).length;
    return { day: d.toLocaleDateString("en-IN", { weekday: "short" }), count };
  });

  // Last 6 months
  const monthlySales = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - (5 - idx));
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    const total = invs
      .filter((i) => {
        if (!i.created_at) return false;
        const t = new Date(i.created_at);
        return t >= d && t < next;
      })
      .reduce((s, i) => s + Number(i.total), 0);
    return { month: d.toLocaleDateString("en-IN", { month: "short" }), total };
  });

  return {
    todayRepairs,
    pending,
    delivered,
    revenue,
    monthRevenue,
    inventoryValue,
    lowStock,
    customers: custs.length,
    dailyRepairs,
    monthlySales,
  };
});
