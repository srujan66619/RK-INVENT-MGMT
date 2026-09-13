import { useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";

import {
  Search,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  CalendarPlus,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackRepair } from "@/lib/tracking.functions";
import { fmtDate, fmtDateTime, inr } from "@/lib/format";
import { googleCalendarUrl, downloadIcs, type CalEvent } from "@/lib/calendar";

export const Route = createFileRoute("/_public/track")({
  head: () => ({
    meta: [
      { title: "Track Your Repair — RK Repair Labs" },
      {
        name: "description",
        content:
          "Enter your ticket ID (e.g. RK-1001) to see the live status, technician notes and appointment for your device repair at RK Repair Labs.",
      },
      { property: "og:title", content: "Track Your Repair — RK Repair Labs" },
      {
        property: "og:description",
        content:
          "Real-time repair status lookup — see workflow progress, technician assignment and appointment details by ticket ID.",
      },
      { property: "og:url", content: "https://rklabs.syncailabs.in/track" },
    ],
    links: [{ rel: "canonical", href: "https://rklabs.syncailabs.in/track" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ 
    id: typeof s.id === "string" ? s.id : (typeof s.ticket === "string" ? s.ticket : "") 
  }),
  component: TrackPage,
});

type TrackResult = Awaited<ReturnType<typeof trackRepair>>;

const STEPS = [
  "received",
  "diagnosed",
  "in_progress",
  "completed",
  "ready_delivery",
  "delivered",
] as const;
const STEP_LABEL: Record<string, string> = {
  received: "Received",
  diagnosed: "Diagnosed",
  in_progress: "In Progress",
  completed: "Completed",
  ready_delivery: "Ready for delivery",
  delivered: "Delivered",
};

function TrackPage() {
  const { id } = useSearch({ from: "/_public/track" });
  const navigate = useNavigate({ from: "/_public/track" });
  const [ticket, setTicket] = useState(id);
  const [result, setResult] = useState<TrackResult | null>(null);

  const [errorMsg, setErrorMsg] = useState("");

  const lookup = useMutation({
    mutationFn: (t: string) => trackRepair({ data: { ticket: t } }),
    onSuccess: (r) => setResult(r),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = ticket.trim();
    if (!t) {
      setErrorMsg("Please enter a tracking ID.");
      return;
    }
    setErrorMsg("");
    // Explicitly navigate to /track to prevent any relative pathless layout bugs
    navigate({ to: "/track", search: { id: t }, replace: true });
    lookup.mutate(t);
  }

  // Auto-lookup on first load if ?id= present
  if (id && !result && !lookup.isPending && !lookup.isError && lookup.status === "idle") {
    lookup.mutate(id);
  }

  return (
    <div className="w-full pb-20">
      <main className="container mx-auto max-w-3xl px-6 pt-16 md:pt-24 pb-16">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Track your repair</h1>
          <p className="mt-3 text-muted-foreground">
            Enter your ticket ID (e.g. <span className="font-mono text-foreground">RK-1001</span>)
            to see live status.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="glass mt-8 flex gap-2 rounded-2xl border border-white/10 p-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              placeholder="RK-1001"
              className="pl-9 font-mono uppercase"
            />
          </div>
          <Button
            type="submit"
            disabled={lookup.isPending}
            style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
          >
            {lookup.isPending ? "Searching…" : "Track Repair"}
          </Button>
        </form>

        {errorMsg && (
          <div className="mt-2 text-sm text-destructive text-left px-2">
            {errorMsg}
          </div>
        )}

        {lookup.isError && (
          <div className="glass mt-6 rounded-2xl border border-destructive/30 p-4 text-sm text-destructive">
            Could not look up that ticket. Please try again later.
          </div>
        )}

        {result && !result.found && (
          <div className="glass mt-6 rounded-2xl border border-white/10 p-6 text-center text-muted-foreground">
            Tracking ID not found. Please check the ID and try again.
          </div>
        )}

        {result && result.found && <ResultView data={result} />}
      </main>
    </div>
  );
}

function ResultView({ data }: { data: Extract<TrackResult, { found: true }> }) {
  const { repair, customer, notes } = data;
  const currentIdx = STEPS.indexOf(repair.status as (typeof STEPS)[number]);

  return (
    <div className="mt-6 space-y-4">
      <div className="glass rounded-2xl border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Ticket</div>
            <div className="text-2xl font-bold font-mono">{repair.ticket_no}</div>
          </div>
          <div className="rounded-full border border-[var(--neon)]/40 bg-[var(--neon)]/10 px-4 py-1.5 text-sm font-semibold text-[var(--neon)]">
            {STEP_LABEL[repair.status] ?? repair.status}
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
            Workflow
          </div>
          <ol className="space-y-2">
            {STEPS.map((s, i) => {
              const done = currentIdx >= 0 && i <= currentIdx;
              return (
                <li key={s} className="flex items-center gap-3 text-sm">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-[var(--neon)]" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={done ? "" : "text-muted-foreground"}>{STEP_LABEL[s]}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {customer && (
        <div className="glass rounded-2xl border border-white/10 p-6">
          <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
            Customer
          </div>
          <div className="text-lg font-semibold">{customer.name}</div>
          <div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            {customer.phone && (
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {customer.phone}
              </span>
            )}
            {customer.whatsapp && (
              <a
                href={`https://wa.me/${customer.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[var(--neon)] hover:underline"
              >
                <WhatsAppIcon className="h-4 w-4" /> {customer.whatsapp}
              </a>
            )}
            {customer.email && (
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {customer.email}
              </span>
            )}
            {customer.address && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {customer.address}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl border border-white/10 p-6">
        <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
          Device & Issue
        </div>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <Info label="Type" value={repair.device_type ?? "—"} />
          <Info label="Brand" value={repair.device_brand ?? "—"} />
          <Info label="Model" value={repair.device_model ?? "—"} />
          <Info label="IMEI / Serial" value={repair.imei ?? "—"} />
          <Info label="Technician" value={repair.technician_name ?? "Not assigned"} />
          <Info
            label="ETA"
            value={repair.estimated_completion ? fmtDate(repair.estimated_completion) : "—"}
          />
          <Info
            label="Estimated cost"
            value={repair.estimated_cost != null ? inr(repair.estimated_cost) : "—"}
          />
          <Info
            label="Final cost"
            value={repair.final_cost != null ? inr(repair.final_cost) : "—"}
          />
        </div>
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Reported issue
          </div>
          <p className="mt-1 text-sm">{repair.issue}</p>
        </div>
      </div>

      {repair.appointment_at && <AppointmentCard repair={repair} />}

      <div className="glass rounded-2xl border border-white/10 p-6">
        <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Timeline</div>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>Created — {fmtDate(repair.created_at)}</li>
          {repair.appointment_at && (
            <li className="text-[var(--neon)]">
              Appointment scheduled — {fmtDateTime(repair.appointment_at)}
            </li>
          )}
          {repair.assigned_at && <li>Assigned — {fmtDate(repair.assigned_at)}</li>}
          {repair.completed_at && <li>Completed — {fmtDate(repair.completed_at)}</li>}
          {repair.delivered_at && <li>Delivered — {fmtDate(repair.delivered_at)}</li>}
        </ul>
      </div>

      {notes.length > 0 && (
        <div className="glass rounded-2xl border border-white/10 p-6">
          <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
            Technician notes
          </div>
          <ul className="space-y-2 text-sm">
            {notes.map((n) => (
              <li key={n.id} className="flex items-start gap-2">
                {n.task_done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--neon)]" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <div className={n.task_done ? "line-through text-muted-foreground" : ""}>
                    {n.note}
                  </div>
                  {n.technician_name && (
                    <div className="text-xs text-muted-foreground">— {n.technician_name}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function AppointmentCard({ repair }: { repair: Extract<TrackResult, { found: true }>["repair"] }) {
  const start = new Date(repair.appointment_at!);
  const device =
    [repair.device_brand, repair.device_model].filter(Boolean).join(" ") ||
    repair.device_type ||
    "device";
  const ev: CalEvent = {
    title: `RK Repair Labs — ${device} (${repair.ticket_no})`,
    description: `Repair appointment for ${device}. Ticket ${repair.ticket_no}. Issue: ${repair.issue}`,
    start,
    durationMinutes: 45,
  };
  return (
    <div className="glass rounded-2xl border border-[var(--neon)]/30 bg-[var(--neon)]/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--neon)]">
            <CalendarClock className="h-3.5 w-3.5" /> Your appointment
          </div>
          <div className="text-2xl font-bold">{fmtDateTime(repair.appointment_at)}</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Add it to your phone calendar in one click so you don't miss the drop-off slot.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={googleCalendarUrl(ev)} target="_blank" rel="noreferrer">
            <Button
              size="sm"
              style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
            >
              <CalendarPlus className="mr-2 h-4 w-4" /> Google Calendar
            </Button>
          </a>
          <Button
            size="sm"
            variant="outline"
            className="glass"
            onClick={() => downloadIcs(ev, `${repair.ticket_no}.ics`)}
          >
            <CalendarPlus className="mr-2 h-4 w-4" /> Apple / Outlook (.ics)
          </Button>
        </div>
      </div>
    </div>
  );
}
