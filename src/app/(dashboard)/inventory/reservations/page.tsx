import { db } from "@/db";
import { getCompanyIdSafe } from "@/lib/auth";
import { inventoryReservations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Package, Lock } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

export const dynamic = 'force-dynamic';

export default async function ReservationsPage() {
  const companyId = await getCompanyIdSafe();
  if (!companyId) return null;

  const data = await db.query.inventoryReservations.findMany({
    where: eq(inventoryReservations.companyId, companyId),
    with: {
      item: true,
      warehouse: true,
      project: true,
      customer: true,
    },
    orderBy: [desc(inventoryReservations.createdAt)],
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="Stock Reservations"
        description="View and manage inventory reservations across projects and sales orders"
        icon={Lock}
      />

      <DataTable 
        columns={columns} 
        data={data} 
        searchKey="documentNumber"
        placeholder="Search by document number..."
      />
    </div>
  );
}
