import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRepairFn } from "@/lib/api/repairs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/customer/book")({
  component: BookRepair,
});

function BookRepair() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [ticketNo, setTicketNo] = useState("");
  
  const [formData, setFormData] = useState({
    device_type: "",
    device_brand: "",
    device_model: "",
    issue: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await createRepairFn({
        data: {
          ...data,
          status: "received",
        },
      });
    },
    onSuccess: (res) => {
      setTicketNo(res.ticket_no || "");
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["repairs"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (success) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card/50 p-8 text-center mt-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Repair Requested!</h2>
        <p className="text-muted-foreground mb-6">
          Your repair request has been submitted successfully. Your ticket number is:
        </p>
        <div className="text-3xl font-mono font-bold text-primary mb-8 bg-muted py-3 rounded-lg border border-border/50">
          {ticketNo}
        </div>
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate({ to: "/customer/dashboard" })}>
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/track", search: { ticket: ticketNo } })}>
            Track Ticket
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Wrench className="h-8 w-8 text-primary" />
          Book a Repair
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tell us about your device issue and we'll get it fixed as soon as possible.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card/50 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="device_type">Device Type *</Label>
            <Input
              id="device_type"
              placeholder="e.g. Smartphone, Laptop"
              required
              value={formData.device_type}
              onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="device_brand">Brand *</Label>
            <Input
              id="device_brand"
              placeholder="e.g. Apple, Samsung"
              required
              value={formData.device_brand}
              onChange={(e) => setFormData({ ...formData, device_brand: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="device_model">Model</Label>
          <Input
            id="device_model"
            placeholder="e.g. iPhone 13 Pro, Galaxy S21"
            value={formData.device_model}
            onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="issue">Describe the Issue *</Label>
          <Textarea
            id="issue"
            placeholder="Please provide details about what's wrong with the device..."
            className="min-h-[120px]"
            required
            value={formData.issue}
            onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: "/customer/dashboard" })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
