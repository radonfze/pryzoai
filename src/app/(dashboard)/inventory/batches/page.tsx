import { db } from "@/db";
import { getCompanyIdSafe } from "@/lib/auth";
import { stockBatches, items } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Layers } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { logout } from "@/lib/auth/auth-service";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function BatchesPage() {
  const companyId = await getCompanyIdSafe();
  if (!companyId) {
      return (
          <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
              <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight">Session Expired</h1>
                  <p className="text-muted-foreground">Your session is invalid. Please log in again.</p>
              </div>
              <form action={async () => {
                  "use server"
                  await logout();
                  redirect("/login");
              }}>
                  <Button variant="default">Return to Login</Button>
              </form>
          </div>
      );
  }

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
