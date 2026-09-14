import jsPDF from "jspdf";
import { getIconDataUrl } from "./pdf-icons";
import { MapPin, Phone, Globe } from "lucide-react";
import React from "react";

export const PDF_COLORS = {
  teal: [0, 138, 154] as [number, number, number],
  orange: [244, 122, 33] as [number, number, number],
  darkBg: [17, 24, 39] as [number, number, number],
  lightGray: [241, 245, 249] as [number, number, number],
};

export async function getLogoDataUrl() {
  const response = await fetch('/assets/rk-repair-labs-logo.png');
  const blob = await response.blob();
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function drawPdfHeader(doc: jsPDF, title: string, identifierText?: string, identifierLabel?: string) {
  const pw = 595.28;
  const marginX = 24;
  
  const logoDataUrl = await getLogoDataUrl();
  
  const { teal, orange, darkBg } = PDF_COLORS;

  // 1. Left background block
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(0, 0, 170, 170, "F");
  doc.triangle(170, 0, 240, 0, 170, 170, "F");

  // 2. Logo
  doc.addImage(logoDataUrl, "PNG", 30, 20, 100, 100);

  // 3. Center Branding
  doc.setTextColor(teal[0], teal[1], teal[2]);
  doc.setFontSize(26);
  doc.text("RK", 190, 75);
  doc.setTextColor(orange[0], orange[1], orange[2]);
  doc.text("REPAIR LABS", 235, 75);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.text("Expert hands - Trusted repairs", 190, 95);

  // Services
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text("LAPTOP REPAIR", 190, 120);
  doc.setTextColor(200, 200, 200);
  doc.text("|", 265, 120);
  doc.setTextColor(30, 30, 30);
  doc.text("MOBILE REPAIR", 275, 120);
  doc.setTextColor(200, 200, 200);
  doc.text("|", 345, 120);
  doc.setTextColor(30, 30, 30);
  doc.text("MACBOOK REPAIR", 190, 135);
  doc.setTextColor(200, 200, 200);
  doc.text("|", 275, 135);
  doc.setTextColor(30, 30, 30);
  doc.text("TABLET REPAIR", 285, 135);

  // Right side - Title & Identifier
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), pw - marginX, 40, { align: "right" });

  if (identifierText) {
    doc.setDrawColor(orange[0], orange[1], orange[2]);
    doc.setLineWidth(1.5);
    doc.rect(pw - marginX - 140, 65, 140, 45, "S");

    doc.setFillColor(teal[0], teal[1], teal[2]);
    doc.rect(pw - marginX - 110, 58, 80, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text((identifierLabel || "NO.").toUpperCase(), pw - marginX - 70, 68, { align: "center" });

    doc.setTextColor(orange[0], orange[1], orange[2]);
    doc.setFontSize(18);
    doc.text(identifierText, pw - marginX - 70, 95, { align: "center" });
    doc.setFont("helvetica", "normal");
  }

  // Bottom teal border
  doc.setDrawColor(teal[0], teal[1], teal[2]);
  doc.setLineWidth(3);
  doc.line(marginX, 150, pw - marginX, 150);
}

export async function drawPdfFooter(doc: jsPDF, y: number) {
  const pw = 595.28;
  const marginX = 24;

  const locIcon = await getIconDataUrl(React.createElement(MapPin), "#F47A21", 16);
  const phoneIcon = await getIconDataUrl(React.createElement(Phone), "#008A9A", 16);
  const webIcon = await getIconDataUrl(React.createElement(Globe), "#008A9A", 16);

  // --- Generated timestamp ---
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
  const generatedText = `Generated on: ${dateStr}, ${timeStr.toUpperCase()} IST`;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(generatedText, pw / 2, y - 8, { align: "center" });

  // Thin divider line above footer
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginX, y - 4, pw - marginX, y - 4);

  doc.setFillColor(30, 41, 59);
  doc.rect(marginX, y, pw - marginX * 2, 55, "F");

  // Column 1
  doc.addImage(locIcon, "PNG", marginX + 15, y + 20, 14, 14);
  doc.setTextColor(220, 220, 220);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("14-13, Brindavan Gardens 1st Lane,", marginX + 35, y + 26);
  doc.text("Guntur - 522004, AP, India.", marginX + 35, y + 36);

  // Column 2
  doc.addImage(phoneIcon, "PNG", marginX + 220, y + 20, 14, 14);
  doc.setTextColor(255, 255, 255);
  doc.text("+91 9666984949", marginX + 240, y + 26);
  doc.text("+91 9505225222", marginX + 240, y + 36);

  // Column 3
  doc.addImage(webIcon, "PNG", marginX + 370, y + 20, 14, 14);
  doc.setTextColor(255, 255, 255);
  doc.text("rkrepairlabs.vercel.app", marginX + 390, y + 26);
  doc.setTextColor(150, 150, 150);
  doc.text("Facebook | Instagram | YouTube", marginX + 390, y + 36);
}

export function getStandardTableStyles() {
  const { teal, orange, lightGray } = PDF_COLORS;
  return {
    theme: "striped" as const,
    headStyles: { 
      fillColor: teal, 
      textColor: 255, 
      fontStyle: "bold" as const, 
      fontSize: 10,
      halign: "left" as const,
    },
    bodyStyles: { 
      textColor: 40, 
      fontSize: 9,
      lineColor: [230, 230, 230] as [number, number, number],
      lineWidth: { bottom: 0.5 },
    },
    alternateRowStyles: { 
      fillColor: [250, 252, 253] as [number, number, number] 
    },
    styles: { 
      cellPadding: 10, 
      font: "helvetica", 
      overflow: "linebreak" as const,
    },
    margin: { left: 35, right: 35 },
    tableLineColor: teal,
    tableLineWidth: 1,
  };
}
