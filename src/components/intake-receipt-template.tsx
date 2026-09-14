import React, { forwardRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Barcode from "react-barcode";
import {
  Laptop,
  Smartphone,
  Monitor,
  Tablet,
  Calendar,
  Clock,
  User,
  ScanLine,
  IndianRupee,
  MapPin,
  Phone,
  Globe,
  PenTool,
  ShieldCheck,
  Power,
  Droplet,
  PowerOff,
  Hammer,
  MonitorCheck,
  Scissors,
  MonitorX,
  Wrench,
  Package,
  FileText,
  ClipboardList,
  MoreHorizontal,
} from "lucide-react";

type IntakeReceiptProps = {
  invoice?: any;
  customer?: any;
  repair?: any;
  shop?: any;
  items?: any[];
};

export const IntakeReceiptTemplate = forwardRef<HTMLDivElement, IntakeReceiptProps>(
  ({ invoice, customer, repair, shop, items }, ref) => {
    const jobID = repair?.ticket_no || invoice?.invoice_no || "RKRL-000001";

    // Parse date and time safely
    let dateStr = "";
    let timeStr = "";
    try {
      const src = invoice?.created_at || repair?.created_at;
      const d = new Date(src);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      }
    } catch (_e) {
      /* fallback to empty */
    }

    const teal = "#008A9A";
    const orange = "#F47A21";
    const darkBg = "#111827";

    const trackUrl = `https://rklabs.syncailabs.in/track?ticket=${jobID}`;

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
            <img
              src="/assets/rk-repair-labs-logo.png"
              alt="RK Repair Labs"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              crossOrigin="anonymous"
            />
          </div>

          {/* Center - Brand Name + Icons */}
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
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                marginTop: "16px",
                padding: "0 10px",
              }}
            >
              {[
                { icon: <Laptop size={20} strokeWidth={2} />, text: "LAPTOP REPAIR" },
                { icon: <Smartphone size={20} strokeWidth={2} />, text: "MOBILE REPAIR" },
                { icon: <Monitor size={20} strokeWidth={2} />, text: "MACBOOK REPAIR" },
                { icon: <Tablet size={20} strokeWidth={2} />, text: "TABLET REPAIR" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: teal,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span style={{ fontSize: "9px", fontWeight: 800, color: "#222" }}>
                    {item.text}
                  </span>
                  {i < 3 && (
                    <div
                      style={{
                        position: "absolute",
                        right: "-12px",
                        top: "10px",
                        width: "1px",
                        height: "16px",
                        background: "#ddd",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right - Title + Job ID + Barcode */}
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
                fontSize: "22px",
                fontWeight: 900,
                lineHeight: 1.1,
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              REPAIR INTAKE RECEIPT
            </div>
            {/* Job ID Badge */}
            <div style={{ position: "relative", width: "100%", marginTop: "12px" }}>
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
                JOB ID
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
            {/* Barcode */}
            <div
              style={{
                marginTop: "4px",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <Barcode
                value={jobID}
                width={1.2}
                height={26}
                displayValue={false}
                margin={0}
                background="transparent"
                lineColor="#000"
              />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 265px", gap: "12px 16px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <DateTimeBox
              icon={<Calendar size={16} strokeWidth={2.5} color="#fff" />}
              label="DATE"
              value={dateStr}
              color={teal}
            />
            <DateTimeBox
              icon={<Clock size={16} strokeWidth={2.5} color="#fff" />}
              label="TIME"
              value={timeStr}
              color={teal}
            />
          </div>

          {/* ---- LEFT COLUMN SECTIONS ---- */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* CUSTOMER DETAILS */}
            <Section
              icon={<User size={14} strokeWidth={2.5} color="#fff" />}
              title="CUSTOMER DETAILS"
              color={teal}
            >
              <div
                style={{
                  padding: "4px 14px 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <FieldRow label="Customer Name" value={customer?.name} />
                <FieldRow label="Mobile No." value={customer?.phone} />
                <FieldRow label="Email ID" value={customer?.email} />
                <FieldRow label="Address" value={customer?.address} />
              </div>
            </Section>

            {/* DEVICE DETAILS */}
            <Section
              icon={<Smartphone size={14} strokeWidth={2.5} color="#fff" />}
              title="DEVICE DETAILS"
              color={teal}
            >
              <div
                style={{
                  padding: "4px 14px 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", fontSize: "10px" }}>
                  <span style={{ fontWeight: 500, width: "120px", flexShrink: 0 }}>
                    Device Type
                  </span>
                  <span style={{ marginRight: "6px" }}>:</span>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", flex: 1 }}>
                    <CheckboxEl text="Laptop" checked={repair?.device_type === "Laptop"} />
                    <CheckboxEl text="Mobile" checked={repair?.device_type === "Mobile"} />
                    <CheckboxEl text="Tablet" checked={repair?.device_type === "Tablet"} />
                    <CheckboxEl text="MacBook" checked={repair?.device_type === "MacBook"} />
                    <CheckboxEl
                      text="Other"
                      checked={
                        !["Laptop", "Mobile", "Tablet", "MacBook"].includes(repair?.device_type) &&
                        !!repair?.device_type
                      }
                    />
                  </div>
                </div>
                <FieldRow label="Brand" value={repair?.device_brand} />
                <FieldRow label="Model" value={repair?.device_model} />
                <FieldRow label="Serial No./IMEI" value={repair?.imei} />
                <FieldRow label="Password (if any)" value={repair?.password} />
              </div>
            </Section>

            {/* REPORTED PROBLEM */}
            <Section
              icon={<FileText size={14} strokeWidth={2.5} color="#fff" />}
              title="REPORTED PROBLEM"
              color={teal}
            >
              <div style={{ padding: "4px 14px 12px" }}>
                <div style={{ fontSize: "10px", fontWeight: 500, marginBottom: "4px" }}>
                  Reported Problem / Fault Description :
                </div>
                <div
                  style={{
                    borderBottom: "1px solid #aaa",
                    minHeight: "20px",
                    fontSize: "10px",
                    fontStyle: "italic",
                    fontWeight: 600,
                    padding: "2px 4px",
                  }}
                >
                  {repair?.issue || ""}
                </div>
                <div style={{ borderBottom: "1px solid #ccc", height: "22px" }} />
                <div style={{ borderBottom: "1px solid #ccc", height: "22px" }} />
              </div>
            </Section>

            {/* ACCESSORIES RECEIVED */}
            <Section
              icon={<Package size={14} strokeWidth={2.5} color="#fff" />}
              title="ACCESSORIES RECEIVED"
              color={teal}
            >
              <div style={{ padding: "6px 14px 10px" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    fontSize: "10px",
                    fontWeight: 600,
                    marginBottom: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <CheckboxEl text="Charger" />
                  <CheckboxEl text="Battery" />
                  <CheckboxEl text="Bag" />
                  <CheckboxEl text="Box" />
                  <CheckboxEl text="Other" />
                  <span
                    style={{
                      borderBottom: "1px solid #aaa",
                      width: "60px",
                      display: "inline-block",
                    }}
                  />
                </div>
                <FieldRow label="Other Notes" value="" />
              </div>
            </Section>
          </div>

          {/* ---- RIGHT COLUMN SECTIONS ---- */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* QR CODE - SCAN TO TRACK */}
            <Section
              icon={<ScanLine size={14} strokeWidth={2.5} color="#fff" />}
              title="TRACK REPAIR STATUS"
              color={teal}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div
                style={{
                  padding: "16px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "14px",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    padding: "4px",
                    background: "#fff",
                    border: "2px solid #000",
                    borderRadius: "6px",
                    flexShrink: 0,
                  }}
                >
                  <QRCodeCanvas value={trackUrl} size={84} level="M" />
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#333",
                    textAlign: "left",
                    lineHeight: 1.4,
                  }}
                >
                  Scan QR to check
                  <br />
                  real-time repair
                  <br />
                  status online.
                </div>
              </div>
            </Section>

            {/* DEVICE CONDITION AT INTAKE */}
            <Section
              icon={<ClipboardList size={14} strokeWidth={2.5} color="#fff" />}
              title="DEVICE CONDITION AT INTAKE"
              color={teal}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px 6px",
                  padding: "10px 10px 12px",
                  fontSize: "10px",
                }}
              >
                <ConditionItem icon={<Power size={12} strokeWidth={2.5} />} text="Power ON" />
                <ConditionItem icon={<Droplet size={12} strokeWidth={2.5} />} text="Water Damage" />
                <ConditionItem icon={<PowerOff size={12} strokeWidth={2.5} />} text="Power OFF" />
                <ConditionItem
                  icon={<Hammer size={12} strokeWidth={2.5} />}
                  text="Physical Damage"
                />
                <ConditionItem
                  icon={<MonitorCheck size={12} strokeWidth={2.5} />}
                  text="Display OK"
                />
                <ConditionItem
                  icon={<Scissors size={12} strokeWidth={2.5} />}
                  text="Scratches / Dents"
                />
                <ConditionItem icon={<MonitorX size={12} strokeWidth={2.5} />} text="No Display" />
                <ConditionItem
                  icon={<Wrench size={12} strokeWidth={2.5} />}
                  text="Missing Screws"
                />
                <ConditionItem
                  icon={<Smartphone size={12} strokeWidth={2.5} />}
                  text="Screen Cracked"
                />
                <ConditionItem icon={<MoreHorizontal size={12} strokeWidth={2.5} />} text="Other" />
              </div>
            </Section>

            {/* ESTIMATED & PAYMENT DETAILS */}
            <Section
              icon={<IndianRupee size={14} strokeWidth={2.5} color="#fff" />}
              title="ESTIMATED & PAYMENT DETAILS"
              color={teal}
              iconBg
            >
              <div
                style={{
                  padding: "8px 10px 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  fontSize: "10px",
                  fontWeight: 600,
                }}
              >
                <PaymentRow label="Inspection / Diagnosis Fee" />
                <PaymentRow
                  label="Estimated Repair Cost"
                  value={repair?.estimated_cost ? String(repair.estimated_cost) : ""}
                />
                <PaymentRow label="Advance Paid" />
                <PaymentRow label="Balance Amount" />
                <div style={{ height: "1px", background: "#ddd", margin: "2px 0" }} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                  }}
                >
                  <span>Expected Delivery Date</span>
                  <span style={{ marginLeft: "4px" }}>:</span>
                  <div
                    style={{
                      display: "flex",
                      gap: "3px",
                      flex: 1,
                      justifyContent: "center",
                      paddingLeft: "8px",
                    }}
                  >
                    <span
                      style={{
                        width: "24px",
                        borderBottom: "1px solid #aaa",
                        display: "inline-block",
                      }}
                    />{" "}
                    /
                    <span
                      style={{
                        width: "24px",
                        borderBottom: "1px solid #aaa",
                        display: "inline-block",
                      }}
                    />{" "}
                    /
                    <span
                      style={{
                        width: "40px",
                        borderBottom: "1px solid #aaa",
                        display: "inline-block",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* TERMS & CONDITIONS */}
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "12px",
                position: "relative",
                padding: "20px 10px 10px",
                background: "#fdf2e9",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-10px",
                  left: "12px",
                  background: orange,
                  color: "#fff",
                  padding: "4px 16px 4px 12px",
                  fontWeight: 700,
                  fontSize: "10px",
                  textTransform: "uppercase",
                  clipPath: "polygon(0 0, 100% 0, 94% 50%, 100% 100%, 0 100%)",
                  paddingRight: "22px",
                }}
              >
                TERMS & CONDITIONS
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  marginTop: "4px",
                }}
              >
                {(shop?.terms?.length
                  ? shop.terms
                  : [
                      "Data backup is the customer's responsibility.",
                      "RK Repair Labs is not responsible for data loss.",
                      "Warranty applies only to repaired parts / service.",
                      "Device not collected within 30 days may incur charges.",
                      "By submitting this device, you agree to the above terms.",
                    ]
                ).map((term: string, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "4px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "9px", color: orange, fontWeight: 900 }}>
                      {i + 1}.
                    </span>
                    <span
                      style={{ fontSize: "9px", color: "#444", fontWeight: 600, lineHeight: 1.3 }}
                    >
                      {term}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============ BOTTOM SECTION ============ */}

        {/* Thank You + Signature Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginTop: "14px",
            flexShrink: 0,
          }}
        >
          {/* Thank You Box */}
          <div
            style={{
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              background: "#f8fafc",
            }}
          >
            <div>
              <div
                style={{ fontSize: "12px", fontStyle: "italic", color: "#666", fontWeight: 600 }}
              >
                Thank you for trusting
              </div>
              <div
                style={{
                  fontFamily: "Impact, 'Arial Black', sans-serif",
                  fontSize: "22px",
                  fontWeight: 900,
                  color: teal,
                  lineHeight: 1,
                  marginTop: "4px",
                }}
              >
                RK <span style={{ color: orange }}>REPAIR LABS</span>
              </div>
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#444",
                  marginTop: "4px",
                  lineHeight: 1.4,
                }}
              >
                We'll get your device
                <br />
                back in perfect shape!
              </div>
            </div>
            {/* Quality Badge - SHIELD */}
            <div
              style={{
                width: "56px",
                height: "66px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <svg
                viewBox="0 0 100 120"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 0,
                }}
              >
                <path
                  d="M50 0 L100 20 L100 60 C100 90 75 115 50 120 C25 115 0 90 0 60 L0 20 Z"
                  fill={teal}
                  stroke={orange}
                  strokeWidth="4"
                />
              </svg>
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginTop: "-4px",
                }}
              >
                <ShieldCheck size={20} color="#fff" strokeWidth={3} />
                <div
                  style={{
                    color: "#fff",
                    fontSize: "6px",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    lineHeight: 1.2,
                    marginTop: "2px",
                  }}
                >
                  QUALITY
                  <br />
                  REPAIR
                  <br />
                  YOU CAN
                  <br />
                  TRUST
                </div>
              </div>
            </div>
          </div>

          {/* Technician Signature */}
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
              TECHNICIAN SIGNATURE
            </div>
          </div>
        </div>

        {/* ============ FLEX SPACER ============ */}
        <div style={{ flex: 1 }} />

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

IntakeReceiptTemplate.displayName = "IntakeReceiptTemplate";

/* ===== Helper Sub-Components ===== */

function ServiceIcon({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function DateTimeBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        border: "1.5px solid #e2e8f0",
        borderRadius: "6px",
        display: "flex",
        alignItems: "stretch",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          background: color,
          width: "38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "6px 12px",
          justifyContent: "center",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "9px", color, letterSpacing: "0.5px" }}>
          {label}
        </div>
        <div style={{ fontWeight: 600, fontSize: "11px", color: "#333", marginTop: "2px" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
  color,
  iconBg,
  style,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  color: string;
  iconBg?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        border: "1.5px dashed #C8DCDC",
        borderRadius: "6px",
        position: "relative",
        paddingTop: "24px",
        marginTop: "12px",
        ...style,
      }}
    >
      {/* The Ribbon Title */}
      <div
        style={{
          position: "absolute",
          top: "-10px",
          left: "12px",
          height: "24px",
          background: color,
          display: "flex",
          alignItems: "center",
          clipPath: "polygon(0 0, 100% 0, 95% 50%, 100% 100%, 0 100%)",
          paddingRight: "16px",
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRight: "1px solid rgba(255,255,255,0.2)",
            background: iconBg ? "rgba(0,0,0,0.1)" : "transparent",
            fontSize: "12px",
          }}
        >
          {icon}
        </div>
        <div
          style={{
            color: "#fff",
            padding: "0 10px",
            fontWeight: 700,
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
      </div>
      {/* 3D Fold Effect (Darker shade triangle) */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "8px",
          width: 0,
          height: 0,
          borderStyle: "solid",
          borderWidth: "0 4px 4px 0",
          borderColor: `transparent ${color} transparent transparent`,
          filter: "brightness(0.6)",
          zIndex: 1,
        }}
      />
      {children}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", fontSize: "10px", marginBottom: "6px" }}>
      <div
        style={{
          width: "120px",
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          paddingBottom: "1px",
        }}
      >
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 500, paddingRight: "4px" }}>:</span>
      </div>
      <div
        style={{
          flex: 1,
          borderBottom: "1.5px solid #C8DCDC",
          minHeight: "18px",
          fontWeight: 600,
          display: "flex",
          alignItems: "flex-end",
          paddingBottom: "1px",
          paddingLeft: "4px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: "#333",
        }}
      >
        {value || ""}
      </div>
    </div>
  );
}

