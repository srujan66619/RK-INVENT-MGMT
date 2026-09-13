import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wrench, Check, Clock, Search, MessageSquare, ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getRepairsFn,
  updateRepairFn,
  createRepairNoteFn,
} from "@/lib/api/repairs";

export const Route = createFileRoute("/technician/jobs")({
  component: TechnicianJobsPage,
});

const STATUSES = [
  { v: "diagnosis", label: "Diagnosis" },
  { v: "waiting_parts", label: "Waiting Parts" },
  { v: "in_progress", label: "In Progress" },
  { v: "ready_delivery", label: "Ready for Delivery" },
  { v: "completed", label: "Completed" },
] as const;

function TechnicianJobsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [newNote, setNewNote] = useState("");
  const [status, setStatus] = useState("");

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ["repairs"],
    queryFn: async () => await getRepairsFn(),
    refetchInterval: 5000,
  });

  const filtered = repairs.filter((r: any) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.ticket_no.toLowerCase().includes(q) ||
      r.device_brand?.toLowerCase().includes(q) ||
      r.device_model?.toLowerCase().includes(q) ||
      r.issue.toLowerCase().includes(q)
    );
  });

  const updateJob = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      await updateRepairFn({
        data: {
          id: editing.id,
          data: { status },
        },
      });

      if (newNote.trim()) {
        await createRepairNoteFn({
          data: {
            repair_id: editing.id,
            note: newNote,
          },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repairs"] });
      toast.success("Job updated successfully");
      setEditing(null);
      setNewNote("");
    },
    onError: (e: any) => toast.error(`Failed to update: ${e.message}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            My Assigned Jobs
          </h1>
          <p className="mt-2 text-muted-foreground">View and update your active repairs.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets or devices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted border-border focus:border-primary/50"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground border border-border rounded-xl bg-card/50">
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p>No jobs found matching your search.</p>
          </div>
        ) : (
          filtered.map((repair: any) => (
            <div key={repair.id} className="rounded-xl border border-border bg-card/50 p-6 flex flex-col hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-sm px-2 py-1 rounded bg-white/10 text-muted-foreground">
                  {repair.ticket_no}
                </span>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full border font-medium capitalize",
                  repair.status === "in_progress" ? "bg-cardmber-500/10 text-amber-400 border-amber-500/20" :
                  repair.status === "diagnosis" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                  repair.status === "ready_delivery" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  "bg-blue-500/10 text-blue-400 border-blue-500/20"
                )}>
                  {repair.status.replace("_", " ")}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {repair.device_brand} {repair.device_model}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                {repair.issue}
              </p>
              <div className="border-t border-border pt-4 mt-auto">
                <Button 
                  className="w-full bg-secondary hover:bg-cardccent text-white" 
                  variant="outline"
                  onClick={() => {
                    setEditing(repair);
                    setStatus(repair.status);
                    setNewNote("");
                  }}
                >
                  Update Status
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="glass-strong border-border">
          <DialogHeader>
            <DialogTitle>Update Job: {editing?.ticket_no}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label>Current Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm focus:border-primary/50 outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s.v} value={s.v} className="bg-card">{s.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>Add Note for Shop/Customer</Label>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Needs new display assembly, awaiting approval..."
                  className="bg-muted border-border min-h-[100px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={() => updateJob.mutate()} disabled={updateJob.isPending}>
                  {updateJob.isPending ? "Saving..." : "Save Updates"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
