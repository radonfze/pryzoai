import { db } from "@/db";
import { salesInvoices, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateInvoicePdf, InvoiceData } from "@/lib/documents/pdf-generator";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 15: params is a promise
) {
  const invoiceId = (await params).id;

  // 1. Fetch Invoice with lines (not items) and customer
  const invoice = await db.query.salesInvoices.findFirst({
    where: eq(salesInvoices.id, invoiceId),
    with: {
      customer: true,
      // Schema uses 'lines' not 'items'
      lines: {
          with: {
              item: true
          }
      }
      // Note: salesInvoices doesn't have direct 'company' relation in schema
    }
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Fetch company separately using companyId
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, invoice.companyId)
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Read Logo File
  let logoBase64: string | undefined;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-full.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    }
  } catch (error) {
    console.error("Error reading logo file:", error);
  }

  // 2. Shape Data
  const pdfData: InvoiceData = {
    company: {
      name: company.name,
      trn: company.taxId || "N/A",
      address: company.address || "Dubai, UAE",
      logo: logoBase64
    },
    customer: {
      name: invoice.customer.name,
      trn: invoice.customer.taxId,
      address: invoice.customer.address || ""
    },
    invoice: {
      number: invoice.invoiceNumber,
      date: new Date(invoice.invoiceDate),
      dueDate: new Date(invoice.dueDate),
      currency: invoice.currencyId || "AED",
      status: invoice.status
    },
    // Use lines instead of items
    items: invoice.lines.map(line => ({
      description: line.item?.name || line.description || 'Item',
      quantity: Number(line.quantity || 0),
      uom: line.uom || 'EA',
      unitPrice: Number(line.unitPrice || 0),
      // salesLines uses taxAmount, not taxPercent
      vatPercent: 5, // Default VAT, schema doesn't have taxPercent per line
      vatAmount: Number(line.taxAmount || 0),
      // Schema uses lineTotal not totalAmount
      total: Number(line.lineTotal || 0)
    })),
    totals: {
      // Schema uses subtotal, discountAmount, taxAmount - not subTotal, totalDiscount, totalTax
      subtotal: Number(invoice.subtotal || 0),
      discount: Number(invoice.discountAmount || 0),
      vatTotal: Number(invoice.taxAmount || 0),
      grandTotal: Number(invoice.totalAmount)
    }
  };

  // 3. Generate PDF
  try {
    const pdfBuffer = await generateInvoicePdf(pdfData);
    
    // 4. Return as Stream
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
      status: 200
    });
  } catch (err: any) {
    console.error("PDF Generation Error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: err.message, stack: err.stack }, 
      { status: 500 }
    );
  }
}