function PaymentRow({ label, value }: { label: string; value?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        fontSize: "10px",
      }}
    >
      <span style={{ paddingBottom: "1px" }}>{label}</span>
      <span style={{ paddingBottom: "1px" }}>: ₹</span>
      <div
        style={{
          width: "80px",
          borderBottom: "1px solid #aaa",
          minHeight: "18px",
          fontWeight: 600,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          paddingBottom: "1px",
          paddingRight: "4px",
        }}
      >
        {value || ""}
      </div>
    </div>
  );
}

function CheckboxEl({ text, checked }: { text: string; checked?: boolean }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "default" }}>
      <div
        style={{
          width: "12px",
          height: "12px",
          border: "1.5px solid #888",
          borderRadius: "2px",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {checked && (
          <div style={{ width: "7px", height: "7px", background: "#222", borderRadius: "1px" }} />
        )}
      </div>
      <span style={{ fontWeight: 600, fontSize: "10px" }}>{text}</span>
    </label>
  );
}

function ConditionItem({
  icon,
  text,
  checked,
}: {
  icon: React.ReactNode;
  text: string;
  checked?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <div
          style={{
            background: "#f3f3f3",
            border: "1px solid #ddd",
            borderRadius: "50%",
            width: "20px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span style={{ fontWeight: 600, fontSize: "10px" }}>{text}</span>
      </div>
      <div
        style={{
          width: "13px",
          height: "13px",
          border: "1.5px solid #888",
          borderRadius: "2px",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {checked && (
          <div style={{ width: "7px", height: "7px", background: "#222", borderRadius: "1px" }} />
        )}
      </div>
    </div>
  );
}

function TermItem({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: "2px" }}>
        <circle cx="12" cy="12" r="12" fill={color} />
        <polyline
          points="7 12 10.5 15.5 17 8"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={{ color: "#333", fontSize: "11px", lineHeight: 1.3 }}>{text}</span>
    </div>
  );
}
