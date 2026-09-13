import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Wrench,
  Clock,
  CheckCircle2,
  IndianRupee,
  Boxes,
  AlertTriangle,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { inr } from "@/lib/format";

export const Route = createFileRoute("/management/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — RK Labs" }] }),
  component: Dashboard,
});

type Stats = {
  todayRepairs: number;
  pending: number;
  delivered: number;
  revenue: number;
  monthRevenue: number;
  inventoryValue: number;
  lowStock: number;
  customers: number;
  dailyRepairs: { day: string; count: number }[];
  monthlySales: { month: string; total: number }[];
};

import { getDashboardStatsFn } from "@/lib/api/dashboard";
import { meFn } from "@/lib/api/auth";

async function fetchStats(): Promise<Stats> {
  const stats = await getDashboardStatsFn();
  return stats;
}

import { cn } from "@/lib/utils";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-5 shadow-lg transition-all hover:bg-secondary hover:border-white/20 hover:-translate-y-0.5 hover:shadow-xl"
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
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</div>
          {sub && <div className="mt-1 text-xs font-medium text-muted-foreground">{sub}</div>}
        </div>
        <div
          className="grid h-9 w-9 place-items-center rounded-xl border border-border/50 bg-white/[0.02]"
          style={{ color: color }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}

function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchStats });
  const { data: me } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { user } = await meFn();
      if (!user) return null;
      return user as {
        approval_status: string;
        requested_role: string | null;
        approved_at: string | null;
        rejection_reason: string | null;
      } | null;
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-1.5 border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time view of your repair operations.</p>
      </header>

      {me && me.approval_status !== "approved" && (
        <div className="rounded-2xl border border-amber-500/30 bg-cardmber-500/10 p-4 text-sm text-amber-200 shadow-lg">
          <div className="font-semibold">
            {me.approval_status === "pending" ? "Pending admin approval" : "Signup not approved"}
          </div>
          <div className="mt-1 text-xs opacity-90">
            {me.approval_status === "pending"
              ? "Your access is limited until an admin reviews your account."
              : (me.rejection_reason ?? "Please contact the shop admin.")}
          </div>
        </div>
      )}
      {me && me.approval_status === "approved" && me.approved_at && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400 shadow-lg">
          <div className="font-semibold">Account approved</div>
          <div className="mt-1 text-xs opacity-90">
            You have full access as {me.requested_role ?? "user"}.
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wrench}
          label="Today's Repairs"
          value={isLoading ? "—" : String(data?.todayRepairs ?? 0)}
          color="#22d3ee"
          delay={0}
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={isLoading ? "—" : String(data?.pending ?? 0)}
          sub="In workflow"
          color="#f59e0b"
          delay={0.05}
        />
        <StatCard
          icon={CheckCircle2}
          label="Delivered"
          value={isLoading ? "—" : String(data?.delivered ?? 0)}
          color="#10b981"
          delay={0.1}
        />
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={isLoading ? "—" : inr(data?.revenue ?? 0)}
          color="#a855f7"
          delay={0.15}
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={isLoading ? "—" : inr(data?.monthRevenue ?? 0)}
          color="#ec4899"
          delay={0.2}
        />
        <StatCard
          icon={Boxes}
          label="Inventory Value"
          value={isLoading ? "—" : inr(data?.inventoryValue ?? 0)}
          color="#3b82f6"
          delay={0.25}
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={isLoading ? "—" : String(data?.lowStock ?? 0)}
          sub="Items below threshold"
          color="#ef4444"
          delay={0.3}
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={isLoading ? "—" : String(data?.customers ?? 0)}
          color="#06b6d4"
          delay={0.35}
        />
      </div>

      <section aria-labelledby="dashboard-charts" className="grid gap-6 lg:grid-cols-2">
        <h2 id="dashboard-charts" className="sr-only">
          Performance charts
        </h2>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-6 shadow-lg"
        >
          <h3 className="mb-6 text-sm font-semibold tracking-tight text-foreground">
            Repairs · Last 7 days
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.dailyRepairs ?? []}>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#f8fafc",
                  }}
                  itemStyle={{ color: "#22d3ee" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  dot={{ fill: "#0f172a", stroke: "#22d3ee", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#22d3ee" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-6 shadow-lg"
        >
          <h3 className="mb-6 text-sm font-semibold tracking-tight text-foreground">
            Monthly Sales · Last 6 months
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlySales ?? []}>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#f8fafc",
                  }}
                  itemStyle={{ color: "#a855f7" }}
                  formatter={(v: any) => inr(Number(v))}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Bar dataKey="total" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
