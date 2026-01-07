import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { generateUaeQrCode } from "../compliance/uae-tax";
import { format } from "date-fns";

// Add autotable typings to jsPDF
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

export interface InvoiceData {
  company: {
    name: string;
    trn: string; // Tax Registration Number
    address: string;
    logo?: string; // Base64
  };
  customer: {
    name: string; // English
    nameAr?: string; // Arabic
    trn?: string;
    address: string;
  };
  invoice: {
    number: string;
    date: Date;
    dueDate?: Date;
    currency: string;
    status: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    vatPercent: number;
    vatAmount: number;
    total: number; // Including VAT
  }>;
  totals: {
    subtotal: number;
    discount: number;
    vatTotal: number;
    grandTotal: number;
  };
}

/**
 * Generates a UAE-Compliant Tax Invoice PDF
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<ArrayBuffer> {
  // 1. Initialize PDF (A4 Portrait)
  const doc = new jsPDF() as JsPDFWithAutoTable;
  
  // Fonts - standard fonts handle basic latin. For Arabic, specialized fonts needed.
  // For MVP, we presume English content primarily or use standard fonts.
  // Real-world: Load a font that supports Arabic (e.g. Amiri)
  
  // 2. Header & Logo
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // Render Logo if available
  if (data.company.logo) {
    try {
      const imgProps = doc.getImageProperties(data.company.logo);
      const logoWidth = 30; // mm
      const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
      
      doc.addImage(data.company.logo, "PNG", 14, yPos, logoWidth, logoHeight);
      
      // Adjust yPos for text below logo or keep side-by-side
      // For now, let's put text to the right of logo or below.
      // Standard header often has Logo Left, Text Right, or Text Below.
      // Let's shift text start Y if we want text below, but here let's keep text layout 
      // and maybe move text slightly down or right if needed.
      // But current text positioning code uses hardcoded 14 x yPos.
      // Let's place logo at top left (14, 10) and move text down.
      
      // Actually, let's just place logo at top-left 14, 15
      // And move the Company Name text down or to the right. 
      // Let's move text down to yPos + logoHeight + 5
      
      doc.addImage(data.company.logo, "PNG", 14, 10, logoWidth, logoHeight);
      yPos = 10 + logoHeight + 5;
      
    } catch (e) {
      console.warn("Failed to add logo to PDF", e);
    }
  }

  // Company Name
  doc.setFontSize(18);
  doc.text(data.company.name, 14, yPos);
  
  // TAX INVOICE Label (Required)
  doc.setFontSize(16);
  doc.text("TAX INVOICE", pageWidth - 14, yPos, { align: "right" });
  
  yPos += 8;
  doc.setFontSize(10);
  doc.text(`TRN: ${data.company.trn}`, 14, yPos);
  doc.text(data.company.address, 14, yPos + 5, { maxWidth: 80 });

  // 3. Invoice Details
  yPos = 50;
  
  // Left side: Customer
  doc.setFontSize(11);
  doc.text("Bill To:", 14, yPos);
  doc.setFontSize(10);
  doc.text(data.customer.name, 14, yPos + 6);
  if (data.customer.trn) doc.text(`TRN: ${data.customer.trn}`, 14, yPos + 11);
  doc.text(data.customer.address, 14, yPos + 16, { maxWidth: 80 });

  // Right side: Invoice Info
  doc.text(`Invoice #: ${data.invoice.number}`, pageWidth - 14, yPos, { align: "right" });
  doc.text(`Date: ${format(data.invoice.date, "dd-MMM-yyyy")}`, pageWidth - 14, yPos + 5, { align: "right" });
  if (data.invoice.dueDate) {
    doc.text(`Due Date: ${format(data.invoice.dueDate, "dd-MMM-yyyy")}`, pageWidth - 14, yPos + 10, { align: "right" });
  }

  // 4. Generate & Embed QR Code (TLV)
  // Requirement: Seller Name, VAT No, Date, Total, VAT Total
  const tlvString = generateUaeQrCode({
    sellerName: data.company.name,
    vatRegistrationNumber: data.company.trn,
    timestamp: data.invoice.date.toISOString(),
    invoiceTotal: data.totals.grandTotal.toFixed(2),
    vatTotal: data.totals.vatTotal.toFixed(2),
  });

  // Use QRCode.create to get raw modules (avoids canvas dependency)
  const qr = QRCode.create(tlvString, { errorCorrectionLevel: 'M' });
  const modules = qr.modules; // QRCode structure
  const moduleCount = modules.size;
  const qrSize = 25; // mm
  const cellSize = qrSize / moduleCount;
  const qrX = pageWidth - 40;
  const qrY = yPos + 20;

  // Draw black squares for '1' modules
  doc.setFillColor(0, 0, 0); // Black
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      // Access flat data array (1 = dark, 0 = light)
      if (modules.data[r * moduleCount + c]) {
        doc.rect(qrX + c * cellSize, qrY + r * cellSize, cellSize, cellSize, "F");
      }
    }
  }

  // 5. Items Table
  const tableBody = data.items.length > 0 
    ? data.items.map((item) => [
        item.description || 'N/A',
        String(item.quantity || 0),
        item.uom || 'EA',
        (item.unitPrice || 0).toFixed(2),
        `${item.vatPercent || 5}%`,
        (item.vatAmount || 0).toFixed(2),
        (item.total || 0).toFixed(2),
      ])
    : [['No items', '-', '-', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: yPos + 50,
    head: [["Description", "Qty", "UOM", "Price", "VAT %", "VAT", "Total"]],
    body: tableBody,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] }, // Corporate Blue
    styles: { fontSize: 9 },
  });

  // 6. Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  const rightMargin = pageWidth - 14;
  
  doc.text(`Subtotal: ${data.totals.subtotal.toFixed(2)}`, rightMargin, finalY, { align: "right" });
  doc.text(`VAT (${data.items[0]?.vatPercent || 5}%): ${data.totals.vatTotal.toFixed(2)}`, rightMargin, finalY + 5, { align: "right" });
  
  doc.setFontSize(12);
  doc.text(`Grand Total (${data.invoice.currency}): ${data.totals.grandTotal.toFixed(2)}`, rightMargin, finalY + 12, { align: "right" });

  // 7. Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text("Generated by PryzoAI ERP", 14, pageHeight - 10);

  return doc.output("arraybuffer");
}
