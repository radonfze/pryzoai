import { db } from "@/db";
import { salesInvoices, companies, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateInvoicePdf, InvoiceData } from "@/lib/documents/pdf-generator";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 15: params is a promise
) {
  const invoiceId = (await params).id;

  // 1. Fetch Invoice
  const invoice = await db.query.salesInvoices.findFirst({
    where: eq(salesInvoices.id, invoiceId),
    with: {
      customer: true,
      items: {
          with: {
              item: true
          }
      },
      company: true
    }
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // 2. Shape Data
  const pdfData: InvoiceData = {
    company: {
      name: invoice.company.name,
      trn: invoice.company.taxId || "N/A",
      address: "Dubai, UAE", // Placeholder or fetch from Company Address
      logo: undefined // Could fetch from URL
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
    items: invoice.items.map(i => ({
      description: i.description || i.item.name,
      quantity: Number(i.quantity),
      uom: i.uom,
      unitPrice: Number(i.unitPrice),
      vatPercent: Number(i.taxRate),
      vatAmount: Number(i.taxAmount),
      total: Number(i.totalAmount)
    })),
    totals: {
      subtotal: Number(invoice.subTotal),
      discount: Number(invoice.totalDiscount),
      vatTotal: Number(invoice.totalTax),
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
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
