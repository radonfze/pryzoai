import { db } from "@/db";
import { purchaseReturns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { PackageX } from "lucide-react";
import { PurchaseReturnForm } from "@/components/procurement/purchase-return-form";
import { suppliers, items } from "@/db/schema";

export const dynamic = 'force-dynamic';

export default async function EditReturnPage({ params }: { params: { id: string } }) {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const [returnDoc, supplierList, itemList] = await Promise.all([
    db.query.purchaseReturns.findFirst({
      where: eq(purchaseReturns.id, params.id),
      with: {
        lines: true,
      },
    }),
    db.query.suppliers.findMany({
      where: eq(suppliers.companyId, companyId),
      columns: { id: true, name: true }
    }),
    db.query.items.findMany({
      where: eq(items.companyId, companyId),
      columns: { id: true, name: true, code: true, uom: true }
    })
  ]);

  if (!returnDoc) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Edit Purchase Return"
        description={`Editing ${returnDoc.returnNumber}`}
        icon={PackageX}
      />
      <PurchaseReturnForm 
        suppliers={supplierList} 
        items={itemList} 
        initialData={returnDoc as any} 
      />
    </div>
  );
}
