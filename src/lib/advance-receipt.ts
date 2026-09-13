import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDateTime, inrPdf } from "@/lib/format";
import { drawPdfHeader, drawPdfFooter, getStandardTableStyles } from "./pdf-template";

export type AdvanceReceiptInput = {
  shop: any;
  ticket_no: string;
  created_at: string;
  customer: any;
  device: any;
  issue: string;
  estimated_cost: number;
  advance_amount: number;
  payment_mode?: string | null;
};

export async function buildAdvanceReceiptPdf(input: AdvanceReceiptInput) {
  const { ticket_no, created_at, customer, device, issue, estimated_cost, advance_amount, payment_mode } = input;
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pw = 595.28;
  const marginX = 24;

  await drawPdfHeader(doc, "ADVANCE RECEIPT", ticket_no, "TICKET NO.");

  let currentY = 175;

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    ...getStandardTableStyles(),
    head: [["Customer Details", "Device Details"]],
    body: [
      [
        `Name: ${customer?.name || "—"}\nPhone: ${customer?.phone || "—"}\nAddress: ${customer?.address || "—"}`,
        `Device: ${[device?.brand, device?.model].filter(Boolean).join(" ") || device?.type || "—"}\nIMEI: ${device?.imei || "—"}\nIssue: ${issue || "—"}`
      ],
    ],
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 20;

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    ...getStandardTableStyles(),
    head: [["Description", "Amount"]],
    body: [
      ["Estimated Total Cost", inrPdf(estimated_cost)],
      ["Advance Received", inrPdf(advance_amount)],
      ["Payment Mode", payment_mode || "—"],
      ["Balance Due", inrPdf(Math.max(0, estimated_cost - advance_amount))],
    ],
  });

  await drawPdfFooter(doc, 750);
  return doc;
}
