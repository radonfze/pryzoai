import { db } from "@/db";
import { customers, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { QuotationForm } from "@/components/sales/quotation-form";
import GradientHeader from "@/components/ui/gradient-header";
import { FileText } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function NewQuotationPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const customerList = await db.query.customers.findMany({
    where: eq(customers.companyId, companyId),
    columns: { id: true, name: true }
  });

  const itemList = await db.query.items.findMany({
    where: eq(items.companyId, companyId),
    with: {
        units: true
    },
    columns: {
        id: true,
        code: true,
        name: true,
        sellingPrice: true,
        uom: true,
        costPrice: true
    }
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="New Quotation"
        description="Create a new sales estimate"
        icon={FileText}
      />
      <QuotationForm customers={customerList} items={itemList} />
    </div>
  );
}
