import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { QRCodeCanvas } from "qrcode.react";
import JsBarcode from "jsbarcode";
import { inrPrecise } from "./format";
import { getIconDataUrl } from "./pdf-icons";
import { Calendar, Clock, CheckCircle2, MapPin, Phone, Globe, PenTool } from "lucide-react";
import { PDF_COLORS, drawPdfHeader, drawPdfFooter, getStandardTableStyles } from "./pdf-template";

export type InvoicePdfInput = {
  shop: any;
  invoice: any;
  customer: any;
  repair: any;
  items: any[];
};

export async function buildInvoicePdf({ shop, invoice, customer, repair, items }: InvoicePdfInput) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  
  const invoiceNo = invoice?.invoice_no || "RKRL-INV-000001";

  let dateStr = "";
  let timeStr = "";
  try {
    const d = new Date(invoice?.created_at || Date.now());
    if (!isNaN(d.getTime())) {
      dateStr = d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    }
  } catch (e) {}

  const verifyUrl = `https://rkrepairlabs.com/verify/${invoiceNo}`;

  // 1. Generate QR Code
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  document.body.appendChild(tempDiv);
  const root = createRoot(tempDiv);

  flushSync(() => {
    root.render(
      <QRCodeCanvas
        id={`temp-qr-${invoiceNo}`}
        value={verifyUrl}
        size={100}
        level="M"
        marginSize={1}
      />,
    );
  });

  await new Promise((resolve) => setTimeout(resolve, 50));
  const qrCanvas = document.getElementById(`temp-qr-${invoiceNo}`) as HTMLCanvasElement;
  const qrDataUrl = qrCanvas ? qrCanvas.toDataURL("image/png") : "";

  root.unmount();
  tempDiv.remove();

  // 2. Generate Barcode
  const barcodeCanvas = document.createElement("canvas");
  JsBarcode(barcodeCanvas, invoiceNo, { displayValue: false, margin: 0, height: 40, width: 2 });
  const barcodeDataUrl = barcodeCanvas.toDataURL("image/png");

  // 3. Generate Icons
  const calendarIcon = await getIconDataUrl(<Calendar />, "#ffffff", 14);
  const clockIcon = await getIconDataUrl(<Clock />, "#ffffff", 14);
  const checkIcon = await getIconDataUrl(<CheckCircle2 />, "#F47A21", 12);
  const checkWhiteIcon = await getIconDataUrl(<CheckCircle2 />, "#ffffff", 14);
  const locIcon = await getIconDataUrl(<MapPin />, "#F47A21", 16);
  const phoneIcon = await getIconDataUrl(<Phone />, "#008A9A", 16);
  const webIcon = await getIconDataUrl(<Globe />, "#008A9A", 16);
  const penIcon = await getIconDataUrl(<PenTool />, "#008A9A", 32);

  const pw = 595.28;
  const ph = 841.89;
  const marginX = 24;

  let currentY = 175;
  await drawPdfHeader(doc, "TAX INVOICE", invoiceNo, "INVOICE NO.");

  // Date and Time Row
  const dateW = (pw - marginX * 2 - 15) / 2;
  const timeX = marginX + dateW + 15;

  doc.setDrawColor(PDF_COLORS.teal[0], PDF_COLORS.teal[1], PDF_COLORS.teal[2]);
  doc.setLineWidth(0.5);
  doc.setFillColor(255, 255, 255);
  doc.rect(marginX, currentY, dateW, 36, "S");
  doc.rect(timeX, currentY, dateW, 36, "S");

  doc.setFillColor(PDF_COLORS.teal[0], PDF_COLORS.teal[1], PDF_COLORS.teal[2]);
  doc.rect(marginX, currentY, 36, 36, "F");
  doc.rect(timeX, currentY, 36, 36, "F");

  doc.addImage(calendarIcon, "PNG", marginX + 10, currentY + 10, 16, 16);
  doc.addImage(clockIcon, "PNG", timeX + 10, currentY + 10, 16, 16);

  doc.setTextColor(PDF_COLORS.teal[0], PDF_COLORS.teal[1], PDF_COLORS.teal[2]);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DATE", marginX + 48, currentY + 16);
  doc.text("TIME", timeX + 48, currentY + 16);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(dateStr, marginX + 48, currentY + 30);
  doc.text(timeStr, timeX + 48, currentY + 30);

  doc.setDrawColor(200, 200, 200);
  doc.line(marginX + 48, currentY + 32, marginX + dateW - 15, currentY + 32);
  doc.line(timeX + 48, currentY + 32, timeX + dateW - 15, currentY + 32);

  currentY += 55;

  // Customer Info Box
  doc.setDrawColor(PDF_COLORS.teal[0], PDF_COLORS.teal[1], PDF_COLORS.teal[2]);
  doc.setLineDashPattern([2, 2], 0);
  const custW = 380;
  const boxHeight = 110;
  doc.rect(marginX, currentY + 5, custW, boxHeight, "S");

  drawRibbon(doc, "BILL TO / CUSTOMER", marginX - 5, currentY, 130, 14, PDF_COLORS.teal);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const labelX = marginX + 15;
  const colonX = marginX + 85;
  const valueX = marginX + 95;

  doc.text("Customer Name", labelX, currentY + 35);
  doc.text(":", colonX, currentY + 35);
  doc.text("Mobile No.", labelX, currentY + 55);
  doc.text(":", colonX, currentY + 55);
  doc.text("Email ID", labelX, currentY + 75);
  doc.text(":", colonX, currentY + 75);
  doc.text("Address", labelX, currentY + 95);
  doc.text(":", colonX, currentY + 95);

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.text(customer?.name || "Walk-in Customer", valueX, currentY + 35);
  doc.text(customer?.phone || "—", valueX, currentY + 55);
  doc.text(customer?.email || "—", valueX, currentY + 75);
  doc.text(customer?.address || "—", valueX, currentY + 95);

  // Underlines
  doc.setDrawColor(200, 200, 200);
  doc.setLineDashPattern([], 0);
  const endLineX = marginX + 370;
  doc.line(valueX, currentY + 38, endLineX, currentY + 38);
  doc.line(valueX, currentY + 58, endLineX, currentY + 58);
  doc.line(valueX, currentY + 78, endLineX, currentY + 78);
  doc.line(valueX, currentY + 98, endLineX, currentY + 98);

  // QR Code Box
  const qrX = marginX + custW + 15;
  const qrW = pw - marginX * 2 - custW - 15;
  doc.setDrawColor(PDF_COLORS.teal[0], PDF_COLORS.teal[1], PDF_COLORS.teal[2]);
  doc.setLineDashPattern([2, 2], 0);
  doc.rect(qrX, currentY + 5, qrW, boxHeight, "S");
  doc.setLineDashPattern([], 0);

  doc.setFillColor(PDF_COLORS.teal[0], PDF_COLORS.teal[1], PDF_COLORS.teal[2]);
  doc.rect(qrX + 10, currentY, qrW - 20, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text("VERIFY AUTHENTICITY", qrX + qrW / 2, currentY + 10, { align: "center" });

  const qrSize = 65;
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + qrW / 2 - qrSize / 2, currentY + 20, qrSize, qrSize, "F");
  doc.addImage(qrDataUrl, "PNG", qrX + qrW / 2 - qrSize / 2, currentY + 20, qrSize, qrSize);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Scan QR to verify", qrX + qrW / 2, currentY + 95, { align: "center" });
  doc.text("invoice authenticity online.", qrX + qrW / 2, currentY + 105, { align: "center" });

  currentY += 140;

  // Table Label Ribbon
  drawRibbon(doc, "PARTICULARS / LINE ITEMS", marginX - 5, currentY, 150, 14, PDF_COLORS.teal);

  const tableData =
    items.length > 0
      ? items.map((item, idx) => [
          idx + 1,
          item.description,
          item.quantity,
          inrPrecise(item.unit_price),
          inrPrecise(item.quantity * item.unit_price),
        ])
      : [["", "No items found", "", "", ""]];

  autoTable(doc, {
    startY: currentY + 14,
    margin: { left: marginX, right: marginX, bottom: 90 }, // reserve space for footer
    head: [["#", "DESCRIPTION", "QTY", "UNIT PRICE", "TOTAL"]],
    body: tableData,
    theme: "plain",
    headStyles: { fillColor: PDF_COLORS.teal, textColor: 255, fontSize: 8, fontStyle: "bold" },
    styles: { cellPadding: 6 },
    bodyStyles: { fontSize: 8, textColor: 30, fillColor: 255 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 38, halign: "center" },
      1: { cellWidth: 274, halign: "left" },
      2: { cellWidth: 55, halign: "center" },
      3: { cellWidth: 87, halign: "right" },
      4: { cellWidth: 93, halign: "right", textColor: PDF_COLORS.teal, fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "head") {
        if (data.column.index === 0) data.cell.styles.halign = "center";
        if (data.column.index === 1) data.cell.styles.halign = "left";
        if (data.column.index === 2) data.cell.styles.halign = "center";
        if (data.column.index === 3) data.cell.styles.halign = "right";
        if (data.column.index === 4) data.cell.styles.halign = "right";
      }
    },
    didDrawCell: (data) => {
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.line(
        data.cell.x,
        data.cell.y + data.cell.height,
        data.cell.x + data.cell.width,
        data.cell.y + data.cell.height,
      );
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawHeader(doc);
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY;

  // Dynamic Spacing Calculation
  const footerY = ph - 70;

  // Total fixed height needed below table:
  // Payment/Totals (105) + gap (20) + Terms (65) + gap (20) + Thanks/Sig (120) = 330
  const remaining = footerY - currentY - 330;

  // Use a fixed small padding so the totals immediately follow the table
  const gap = 20;

  if (remaining < gap) {
    doc.addPage();
    drawHeader(doc);
    await drawPdfFooter(doc, ph - 70);
    currentY = 140;
  }

  currentY += gap;

  // Payment Status & Totals
  const usableW = pw - marginX * 2 - 15;
  const payW = usableW * 0.55;
  const sumW = usableW * 0.45;
  const totX = marginX + payW + 15;
  const boxHeight2 = 105; // Visually taller

  // Payment Status Box
  doc.setFillColor(PDF_COLORS.lightGray[0], PDF_COLORS.lightGray[1], PDF_COLORS.lightGray[2]);
  doc.rect(marginX, currentY + 5, payW, boxHeight2, "F");
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(marginX, currentY + 5, payW, boxHeight2, "S");

  drawRibbon(doc, "PAYMENT STATUS", marginX - 5, currentY, 110, 14, PDF_COLORS.orange);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Status :", marginX + 15, currentY + 45);

  const status = (invoice?.payment_status || "UNPAID").toUpperCase();
  const statusColor =
    status === "PAID" ? [22, 163, 74] : status === "PARTIAL" ? [245, 158, 11] : [220, 38, 38];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.rect(marginX + 60, currentY + 33, 60, 16, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(status, marginX + 90, currentY + 44, { align: "center" });

  if (invoice?.payment_mode || invoice?.payment_method) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text("Mode  :", marginX + 15, currentY + 70);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.payment_mode || invoice.payment_method, marginX + 60, currentY + 70);
  }

  // Totals Box
  doc.setDrawColor(PDF_COLORS.teal[0], PDF_COLORS.teal[1], PDF_COLORS.teal[2]);
  doc.setLineDashPattern([2, 2], 0);
  doc.rect(totX, currentY + 5, sumW, boxHeight2, "S");
  doc.setLineDashPattern([], 0);

  drawRibbon(doc, "INVOICE SUMMARY", totX - 5, currentY, 120, 14, PDF_COLORS.teal);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const subtotal = invoice?.subtotal || invoice?.total || 0;
  const tax = invoice?.tax_amount || 0;
  const total = invoice?.total || 0;

  doc.text("Subtotal", totX + 15, currentY + 40);
  doc.text(inrPrecise(subtotal), totX + sumW - 15, currentY + 40, { align: "right" });

  doc.text("GST / Taxes", totX + 15, currentY + 60);
  doc.text(inrPrecise(tax), totX + sumW - 15, currentY + 60, { align: "right" });

  doc.setDrawColor(200, 200, 200);
  doc.line(totX + 10, currentY + 75, totX + sumW - 10, currentY + 75);

  doc.setTextColor(PDF_COLORS.teal[0], PDF_COLORS.teal[1], PDF_COLORS.teal[2]);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL", totX + 15, currentY + 93);
  doc.text(inrPrecise(total), totX + sumW - 15, currentY + 93, { align: "right" });
  doc.setFont("helvetica", "normal");

  currentY += boxHeight2 + gap;

  // Row 2: Terms (Full Width, 2 Columns)
  const fullW = pw - marginX * 2;
  const termsH = 65;
  doc.setFillColor(253, 242, 233);
  doc.rect(marginX, currentY + 5, fullW, termsH, "F");

  drawRibbon(doc, "TERMS & CONDITIONS", marginX - 5, currentY, 130, 14, PDF_COLORS.orange);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const terms = shop?.terms?.length
    ? shop.terms
    : [
        "Goods once sold will not be taken back.",
        "Warranty applies only to the specified parts.",
        "Data backup is customer's responsibility.",
        "Physical damage voids warranty.",
      ];

  const col1 = terms.slice(0, 2);
  const col2 = terms.slice(2, 4);

  col1.forEach((t: string, i: number) => {
    const row = i * 17;
    doc.addImage(checkIcon, "PNG", marginX + 15, currentY + 25 + row, 12, 12);
    const splitText = doc.splitTextToSize(t, fullW / 2 - 40);
    doc.text(splitText, marginX + 35, currentY + 34 + row);
  });

  col2.forEach((t: string, i: number) => {
    const row = i * 17;
    doc.addImage(checkIcon, "PNG", marginX + fullW / 2 + 15, currentY + 25 + row, 12, 12);
    const splitText = doc.splitTextToSize(t, fullW / 2 - 40);
    doc.text(splitText, marginX + fullW / 2 + 35, currentY + 34 + row);
  });

  currentY += termsH + gap;

  // Row 3: Thanks (Left) | Signature (Right)
  const halfW = (fullW - 15) / 2;
  const row3RightX = marginX + halfW + 15;
  const sigBoxH = 120; // Increased height for usable signature

  // Left: Thanks
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(marginX, currentY + 5, halfW, sigBoxH, "S");

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for your business!", marginX + 15, currentY + 35);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(PDF_COLORS.teal[0], PDF_COLORS.teal[1], PDF_COLORS.teal[2]);
  doc.text("RK", marginX + 15, currentY + 65);
  doc.setTextColor(PDF_COLORS.orange[0], PDF_COLORS.orange[1], PDF_COLORS.orange[2]);
  doc.text("REPAIR LABS", marginX + 45, currentY + 65);

  // Quality badge (Left Box)
  doc.setFillColor(PDF_COLORS.teal[0], PDF_COLORS.teal[1], PDF_COLORS.teal[2]);
  doc.rect(marginX + halfW - 55, currentY + 12, 45, 45, "F");
  doc.triangle(
    marginX + halfW - 55,
    currentY + 57,
    marginX + halfW - 32.5,
    currentY + 70,
    marginX + halfW - 10,
    currentY + 57,
    "F",
  );
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("QUALITY", marginX + halfW - 32.5, currentY + 44, { align: "center" });
  doc.text("ASSURED", marginX + halfW - 32.5, currentY + 52, { align: "center" });
  doc.addImage(checkWhiteIcon, "PNG", marginX + halfW - 40.5, currentY + 17, 16, 16);

  // Right: Signature
  doc.setDrawColor(200, 200, 200);
  doc.rect(row3RightX, currentY + 5, halfW, sigBoxH, "S");

  // Pen Icon centered
  doc.addImage(penIcon, "PNG", row3RightX + halfW / 2 - 12, currentY + 25, 24, 24);

  // Signature line
  doc.setDrawColor(100, 100, 100);
  doc.line(row3RightX + 30, currentY + 95, row3RightX + halfW - 30, currentY + 95);

  doc.setFontSize(9);
  doc.setTextColor(PDF_COLORS.teal[0], PDF_COLORS.teal[1], PDF_COLORS.teal[2]);
  doc.setFont("helvetica", "bold");
  doc.text("AUTHORIZED SIGNATORY", row3RightX + halfW / 2, currentY + 110, { align: "center" });

  currentY += sigBoxH + gap;

  // Footer flows naturally directly after the content
  if (ph - currentY < 55) {
    doc.addPage();
    drawHeader(doc);
    currentY = 175;
  }

  await drawPdfFooter(doc, currentY);

  return doc;
}
