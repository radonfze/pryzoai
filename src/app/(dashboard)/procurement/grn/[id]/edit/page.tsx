import { db } from "@/db";
import { suppliers, items, goodsReceipts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { GRNForm } from "@/components/procurement/grn-form";
import GradientHeader from "@/components/ui/gradient-header";
import { Truck } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditGRNPage({ params }: { params: { id: string } }) {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const grn = await db.query.goodsReceipts.findFirst({
      where: eq(goodsReceipts.id, params.id),
      with: {
          lines: true
      }
  });

  if (!grn) notFound();

  const supplierList = await db.query.suppliers.findMany({
    where: eq(suppliers.companyId, companyId),
    columns: { id: true, name: true }
  });

  const itemList = await db.query.items.findMany({
    where: eq(items.companyId, companyId),
    columns: {
        id: true,
        code: true,
        name: true,
        uom: true
    }
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title={`Edit GRN: ${grn.grnNumber}`}
        description="Modify receipt details"
        icon={Truck}
      />
      <GRNForm 
        suppliers={supplierList} 
        items={itemList} 
        initialData={grn}
      />
    </div>
  );
}
