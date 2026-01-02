import { db } from "@/db";
import { getCompanyIdSafe } from "@/lib/auth";
import { logout } from "@/lib/auth/auth-service";
import { stockSerials } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Hash } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function SerialsPage() {
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
