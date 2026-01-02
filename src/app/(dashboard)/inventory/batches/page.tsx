import { db } from "@/db";
import { getCompanyIdSafe } from "@/lib/auth";
import { stockBatches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Package, Boxes } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

export const dynamic = 'force-dynamic';

export default async function BatchesPage() {
  const companyId = await getCompanyIdSafe();
  if (!companyId) return null;

  const data = await db.query.stockBatches.findMany({
    where: eq(stockBatches.companyId, companyId),
    with: {
      item: true,
      warehouse: true,
    },
    orderBy: [desc(stockBatches.createdAt)],
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="Stock Batches"
        description="View and manage batch/lot tracking for inventory items"
        icon={Boxes}
      />

      <DataTable 
        columns={columns} 
        data={data} 
        searchKey="batchNumber"
        placeholder="Search by batch number..."
      />
    </div>
  );
}
