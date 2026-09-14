import { db } from "@/db";
import { waLogs } from "@/db/schema/logs";
import { and, eq } from "drizzle-orm";

interface WhatsappTemplateComponent {
  type: string;
  parameters: Array<{
    type: string;
    text?: string;
  }>;
}

export class WhatsappService {
  private get token() {
    return process.env.WHATSAPP_ACCESS_TOKEN;
  }
  private get phoneNumberId() {
    return process.env.WHATSAPP_PHONE_NUMBER_ID;
  }
  private get apiVersion() {
    return process.env.WHATSAPP_API_VERSION || "v18.0";
  }

  get isConfigured() {
    return Boolean(this.token && this.phoneNumberId);
  }

  /**
   * Normalizes phone numbers to standard format (e.g. 919666984949)
   */
  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, "");
    if (!cleaned) return "";
    
    // For Indian numbers without country code
    if (cleaned.length === 10) {
      return "91" + cleaned;
    }
    
    // If it's already 91... return it
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return cleaned;
    }
    
    return cleaned;
  }

  /**
   * Prevents sending duplicate automated messages
   */
  private async isDuplicate(notificationKey?: string | null) {
    if (!notificationKey) return false;
    
    const existingLogs = await db
      .select()
      .from(waLogs)
      .where(eq(waLogs.notification_key, notificationKey));
    
    const existing = existingLogs.length > 0 ? existingLogs[0] : null;

    if (existing && (existing.status === "sent" || existing.status === "delivered" || existing.status === "pending" || existing.status === "read")) {
      return true;
    }
    return false;
  }

  /**
   * Core function to send template messages
   */
  async sendTemplateMessage(params: {
    phone: string;
    templateName: string;
    language?: string;
    components?: WhatsappTemplateComponent[];
    kind: string;
    recipientName?: string;
    ownerId: string;
    repairId?: string;
    invoiceId?: string;
    customerId?: string;
    notificationKey?: string;
    messageTextPreview: string;
  }) {
    if (!this.isConfigured) {
      throw new Error("WhatsApp API is not configured (missing env variables)");
    }

    if (!params.phone) {
      throw new Error("Customer does not have a valid WhatsApp number.");
    }

    const normalizedPhone = this.normalizePhone(params.phone);
    if (!normalizedPhone) {
      return { success: false, reason: "Customer does not have a valid WhatsApp number." };
    }
    
    // Prevent duplicate automated messages
    if (await this.isDuplicate(params.notificationKey)) {
      console.log(`[WhatsApp] Skipping duplicate notification for key ${params.notificationKey}`);
      return { success: false, reason: "duplicate" };
    }

    let status = "pending";
    let providerMessageId: string | undefined = undefined;
    let errorText: string | undefined = undefined;

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: "template",
        template: {
          name: params.templateName,
          language: {
            code: params.language || "en",
          },
          components: params.components || [],
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Provider API failure");
      }

      status = "sent";
      providerMessageId = data.messages?.[0]?.id;
      
    } catch (e: any) {
      status = "failed";
      errorText = e.message;
      console.error("[WhatsApp API Error]", e);
    }

    // Log the message result
    await db.insert(waLogs).values({
      owner_id: params.ownerId,
      repair_id: params.repairId || null,
      invoice_id: params.invoiceId || null,
      customer_id: params.customerId || null,
      kind: params.kind,
      recipient_name: params.recipientName || null,
      phone: normalizedPhone,
      message: params.messageTextPreview,
      template_name: params.templateName,
      template_language: params.language || "en_US",
      provider_message_id: providerMessageId,
      notification_key: params.notificationKey || null,
      status,
      error: errorText,
    });

    if (status === "failed") {
      throw new Error(errorText || "Failed to send message");
    }

    return { success: true, messageId: providerMessageId };
  }

  // --- Specific Use Cases ---

  async sendRepairReceived(repair: any, customer: any, shopName: string) {
    if (!customer?.whatsapp && !customer?.phone) return;

    return this.sendTemplateMessage({
      phone: customer.whatsapp || customer.phone,
      templateName: "repair_received_v1", // The approved template name on Meta
      language: "en_US",
      kind: "repair_received",
      notificationKey: `repair:${repair.id}:received`,
      recipientName: customer.name,
      ownerId: repair.owner_id,
      repairId: repair.id,
      customerId: customer.id,
      messageTextPreview: `Repair received: ${repair.device_model} (Ticket: ${repair.ticket_no})`,
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: customer.name || "Customer" }, // {{1}}
            { type: "text", text: repair.device_model || repair.device_type || "device" }, // {{2}}
            { type: "text", text: repair.ticket_no }, // {{3}}
          ],
        }
      ]
    });
  }

  async sendRepairStatusUpdate(repair: any, customer: any, shopName: string, statusLabel: string) {
    if (!customer?.whatsapp && !customer?.phone) return;

    let templateName = "";
    let messageTextPreview = "";
    
    if (repair.status === "in_progress") {
      templateName = "repair_in_progress_v1";
      messageTextPreview = `Work started on ${repair.device_model} (Ticket: ${repair.ticket_no})`;
    } else if (repair.status === "completed") {
      templateName = "repair_completed_v1";
      messageTextPreview = `Repair completed for ${repair.device_model} (Ticket: ${repair.ticket_no})`;
    } else if (repair.status === "delivered") {
      templateName = "repair_delivered_v1";
      messageTextPreview = `Delivered ${repair.device_model} (Ticket: ${repair.ticket_no})`;
    } else {
      // For generic status updates (if there's a generic template)
      templateName = "repair_status_update_v1";
      messageTextPreview = `Status update for ${repair.device_model}: ${statusLabel}`;
    }

    return this.sendTemplateMessage({
      phone: customer.whatsapp || customer.phone,
      templateName,
      language: "en_US",
      kind: `repair_${repair.status}`,
      notificationKey: `repair:${repair.id}:status:${repair.status}`,
      recipientName: customer.name,
      ownerId: repair.owner_id,
      repairId: repair.id,
      customerId: customer.id,
      messageTextPreview,
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: customer.name || "Customer" }, // {{1}}
            { type: "text", text: repair.device_model || repair.device_type || "device" }, // {{2}}
            { type: "text", text: repair.ticket_no }, // {{3}}
          ],
        }
      ]
    });
  }

  async sendInvoice(invoice: any, customer: any, link: string, shopName: string) {
    if (!customer?.whatsapp && !customer?.phone) return;

    return this.sendTemplateMessage({
      phone: customer.whatsapp || customer.phone,
      templateName: "invoice_delivery_v1",
      language: "en_US",
      kind: "invoice_delivery",
      notificationKey: `invoice:${invoice.id}:delivery`,
      recipientName: customer.name,
      ownerId: invoice.owner_id,
      invoiceId: invoice.id,
      customerId: customer.id,
      messageTextPreview: `Invoice ${invoice.invoice_no} for ${invoice.total}`,
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: customer.name || "Customer" }, // {{1}}
            { type: "text", text: invoice.invoice_no }, // {{2}}
            { type: "text", text: String(invoice.total) }, // {{3}}
            { type: "text", text: link }, // {{4}}
          ],
        }
      ]
    });
  }

  async sendPaymentReminder(invoice: any, customer: any, shopName: string) {
    if (!customer?.whatsapp && !customer?.phone) return;

    return this.sendTemplateMessage({
      phone: customer.whatsapp || customer.phone,
      templateName: "payment_reminder_v1",
      language: "en_US",
      kind: "payment_reminder",
      notificationKey: `invoice:${invoice.id}:payment_reminder:${new Date().toISOString().split("T")[0]}`,
      recipientName: customer.name,
      ownerId: invoice.owner_id,
      invoiceId: invoice.id,
      customerId: customer.id,
      messageTextPreview: `Payment reminder for Invoice ${invoice.invoice_no}`,
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: customer.name || "Customer" }, // {{1}}
            { type: "text", text: invoice.invoice_no }, // {{2}}
            { type: "text", text: String(invoice.total) }, // {{3}}
          ],
        }
      ]
    });
  }
}

export const whatsappService = new WhatsappService();
