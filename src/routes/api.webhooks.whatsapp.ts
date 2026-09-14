import { createFileRoute } from "@tanstack/react-router";
import { GET, POST } from "@/lib/api/webhook.server";

export const Route = createFileRoute("/api/webhooks/whatsapp")({
  server: {
    handlers: {
      GET,
      POST
    }
  }
});

