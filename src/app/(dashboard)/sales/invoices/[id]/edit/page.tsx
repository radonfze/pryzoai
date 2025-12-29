import { db } from "@/db";
import { salesInvoices, customers, items, taxes, warehouses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/sales/invoice-form";
import { getCompanyId } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const companyId = await getCompanyId();

  if (!companyId) {
    throw new Error("Unauthorized: No active company session");
  }

  const invoice = await db.query.salesInvoices.findFirst({
    where: eq(salesInvoices.id, id),
    with: {
      lines: {
        with: { item: true }
      },
      customer: true
    }
  });

  if (!invoice) notFound();

  // Fetch master data
  const [customersList, itemsList, taxesList, warehousesList] = await Promise.all([
    db.query.customers.findMany({
      where: eq(customers.isActive, true),
      columns: { id: true, name: true, code: true, paymentTermDays: true }
    }),
    db.query.items.findMany({
      where: eq(items.isActive, true),
      columns: { id: true, name: true, code: true, sellingPrice: true, costPrice: true, taxPercent: true }
    }),
    db.query.taxes.findMany({
      where: eq(taxes.companyId, companyId),
      columns: { id: true, name: true, rate: true }
    }),
    db.query.warehouses.findMany({
      where: eq(warehouses.isActive, true),
      columns: { id: true, name: true }
    })
  ]);

  return (
    <div className="flex-1 p-4 md:p-8">
      <InvoiceForm
        customers={customersList}
        items={itemsList}
        warehouses={warehousesList}
        taxes={taxesList}
        initialData={{
          ...invoice,
          invoiceNumber: invoice.invoiceNumber,
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
