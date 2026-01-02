import { db } from "@/db";
import { getCompanyIdSafe } from "@/lib/auth";
import { stockSerials } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Hash } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

export const dynamic = 'force-dynamic';

export default async function SerialsPage() {
  const companyId = await getCompanyIdSafe();
  if (!companyId) return null;

  const data = await db.query.stockSerials.findMany({
    where: eq(stockSerials.companyId, companyId),
    with: {
      item: true,
      warehouse: true,
    },
    orderBy: [desc(stockSerials.createdAt)],
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="Serial Numbers"
        description="Track individual serial numbers for serialized inventory items"
        icon={Hash}
      />

      <DataTable 
        columns={columns} 
        data={data} 
        searchKey="serialNumber"
        placeholder="Search by serial number..."
      />
    </div>
  );
}
