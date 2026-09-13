import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getRepairsFn } from "@/lib/api/repairs";
import { Wrench, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customer/repairs")({
  component: CustomerRepairs,
});

function CustomerRepairs() {
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

  const sortedRepairs = repairs?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Wrench className="h-8 w-8 text-cyan-500" />
          My Repairs
        </h1>
        <p className="mt-2 text-slate-400">View the complete history of your repair requests.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0f172a]/50 overflow-hidden">
        {sortedRepairs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Wrench className="mx-auto h-12 w-12 text-slate-500/50 mb-3" />
            <p>You don't have any repairs on record.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {sortedRepairs.map((repair) => (
              <div key={repair.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-white/[0.02] transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "rounded-full p-2",
                    repair.status === "in_progress" ? "bg-amber-500/20 text-amber-400" :
                    repair.status === "completed" || repair.status === "delivered" ? "bg-emerald-500/20 text-emerald-400" :
                    repair.status === "cancelled" ? "bg-red-500/20 text-red-400" :
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
                    <div className="text-xs text-slate-500 mt-2 line-clamp-1 max-w-md">
                      Issue: {repair.issue}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 self-end md:self-center">
                  <div className="text-right hidden sm:block mr-4">
                    <div className="text-sm text-slate-300">Requested</div>
                    <div className="text-xs text-slate-500">{new Date(repair.created_at).toLocaleDateString()}</div>
                  </div>
                  <a
                    href={`/track?id=${repair.ticket_no}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 h-9 px-4 py-2 transition-colors"
                  >
                    Track Status
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
