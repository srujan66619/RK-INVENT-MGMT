import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserCheck, UserX, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fmtDateTime } from "@/lib/format";
import { meFn } from "@/lib/api/auth";
import { getApprovalsFn, decideApprovalFn, changeRoleFn } from "@/lib/api/approvals";

export const Route = createFileRoute("/manager/approvals")({
  head: () => ({ meta: [{ title: "Approvals — RK Labs" }] }),
  component: ApprovalsPage,
});

type Profile = {
  id: string;
  full_name: string | null;
  requested_role: "customer" | "employee" | null;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
};

const ROLE_OPTIONS = ["customer", "employee", "staff", "technician", "admin"] as const;
type AppRole = (typeof ROLE_OPTIONS)[number];

function ApprovalsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const { user } = await meFn();
        setIsAdmin(user?.role === "admin");
      } catch (e) {
        setIsAdmin(false);
      }
    })();
  }, []);

  if (isAdmin === null) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> Loading…
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 text-center shadow-lg">
        <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-primary" />
        <div className="text-xl font-bold tracking-tight text-foreground">Admins only</div>
        <p className="mt-2 text-sm text-muted-foreground">
          You need the admin role to review account approvals.
        </p>
      </div>
    );
  }
  return <ApprovalsInner />;
}

function ApprovalsInner() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      return (await getApprovalsFn()) as Profile[];
    },
  });

  const decide = useMutation({
    mutationFn: async (args: {
      id: string;
      decision: "approved" | "rejected";
      role?: AppRole;
      reason?: string;
      name?: string | null;
    }) => {
      await decideApprovalFn({
        data: {
          id: args.id,
          decision: args.decision,
          role: args.role,
          reason: args.reason,
        },
      });
    },
    onSuccess: (_r, args) => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      toast.success(args.decision === "approved" ? "User approved" : "User rejected");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update"),
  });

  const changeRole = useMutation({
    mutationFn: async (args: { id: string; role: AppRole; name: string | null }) => {
      await changeRoleFn({ data: { id: args.id, role: args.role } });
    },
    onSuccess: (_r, args) => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      toast.success(`Role updated to ${args.role}`);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update role"),
  });

  const rolesMap = useMemo(() => {
    const map: Record<string, AppRole[]> = {};
    (q.data ?? []).forEach((r: any) => {
      if (r.role) {
        map[r.id] = [r.role];
      }
    });
    return map;
  }, [q.data]);

  const rows = q.data ?? [];
  const pending = rows.filter((r) => r.approval_status === "pending");
  const approved = rows.filter((r) => r.approval_status === "approved");
  const rejected = rows.filter((r) => r.approval_status === "rejected");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl space-y-6"
    >
      <div className="flex flex-col gap-1.5 border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Account approvals</h1>
        <p className="text-sm text-muted-foreground">
          Review new signups and assign a role before granting access.
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-card/80 backdrop-blur-xl border border-border p-1 h-auto rounded-lg">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Approved ({approved.length})
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Rejected ({rejected.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <List
            rows={pending}
            kind="pending"
            decide={decide.mutate}
            busy={decide.isPending}
            rolesMap={rolesMap}
            onChangeRole={changeRole.mutate}
            changing={changeRole.isPending}
          />
        </TabsContent>
        <TabsContent value="approved">
          <List
            rows={approved}
            kind="approved"
            decide={decide.mutate}
            busy={decide.isPending}
            rolesMap={rolesMap}
            onChangeRole={changeRole.mutate}
            changing={changeRole.isPending}
          />
        </TabsContent>
        <TabsContent value="rejected">
          <List
            rows={rejected}
            kind="rejected"
            decide={decide.mutate}
            busy={decide.isPending}
            rolesMap={rolesMap}
            onChangeRole={changeRole.mutate}
            changing={changeRole.isPending}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

type ListProps = {
  rows: Profile[];
  kind: "pending" | "approved" | "rejected";
  decide: (args: {
    id: string;
    decision: "approved" | "rejected";
    role?: AppRole;
    reason?: string;
    name?: string | null;
  }) => void;
  busy: boolean;
  rolesMap: Record<string, AppRole[]>;
  onChangeRole: (args: { id: string; role: AppRole; name: string | null }) => void;
  changing: boolean;
};

function List({ rows, kind, decide, busy, rolesMap, onChangeRole, changing }: ListProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-10 text-center shadow-lg text-sm text-muted-foreground">
        Nothing here.
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      {rows.map((r) => (
        <Row
          key={r.id}
          row={r}
          kind={kind}
          decide={decide}
          busy={busy}
          currentRoles={rolesMap[r.id] ?? []}
          onChangeRole={onChangeRole}
          changing={changing}
        />
      ))}
    </div>
  );
}

function Row({
  row,
  kind,
  decide,
  busy,
  currentRoles,
  onChangeRole,
  changing,
}: {
  row: Profile;
  kind: "pending" | "approved" | "rejected";
  decide: (args: {
    id: string;
    decision: "approved" | "rejected";
    role?: AppRole;
    reason?: string;
    name?: string | null;
  }) => void;
  busy: boolean;
  currentRoles: AppRole[];
  onChangeRole: (args: { id: string; role: AppRole; name: string | null }) => void;
  changing: boolean;
}) {
  const [role, setRole] = useState<AppRole>((row.requested_role as AppRole) ?? "customer");
  const [editRole, setEditRole] = useState<AppRole>(
    currentRoles[0] ?? (row.requested_role as AppRole) ?? "customer",
  );
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 transition-all hover:bg-white/[0.02]">
      <div className="flex flex-wrap items-center gap-3 justify-between mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-foreground">{row.full_name ?? "Unnamed user"}</span>
          {row.requested_role && (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs capitalize text-primary">
              requested: {row.requested_role}
            </span>
          )}
          {kind === "approved" && currentRoles.length > 0 && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs capitalize text-emerald-400">
              current: {currentRoles.join(", ")}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Signed up {fmtDateTime(row.created_at)}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted p-3 rounded-lg border border-border/50">
        {kind === "pending" ? (
          <>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Assign role
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AppRole)}
                className="h-9 rounded-md border border-border bg-card px-3 text-sm focus:border-primary/50 outline-none text-foreground"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r} className="bg-card">
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  decide({ id: row.id, decision: "approved", role, name: row.full_name })
                }
                className="shadow-lg transition-transform hover:scale-105 active:scale-95"
                style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
              >
                <UserCheck className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                onClick={() => {
                  const reason = prompt("Reason for rejection (optional):") ?? undefined;
                  decide({ id: row.id, decision: "rejected", reason, name: row.full_name });
                }}
              >
                <UserX className="mr-2 h-4 w-4" /> Reject
              </Button>
            </div>
          </>
        ) : kind === "approved" ? (
          <>
            <div className="text-sm font-medium text-muted-foreground">
              Approved {row.approved_at ? fmtDateTime(row.approved_at) : "—"}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Change role
              </span>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as AppRole)}
                className="h-9 rounded-md border border-border bg-card px-3 text-sm focus:border-primary/50 outline-none text-foreground"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r} className="bg-card">
                    {r}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                className="border-border hover:bg-cardccent text-muted-foreground"
                disabled={changing || (currentRoles.length === 1 && currentRoles[0] === editRole)}
                onClick={() => onChangeRole({ id: row.id, role: editRole, name: row.full_name })}
              >
                Update
              </Button>
            </div>
          </>
        ) : (
          <div className="text-sm font-medium text-muted-foreground">
            <span className="text-red-400 font-semibold">Rejected</span>
            {row.rejection_reason ? (
              <span className="ml-2 text-muted-foreground">· {row.rejection_reason}</span>
            ) : (
              ""
            )}
          </div>
        )}
      </div>
    </div>
  );
}
