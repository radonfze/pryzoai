
import { GradientHeader } from "@/components/ui/gradient-header";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { StockCountList } from "@/components/inventory/stock-count-list";
import { db } from "@/db";
import { stockCounts, warehouses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCompanyIdSafe, getUserPermissions } from "@/lib/auth";
import { logout } from "@/lib/auth/auth-service";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function StockCountPage() {
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

  const data = await db.query.stockCounts.findMany({
      where: eq(stockCounts.companyId, companyId),
      with: {
          warehouse: true,
      },
      orderBy: [desc(stockCounts.createdAt)]
  });

  const permissions = await getUserPermissions();
  const canCreate = permissions.includes("inventory.count.create");

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Stock Count"
        description="Cycle counting and physical inventory"
        icon={ClipboardList}
      >
        {canCreate && (
            <Link href="/inventory/count/new">
            <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Count
            </Button>
            </Link>
        )}
      </GradientHeader>
      
      <StockCountList data={data} permissions={permissions} />
    </div>
  );
}

