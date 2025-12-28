import { db } from "@/db";
import { stockTransfers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRightLeft } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

export const dynamic = 'force-dynamic';

export default async function StockTransfersPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  let transfers: any[] = [];
  try {
    transfers = await db.query.stockTransfers.findMany({
      where: eq(stockTransfers.companyId, companyId),
      orderBy: [desc(stockTransfers.createdAt)],
      with: {
        fromWarehouse: true,
        toWarehouse: true,
      },
      limit: 50,
    });
  } catch (e) {
    console.error("Failed to fetch transfers", e);
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="Stock Transfers"
        description="Manage internal inventory movements between warehouses"
        icon={ArrowRightLeft}
      />
      
      <div className="flex items-center justify-end">
        <Link href="/inventory/transfers/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Transfer</Button>
        </Link>
      </div>

      <DataTable 
        columns={columns} 
        data={transfers} 
        searchKey="transferNumber"
        placeholder="Search transfers..." 
      />
    </div>
  );
}
