import { db } from "@/db";
import { salesInvoices, salesLines, customers, items, taxes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { FileText } from "lucide-react";
import { InvoiceForm } from "@/components/sales/invoice-form";

export const dynamic = 'force-dynamic';

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const invoice = await db.query.salesInvoices.findFirst({
    where: eq(salesInvoices.id, params.id),
    with: {
      lines: true,
      customer: true
    }
  });

  if (!invoice) notFound();

  const customersList = await db.query.customers.findMany({
    where: eq(customers.companyId, companyId),
    columns: { id: true, name: true, code: true }
  });

  const itemsList = await db.query.items.findMany({
    where: eq(items.companyId, companyId),
    columns: { id: true, name: true, code: true, sellingPrice: true, uom: true }
  });

  const taxesList = await db.query.taxes.findMany({
    where: eq(taxes.companyId, companyId),
    columns: { id: true, name: true, rate: true }
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title={`Edit Invoice: ${invoice.invoiceNumber}`}
        description="Modify invoice details and line items"
        icon={FileText}
      />

      <InvoiceForm
        customers={customersList}
        items={itemsList}
        taxes={taxesList}
        initialData={{
          ...invoice,
          lines: invoice.lines.map((l: any) => ({
            itemId: l.itemId,
            quantity: Number(l.quantity),
            unitPrice: Number(l.unitPrice),
            discountPercent: Number(l.discountPercent || 0),
            taxId: l.taxId || "",
            description: l.description
          }))
        }}
      />
    </div>
  );
}
