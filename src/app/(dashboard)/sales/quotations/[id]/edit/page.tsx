import { db } from "@/db";
import { customers, items, salesQuotations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { QuotationForm } from "@/components/sales/quotation-form";
import GradientHeader from "@/components/ui/gradient-header";
import { FileText } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditQuotationPage({ params }: { params: { id: string } }) {
  const companyId = "00000000-0000-0000-0000-000000000000";

   const quotation = await db.query.salesQuotations.findFirst({
      where: eq(salesQuotations.id, params.id),
      with: {
          lines: true
      }
  });

  if (!quotation) notFound();

  const customerList = await db.query.customers.findMany({
    where: eq(customers.companyId, companyId),
    columns: { id: true, name: true }
  });

  const itemList = await db.query.items.findMany({
    where: eq(items.companyId, companyId),
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
        title={`Edit Quotation: ${quotation.quotationNumber}`}
        description="Modify sales quotation details"
        icon={FileText}
      />
      <QuotationForm 
        customers={customerList} 
        items={itemList} 
        initialData={quotation}
      />
    </div>
  );
}
