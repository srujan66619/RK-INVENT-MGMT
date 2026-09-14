import React, { forwardRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  User,
  IndianRupee,
  MapPin,
  Phone,
  Globe,
  PenTool,
  ShieldCheck,
  Mail,
  Map,
} from "lucide-react";

export type InvoiceTemplateProps = {
  invoice?: any;
  customer?: any;
  repair?: any;
  shop?: any;
  items?: any[];
};

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, customer, repair, shop, items }, ref) => {
    const jobID = invoice?.invoice_no || "INV-000000";

    // Parse date and time safely
    let dateStr = "";
    try {
      const src = invoice?.created_at || new Date().toISOString();
      const d = new Date(src);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
    } catch (_e) {
      /* fallback to empty */
    }

    const teal = "#008A9A";
    const orange = "#F47A21";
    const darkBg = "#111827";

    const pdfSafeStyle = {
      "--color-white": "#ffffff",
      "--color-black": "#000000",
      "--color-gray-50": "#f9fafb",
      "--color-gray-100": "#f3f4f6",
      "--color-gray-200": "#e5e7eb",
      "--color-gray-300": "#d1d5db",
      "--color-gray-400": "#9ca3af",
      "--color-gray-500": "#6b7280",
      "--color-gray-600": "#4b5563",
      "--color-gray-700": "#374151",
      "--color-gray-800": "#1f2937",
      "--color-gray-900": "#111827",
      "--color-red-600": "#dc2626",
      "--color-green-600": "#16a34a",
      "--color-amber-500": "#f59e0b",
    } as React.CSSProperties;

    const subtotal =
      invoice?.subtotal ||
      items?.reduce((acc, it) => acc + (it.unit_price || 0) * (it.quantity || 1), 0) ||
      0;
    const tax = invoice?.tax || 0;
    const discount = invoice?.discount || 0;
    const total = invoice?.total || subtotal + tax - discount;
    const advance = invoice?.advance || 0;
    const due = Math.max(0, total - advance);

    return (
      <div
        ref={ref}
        style={{
          width: "794px",
          minHeight: "1123px",
          padding: "28px 32px 20px",
          fontFamily: "'Inter', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          fontSize: "10px",
          color: "#1a1a1a",
          backgroundColor: "#ffffff",
          boxSizing: "border-box",
          position: "relative",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          ...pdfSafeStyle,
        }}
      >
        {/* ============ HEADER BACKGROUND ============ */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "160px",
            zIndex: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {/* The black slanted shape from the top left */}
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 800 160"
            preserveAspectRatio="none"
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            <path d="M0,0 L280,0 L180,160 L0,160 Z" fill="#111827" />
          </svg>
        </div>

        {/* ============ HEADER ============ */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "145px",
            borderBottom: `4px solid ${teal}`,
            marginBottom: "12px",
          }}
        >
          {/* Logo Area */}
          <div
            style={{
              position: "absolute",
              left: "20px",
              top: "10px",
              width: "120px",
              height: "120px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Always show the official RK Repair Labs brand logo */}
            <img
              src="/assets/rk-repair-labs-logo.png"
              alt="RK Repair Labs"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              crossOrigin="anonymous"
            />
          </div>

          {/* Center - Brand Name */}
          <div
            style={{
              position: "absolute",
              left: "210px",
              top: "0px",
              width: "360px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  fontFamily: "Impact, 'Arial Black', sans-serif",
                  fontSize: "30px",
                  fontWeight: 900,
                  color: teal,
                  letterSpacing: "1px",
                  lineHeight: 1.1,
                }}
              >
                RK
              </div>
              <div
                style={{
                  fontFamily: "Impact, 'Arial Black', sans-serif",
                  fontSize: "30px",
                  fontWeight: 900,
                  color: orange,
                  letterSpacing: "1px",
                  lineHeight: 1.1,
                }}
              >
                REPAIR LABS
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                justifyContent: "center",
                marginTop: "2px",
              }}
            >
              <div style={{ height: "2px", background: teal, flex: 1 }} />
              <div
                style={{ fontSize: "11px", fontWeight: 600, color: "#333", letterSpacing: "0.5px" }}
              >
                Expert hands - Trusted repairs
              </div>
              <div style={{ height: "2px", background: teal, flex: 1 }} />
            </div>

            <div
              style={{
                marginTop: "16px",
                textAlign: "center",
                fontSize: "11px",
                color: "#555",
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              14-13, Brindavan Gardens 1st Lane, Guntur - 522004
              <br />
              Phone: +91 9666984949 / 9505225222
              <br />
              GSTIN: {shop?.gst_no || "22AAAAA0000A1Z5"}
            </div>
          </div>

          {/* Right - Title + Invoice No */}
          <div
            style={{
              position: "absolute",
              right: "0px",
              top: "2px",
              width: "190px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Impact, 'Arial Black', sans-serif",
                fontSize: "32px",
                fontWeight: 900,
                lineHeight: 1.1,
                textTransform: "uppercase",
                textAlign: "center",
                color: darkBg,
              }}
            >
              TAX INVOICE
            </div>
            {/* Job ID Badge */}
            <div style={{ position: "relative", width: "100%", marginTop: "16px" }}>
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: teal,
                  color: "#fff",
                  padding: "2px 14px",
                  borderRadius: "12px",
                  fontSize: "9px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  zIndex: 2,
                  border: "2px solid #fff",
                  whiteSpace: "nowrap",
                }}
              >
                INVOICE NO
              </div>
              <div
                style={{
                  border: `2px solid ${orange}`,
                  borderRadius: "8px",
                  textAlign: "center",
                  paddingTop: "14px",
                  paddingBottom: "4px",
                  fontFamily: "Impact, 'Arial Black', sans-serif",
                  fontSize: "16px",
                  fontWeight: 900,
                  color: orange,
                }}
              >
                {jobID}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          {/* CUSTOMER DETAILS */}
          <Section
            icon={<User size={14} strokeWidth={2.5} color="#fff" />}
            title="BILLED TO"
            color={teal}
          >
            <div
              style={{
                padding: "8px 14px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <FieldRow label="Customer Name" value={customer?.name || "Cash / Walk-in"} />
              <FieldRow label="Mobile No." value={customer?.phone || "-"} />
              <FieldRow label="Email ID" value={customer?.email || "-"} />
              <FieldRow label="Address" value={customer?.address || "-"} />
              {customer?.gst_no && <FieldRow label="GSTIN" value={customer.gst_no} />}
            </div>
          </Section>

          {/* INVOICE DETAILS */}
          <Section
            icon={<IndianRupee size={14} strokeWidth={2.5} color="#fff" />}
            title="INVOICE DETAILS"
            color={teal}
          >
            <div
              style={{
                padding: "8px 14px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <FieldRow label="Invoice Date" value={dateStr} />
              <FieldRow label="Payment Mode" value={invoice?.payment_method || "Cash"} />
              <FieldRow label="Related Ticket" value={repair?.ticket_no || "-"} />
              <FieldRow
                label="Device/Model"
                value={repair ? `${repair.device_brand} ${repair.device_model}` : "-"}
              />
            </div>
          </Section>
        </div>

        {/* ============ INVOICE ITEMS TABLE ============ */}
        <div
          style={{
            border: `2px solid ${teal}`,
            borderRadius: "8px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 110px 80px 80px 100px",
              background: teal,
              color: "white",
              padding: "8px 12px",
              fontWeight: 700,
              fontSize: "11px",
              letterSpacing: "0.5px",
            }}
          >
            <div style={{ textAlign: "center" }}>S.No</div>
            <div>Description of Service / Product</div>
            <div style={{ textAlign: "center" }}>Warranty</div>
            <div style={{ textAlign: "center" }}>Qty</div>
            <div style={{ textAlign: "right" }}>Rate</div>
            <div style={{ textAlign: "right" }}>Amount (₹)</div>
          </div>

          {/* Body */}
          <div style={{ minHeight: "300px", display: "flex", flexDirection: "column" }}>
            {items && items.length > 0 ? (
              items.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr 110px 80px 80px 100px",
                    padding: "10px 12px",
                    borderBottom: "1px solid #e2e8f0",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#333",
                  }}
                >
                  <div style={{ textAlign: "center" }}>{idx + 1}</div>
                  <div>{it.description || "Repair Service"}</div>
                  <div style={{ textAlign: "center", color: (it as any).warranty ? "#008A9A" : "#999", fontWeight: (it as any).warranty ? 600 : 400 }}>
                    {(it as any).warranty || "—"}
                  </div>
                  <div style={{ textAlign: "center" }}>{it.quantity || 1}</div>
                  <div style={{ textAlign: "right" }}>{(it.unit_price || 0).toFixed(2)}</div>
                  <div style={{ textAlign: "right" }}>
                    {((it.unit_price || 0) * (it.quantity || 1)).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "12px", fontStyle: "italic", color: "#888" }}>
                No items billed.
              </div>
            )}
          </div>

          {/* Footer Totals */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              background: "#f8fafc",
              borderTop: "2px solid #e2e8f0",
              padding: "12px",
            }}
          >
            <div
              style={{
                width: "240px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#555" }}>Subtotal:</span>
                <span>₹ {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#555" }}>Discount:</span>
                  <span style={{ color: "#16a34a" }}>- ₹ {discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#555" }}>Taxes (GST):</span>
                <span>₹ {tax.toFixed(2)}</span>
              </div>
              <div style={{ height: "1px", background: "#cbd5e1", margin: "4px 0" }} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: teal,
                }}
              >
                <span>Grand Total:</span>
                <span>₹ {total.toFixed(2)}</span>
              </div>
              {advance > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#555",
                    marginTop: "4px",
                  }}
                >
                  <span>Advance Paid:</span>
                  <span>₹ {advance.toFixed(2)}</span>
                </div>
              )}
              {due > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: orange,
                    fontSize: "12px",
                    fontWeight: 800,
                    marginTop: "4px",
                  }}
                >
                  <span>Balance Due:</span>
                  <span>₹ {due.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============ FLEX SPACER ============ */}
        <div style={{ flex: 1 }} />

        {/* Footer Area with Signature and Notes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "20px" }}>
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: teal,
                marginBottom: "4px",
                textTransform: "uppercase",
              }}
            >
              Terms & Conditions:
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "16px",
                fontSize: "9px",
                color: "#555",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <li>All repair parts include a 30-day limited warranty unless stated otherwise.</li>
              <li>Water damaged devices do not carry any warranty.</li>
              <li>Please retain this invoice for any future warranty claims.</li>
              <li>Goods once sold will not be taken back.</li>
            </ul>
          </div>
          <div
            style={{
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              position: "relative",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              alignItems: "center",
              background: "#f8fafc",
              height: "100px",
            }}
          >
            {/* Pen Icon */}
            <div style={{ position: "absolute", left: "16px", top: "16px", color: teal }}>
              <PenTool size={18} strokeWidth={2} />
            </div>
            <div
              style={{
                borderBottom: "1.5px solid #555",
                width: "100%",
                maxWidth: "180px",
                margin: "40px auto 0",
              }}
            />
            <div
              style={{
                textAlign: "center",
                fontSize: "10px",
                fontWeight: 700,
                color: teal,
                textTransform: "uppercase",
                marginTop: "6px",
                letterSpacing: "0.5px",
              }}
            >
              AUTHORIZED SIGNATORY
            </div>
          </div>
        </div>

        {/* ============ FOOTER STRIP ============ */}
        <div
          style={{
            background: darkBg,
            color: "#fff",
            borderRadius: "8px",
            marginTop: "16px",
            padding: "16px 20px",
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr 1fr",
            gap: "16px",
            flexShrink: 0,
          }}
        >
          {/* Address */}
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ color: orange, marginTop: "-2px" }}>
              <MapPin size={16} strokeWidth={2.5} />
            </div>
            <div style={{ lineHeight: 1.5, fontSize: "9px", fontWeight: 500, color: "#e2e8f0" }}>
              14-13, Brindavan Gardens 1st Lane,
              <br />
              Brindavan Gardens, Guntur - 522004,
              <br />
              Andhra Pradesh, India.
            </div>
          </div>

          {/* Phone */}
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ color: teal, marginTop: "-2px" }}>
              <Phone size={16} strokeWidth={2.5} />
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "10px",
                lineHeight: 1.5,
                color: "#fff",
                letterSpacing: "0.5px",
              }}
            >
              +91 9666984949
              <br />
              +91 9505225222
            </div>
          </div>

          {/* Social + Website */}
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ color: orange, marginTop: "-2px" }}>
              <Globe size={16} strokeWidth={2.5} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "10px",
                  color: "#fff",
                  letterSpacing: "0.5px",
                  marginBottom: "2px",
                }}
              >
                rkrepairlabs.vercel.app
              </div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "9px",
                  fontWeight: 500,
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                }}
              >
                Facebook <span style={{ color: teal }}>|</span> Instagram{" "}
                <span style={{ color: teal }}>|</span> YouTube
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

InvoiceTemplate.displayName = "InvoiceTemplate";

/* ===== Helper Sub-Components ===== */

function Section({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: `1.5px solid ${color}`,
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          background: color,
          color: "#fff",
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {icon}
        <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.5px" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", fontSize: "10px", lineHeight: 1.4 }}>
      <span style={{ fontWeight: 600, width: "100px", flexShrink: 0, color: "#444" }}>{label}</span>
      <span style={{ marginRight: "6px", color: "#777" }}>:</span>
      <span style={{ fontWeight: 700, color: "#111", flex: 1, wordBreak: "break-word" }}>
        {value || "—"}
      </span>
    </div>
  );
}
