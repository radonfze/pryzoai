import GradientHeader from "@/components/ui/gradient-header";
import { FileText } from "lucide-react";
import { db } from "@/db";
import { items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PurchaseRequestForm } from "@/components/procurement/purchase-request-form";

export const dynamic = 'force-dynamic';

export default async function NewRequestPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const itemList = await db.query.items.findMany({
    where: eq(items.companyId, companyId),
    columns: { id: true, name: true, code: true, uom: true }
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="New Purchase Request"
        description="Create a new purchase requisition"
        icon={FileText}
      />
      <PurchaseRequestForm items={itemList} />
    </div>
  );
}
