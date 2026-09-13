import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getRepairsFn } from "@/lib/api/repairs";
import { Wrench, CheckCircle2, ChevronRight, Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/technician/dashboard")({
  component: TechnicianDashboard,
});

function TechnicianDashboard() {
  const { data: repairs, isLoading } = useQuery({
    queryKey: ["repairs"],
    queryFn: () => getRepairsFn(),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const assignedJobs = repairs?.filter((r) => r.status !== "delivered" && r.status !== "cancelled") || [];
  const activeJobs = assignedJobs.filter((r) => r.status === "in_progress" || r.status === "diagnosis");
  const completedJobs = repairs?.filter((r) => r.status === "ready_delivery" || r.status === "completed") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Technician Workspace</h1>
        <p className="mt-2 text-muted-foreground">Manage your assigned repairs and track progress.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card/50 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-cardmber-500/20 p-3 text-amber-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{activeJobs.length}</div>
              <div className="text-sm text-muted-foreground">Currently Working On</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/20 p-3 text-primary">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{assignedJobs.length}</div>
              <div className="text-sm text-muted-foreground">Total Pending Jobs</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-500/20 p-3 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{completedJobs.length}</div>
              <div className="text-sm text-muted-foreground">Jobs Completed</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Your Pending Jobs</h2>
          <Link to="/technician/jobs" className="text-sm text-primary hover:underline">
            View All Jobs
          </Link>
        </div>
        
        {assignedJobs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p>You have no pending jobs. Great work!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {assignedJobs.map((repair) => (
              <div key={repair.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "rounded-full p-2",
                    repair.status === "in_progress" ? "bg-cardmber-500/20 text-amber-400" :
                    repair.status === "diagnosis" ? "bg-purple-500/20 text-purple-400" :
                    repair.status === "waiting_parts" ? "bg-orange-500/20 text-orange-400" :
                    "bg-blue-500/20 text-blue-400"
                  )}>
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{repair.device_brand} {repair.device_model}</div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-muted-foreground">
                        {repair.ticket_no}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{repair.status.replace("_", " ")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {repair.estimated_completion && (
                    <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-md">
                      <Clock className="h-4 w-4" />
                      Due {new Date(repair.estimated_completion).toLocaleDateString()}
                    </div>
                  )}
                  <Link
                    to="/technician/jobs"
                    className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-cardccent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
