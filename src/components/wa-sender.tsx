import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageCircle, X, Copy } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { sendManualWhatsappFn, getWhatsappStatusFn } from "@/lib/api/whatsapp";

export type WaSendRequest = {
  kind: "advance" | "status_update" | "invoice" | "payment_reminder" | "appointment" | "generic";
  phone: string | null | undefined;
  recipientName?: string | null;
  message: string;
  repairId?: string | null;
  invoiceId?: string | null;
  title?: string;
};

type Ctx = { send: (req: WaSendRequest) => void };
const WaCtx = createContext<Ctx | null>(null);

export function useWaSender() {
  const c = useContext(WaCtx);
  if (!c) throw new Error("WaSenderProvider missing");
  return c;
}

// Keeping insertLog for history if needed, but the server handles logs now.

export function WaSenderProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [req, setReq] = useState<WaSendRequest | null>(null);
  const [text, setText] = useState("");

  const send = useCallback((r: WaSendRequest) => {
    setReq(r);
    setText(r.message);
  }, []);

  function close() {
    setReq(null);
    setText("");
  }

  function refreshLogs() {
    if (req?.repairId) qc.invalidateQueries({ queryKey: ["wa-logs", req.repairId] });
    if (req?.invoiceId) qc.invalidateQueries({ queryKey: ["wa-logs-invoice", req.invoiceId] });
  }

  const sendMutation = useMutation({
    mutationFn: (r: { kind: string; target_id: string; link?: string; status_override?: string }) => 
      sendManualWhatsappFn({ data: r }),
    onSuccess: () => {
      toast.success("WhatsApp message sent successfully via API");
      refreshLogs();
      close();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send WhatsApp message via API");
    }
  });

  async function openNow() {
    if (!req) return;
    
    if (!req.phone) {
      toast.error("No WhatsApp number for this recipient");
      close();
      return;
    }

    let apiKind = "";
    let targetId = "";
    let statusOverride = undefined;
    let link = undefined;

    if (req.repairId) {
      apiKind = "repair_update";
      targetId = req.repairId;
      if (req.kind === "status_update" || req.kind === "advance" || req.kind === "generic") {
        // Use generic kind for now, backend maps it based on repair status or generic template
        statusOverride = "update"; 
      }
    } else if (req.invoiceId) {
      targetId = req.invoiceId;
      if (req.kind === "invoice") {
        apiKind = "invoice_delivery";
        // Actually, if it's an invoice, we need a link. For now, pass a dummy or instruct user.
        link = "Invoice available on request.";
      } else if (req.kind === "payment_reminder") {
        apiKind = "payment_reminder";
      }
    }

    if (!apiKind || !targetId) {
      toast.error("Invalid notification target");
      return;
    }

    sendMutation.mutate({ kind: apiKind, target_id: targetId, status_override: statusOverride, link });
  }

  async function cancel() {
    close();
  }

  async function copyMsg() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Message copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <WaCtx.Provider value={{ send }}>
      {children}
      <Dialog
        open={!!req}
        onOpenChange={(v) => {
          if (!v) cancel();
        }}
      >
        <DialogContent className="glass-strong max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WhatsAppIcon className="h-5 w-5 text-[var(--neon)]" />
              {req?.title ?? "Preview WhatsApp message"}
            </DialogTitle>
          </DialogHeader>
          {req && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="glass rounded-lg p-3">
                  <div className="uppercase tracking-wider text-muted-foreground">Recipient</div>
                  <div className="mt-1 font-semibold">{req.recipientName ?? "—"}</div>
                  <div className="text-muted-foreground">{req.phone ?? "No number on file"}</div>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="uppercase tracking-wider text-muted-foreground">Type</div>
                  <div className="mt-1 font-semibold capitalize">{req.kind.replace(/_/g, " ")}</div>
                  <div className="text-muted-foreground">Logged on ticket / invoice</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center justify-between">
                  <span>Message preview (Meta API Template)</span>
                </Label>
                <div className="text-[11px] text-muted-foreground bg-black/20 p-2 rounded-md">
                  This message will be sent via the Meta WhatsApp Cloud API using an approved template. The text below is an approximation of what the customer will receive.
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancel}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={openNow}
              disabled={!req?.phone || sendMutation.isPending}
              style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
            >
              <WhatsAppIcon className="mr-2 h-4 w-4" /> 
              {sendMutation.isPending ? "Sending..." : "Send via API"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WaCtx.Provider>
  );
}
