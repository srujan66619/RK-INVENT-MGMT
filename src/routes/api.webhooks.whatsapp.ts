import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { waLogs } from "@/db/schema/logs";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const Route = createFileRoute("/api/webhooks/whatsapp")({
  server: {
    handlers: {
      GET: async (req: Request) => {
        const url = new URL(req.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
          return new Response(challenge, { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },
      POST: async (req: Request) => {
        const bodyText = await req.text();
        const signature = req.headers.get("x-hub-signature-256");

        // Validate webhook signature if secret is provided
        if (process.env.WHATSAPP_APP_SECRET && signature) {
          const hmac = crypto.createHmac("sha256", process.env.WHATSAPP_APP_SECRET);
          hmac.update(bodyText);
          const expectedSignature = `sha256=${hmac.digest("hex")}`;
          
          if (signature !== expectedSignature) {
            return new Response("Invalid signature", { status: 403 });
          }
        }

        try {
          const body = JSON.parse(bodyText);
          
          if (body.object === "whatsapp_business_account") {
            for (const entry of body.entry) {
              for (const change of entry.changes) {
                if (change.value && change.value.statuses) {
                  for (const statusObj of change.value.statuses) {
                    const providerMessageId = statusObj.id;
                    const status = statusObj.status; // sent, delivered, read, failed
                    const timestamp = statusObj.timestamp;
                    const error = statusObj.errors ? JSON.stringify(statusObj.errors) : null;
                    
                    if (!providerMessageId) continue;
                    
                    // Look up the existing message
                    const existingLogs = await db
                      .select()
                      .from(waLogs)
                      .where(eq(waLogs.provider_message_id, providerMessageId));
                      
                    if (existingLogs.length === 0) continue;
                    
                    const existing = existingLogs[0];
                    const tsDate = timestamp ? new Date(parseInt(timestamp) * 1000) : new Date();

                    // Only update if it's a newer status progression
                    // Ordering logic: pending -> sent -> delivered -> read (failed can happen anytime)
                    const statusRank: Record<string, number> = {
                      pending: 0,
                      sent: 1,
                      delivered: 2,
                      read: 3,
                      failed: 4,
                    };
                    
                    const oldRank = statusRank[existing.status] ?? 0;
                    const newRank = statusRank[status] ?? 0;
                    
                    // Webhooks can arrive out of order, so only update if it's an advancement
                    if (newRank >= oldRank) {
                      const updateData: any = {
                        status: status,
                      };
                      
                      if (status === "sent") updateData.sent_at = tsDate;
                      if (status === "delivered") updateData.delivered_at = tsDate;
                      if (status === "read") updateData.read_at = tsDate;
                      if (status === "failed") {
                        updateData.failed_at = tsDate;
                        updateData.error = error;
                      }
                      
                      await db.update(waLogs)
                        .set(updateData)
                        .where(eq(waLogs.id, existing.id));
                    }
                  }
                }
              }
            }
          }
          return new Response("OK", { status: 200 });
        } catch (e) {
          console.error("WhatsApp Webhook Error:", e);
          // Return 200 to prevent Meta from retrying a bad payload
          return new Response("Error", { status: 200 });
        }
      },
    }
  }
});
