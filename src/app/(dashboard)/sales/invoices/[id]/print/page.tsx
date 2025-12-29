import { db } from "@/db";
import { salesInvoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PrintInvoiceClient } from "./print-client";

export const dynamic = 'force-dynamic';

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;

  const invoice = await db.query.salesInvoices.findFirst({
    where: eq(salesInvoices.id, id),
    with: {
      customer: true,
      lines: {
        with: { item: true }
      }
    }
  });

  if (!invoice) notFound();

  // Transform data for the print client
  const printData = {
    number: invoice.invoiceNumber,
    date: format(new Date(invoice.invoiceDate), "dd-MM-yyyy"),
    dueDate: format(new Date(invoice.dueDate), "dd-MM-yyyy"),
    customer: {
      name: invoice.customer?.name || "N/A",
      address: invoice.customer?.address || "",
      trn: invoice.customer?.taxId || ""
    },
    items: invoice.lines.map(line => ({
      description: line.item?.name || line.description || "Item",
      qty: Number(line.quantity),
      rate: Number(line.unitPrice),
      total: Number(line.lineTotal)
    })),
    subtotal: Number(invoice.subtotal),
    tax: Number(invoice.taxAmount),
    total: Number(invoice.totalAmount)
  };

  return <PrintInvoiceClient invoice={printData} />;
}
