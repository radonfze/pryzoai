import { db } from "@/db";
import { recurringInvoiceTemplates, customers, items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { RecurringInvoiceForm } from "@/components/sales/recurring-invoice-form";
import GradientHeader from "@/components/ui/gradient-header";
import { Calendar } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditRecurringInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const companyId = "00000000-0000-0000-0000-000000000000";

  const template = await db.query.recurringInvoiceTemplates.findFirst({
      where: and(eq(recurringInvoiceTemplates.id, id), eq(recurringInvoiceTemplates.companyId, companyId)),
      with: {
          lines: true
      }
  });

  if (!template) {
      notFound();
  }

  const customerList = await db.query.customers.findMany({
    where: and(eq(customers.companyId, companyId), eq(customers.isActive, true)),
    columns: { id: true, name: true }
  });

  const itemList = await db.query.items.findMany({
    where: and(eq(items.companyId, companyId), eq(items.isActive, true)),
    columns: {
        id: true,
        code: true,
        name: true,
        sellingPrice: true,
        uom: true
    }
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Edit Recurring Template"
        description={`Edit template: ${template.templateName}`}
        icon={Calendar}
      />
      <RecurringInvoiceForm customers={customerList} items={itemList} initialData={template} />
    </div>
  );
}
