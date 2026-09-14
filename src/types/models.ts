// =============================
// Domain Models — Type Definitions
// =============================

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string; // "admin" | "employee" | "customer" | "user"
  requested_role: string;
  approval_status: string; // "pending" | "approved" | "rejected"
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  shop_name?: string;
  shop_address?: string;
  shop_phone?: string;
  shop_logo?: string;
  gst_number?: string;
  gst_percent?: number;
  wa_templates?: Record<string, string>;
  auto_reminders?: boolean;
  created_at: string | Date;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  owner_id: string;
  profile_id?: string | null;
  created_at: string | Date;
}

export interface Repair {
  id: string;
  ticket_no: string;
  customer_id?: string | null;
  device_type?: string | null;
  device_brand?: string | null;
  device_model?: string | null;
  imei?: string | null;
  issue: string;
  status: string; // "received" | "diagnosed" | "waiting_parts" | "in_progress" | "completed" | "delivered" | "cancelled"
  technician_notes?: string | null;
  estimated_completion?: string | null;
  estimated_cost?: number | null;
  final_cost?: number | null;
  appointment_at?: string | null;
  owner_id: string;
  technician_id?: string | null;
  technician_name?: string | null;
  completed_at?: string | Date | null;
  delivered_at?: string | Date | null;
  assigned_at?: string | Date | null;
  created_at: string | Date;
}

export interface RepairNote {
  id: string;
  repair_id: string;
  note: string;
  technician_name?: string;
  task_done: boolean;
  created_at: string | Date;
  completed_at?: string | Date | null;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  customer_id?: string | null;
  repair_id?: string | null;
  subtotal: number;
  discount?: number | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
  total: number;
  amount_paid?: number | null;
  payment_status: string; // "paid" | "unpaid" | "partial"
  payment_method?: string | null;
  notes?: string | null;
  owner_id: string;
  created_at: string | Date;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  cost_price: number;
  selling_price: number;
  stock_level: number;
  quantity: number;
  min_stock_level?: number | null;
  location?: string | null;
  owner_id: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  item_id: string;
  type: string; // "in" | "out"
  quantity: number;
  reference_id?: string | null;
  reference_type?: string | null;
  notes?: string | null;
  owner_id: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gst_number?: string | null;
  notes?: string | null;
  owner_id: string;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  total_amount: number;
  notes?: string | null;
  status: string; // "pending" | "received" | "cancelled"
  received_at?: string | null;
  owner_id: string;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  item_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface Expense {
  id: string;
  category: string;
  description?: string | null;
  amount: number;
  expense_date: string;
  date?: string;
  owner_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body?: string | null;
  read_at?: string | null;
  created_at: string | Date;
}

export interface WaLog {
  id: string;
  owner_id: string;
  repair_id?: string | null;
  invoice_id?: string | null;
  customer_id?: string | null;
  kind: string;
  recipient_name?: string | null;
  phone?: string | null;
  message: string;
  status: string; // "pending" | "sent" | "delivered" | "read" | "failed"
  template_name?: string | null;
  template_language?: string | null;
  provider_message_id?: string | null;
  notification_key?: string | null;
  error?: string | null;
  sent_at?: string | Date | null;
  delivered_at?: string | Date | null;
  read_at?: string | Date | null;
  failed_at?: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Appointment {
  id: string;
  repair_id: string;
  title: string;
  start_time: string;
  end_time: string;
  notes?: string;
  owner_id: string;
  created_at: string;
}
