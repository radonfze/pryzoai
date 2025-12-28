import { db } from "@/db";
import { purchaseReturns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Undo2 } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { PurchaseReturnsTable } from "@/components/procurement/purchase-returns-table";

export const dynamic = 'force-dynamic';

export default async function PurchaseReturnsPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const returns = await db.query.purchaseReturns.findMany({
    where: eq(purchaseReturns.companyId, companyId),
    with: { supplier: true },
    orderBy: [desc(purchaseReturns.createdAt)],
    limit: 100
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Purchase Returns"
        description="Manage supplier returns and debit notes"
        icon={Undo2}
      />

      <div className="flex justify-end">
        <Link href="/procurement/returns/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Return</Button>
        </Link>
      </div>

      <PurchaseReturnsTable returns={returns} />
    </div>
  );
}
