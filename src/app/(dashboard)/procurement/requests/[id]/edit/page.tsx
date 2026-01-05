import { db } from "@/db";
import { purchaseRequests, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import GradientHeader from "@/components/ui/gradient-header";
import { FileText } from "lucide-react";
import { PurchaseRequestForm } from "@/components/procurement/purchase-request-form";

export const dynamic = 'force-dynamic';

export default async function EditRequestPage({ params }: { params: { id: string } }) {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const [request, itemList] = await Promise.all([
    db.query.purchaseRequests.findFirst({
      where: eq(purchaseRequests.id, params.id),
      with: {
        lines: true,
      },
    }),
    db.query.items.findMany({
      where: eq(items.companyId, companyId),
      columns: { id: true, name: true, code: true, uom: true }
    })
  ]);

  if (!request) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Edit Purchase Request"
        description={`Editing ${request.requestNumber}`}
        icon={FileText}
      />
      <PurchaseRequestForm items={itemList} initialData={request as any} />
    </div>
  );
}
