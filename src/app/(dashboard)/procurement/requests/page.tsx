import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { db } from "@/db";
import { purchaseRequests } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { RequestsTable } from "./requests-table";
import { ExportButton } from "@/components/ui/export-button";

export const dynamic = 'force-dynamic';

export default async function PurchaseRequestsPage() {
  const companyId = "00000000-0000-0000-0000-000000000000"; // Demo company

  const requests = await db.query.purchaseRequests.findMany({
    where: eq(purchaseRequests.companyId, companyId),
    orderBy: [desc(purchaseRequests.requestDate)],
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Purchase Requests"
        description="Manage purchase requisitions and approvals"
        icon={FileText}
      />
      
      <div className="flex items-center justify-end gap-2">
         <ExportButton data={requests} filename="Purchase_Requests" />
         <Link href="/procurement/requests/new">
           <Button><Plus className="mr-2 h-4 w-4" /> New Request</Button>
         </Link>
      </div>

      <div className="rounded-md border bg-white">
        <RequestsTable data={requests as any} />
      </div>
    </div>
  );
}
