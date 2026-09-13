import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getRepairsFn } from "@/lib/api/repairs";
import { Wrench, Calendar, Clock, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customer/dashboard")({
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const { data: repairs, isLoading } = useQuery({
    queryKey: ["repairs"],
    queryFn: () => getRepairsFn(),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const activeRepairs = repairs?.filter((r) => r.status !== "delivered" && r.status !== "cancelled") || [];
  const completedRepairs = repairs?.filter((r) => r.status === "delivered") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h1>
        <p className="mt-2 text-slate-400">Here's the status of your recent repair requests.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0f172a]/50 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-cyan-500/20 p-3 text-cyan-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{activeRepairs.length}</div>
              <div className="text-sm text-slate-400">Active Repairs</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0f172a]/50 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-500/20 p-3 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{completedRepairs.length}</div>
              <div className="text-sm text-slate-400">Completed</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-6 flex flex-col justify-center items-start">
          <div className="text-lg font-medium text-white mb-2">Need a new repair?</div>
          <Link
            to="/customer/book"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50 bg-cyan-500 text-black shadow hover:bg-cyan-500/90 h-9 px-4 py-2"
          >
            <Calendar className="mr-2 h-4 w-4" /> Book Appointment
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0f172a]/50 overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Active Repairs</h2>
        </div>
        
        {activeRepairs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Wrench className="mx-auto h-12 w-12 text-slate-500/50 mb-3" />
            <p>You don't have any active repairs at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {activeRepairs.map((repair) => (
              <div key={repair.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "rounded-full p-2",
                    repair.status === "in_progress" ? "bg-amber-500/20 text-amber-400" :
                    repair.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                    "bg-blue-500/20 text-blue-400"
                  )}>
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{repair.device_brand} {repair.device_model}</div>
                    <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300">
                        {repair.ticket_no}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{repair.status.replace("_", " ")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {repair.estimated_completion && (
                    <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 bg-white/5 px-3 py-1.5 rounded-md">
                      <Clock className="h-4 w-4" />
                      {new Date(repair.estimated_completion).toLocaleDateString()}
                    </div>
                  )}
                  <a
                    href={`/track?id=${repair.ticket_no}`}
                    className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
