import { db } from "@/db";
import { salesReturns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Undo2 } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { SalesReturnsTable } from "@/components/sales/sales-returns-table";

export const dynamic = 'force-dynamic';

export default async function SalesReturnsPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const returns = await db.query.salesReturns.findMany({
    where: eq(salesReturns.companyId, companyId),
    with: { customer: true },
    orderBy: [desc(salesReturns.createdAt)],
    limit: 100
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Sales Returns"
        description="Manage customer returns and credit notes"
        icon={Undo2}
      />

      <div className="flex justify-end">
        <Link href="/sales/returns/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Return</Button>
        </Link>
      </div>

      <SalesReturnsTable returns={returns} />
    </div>
  );
}
