import { GradientHeader } from "@/components/ui/gradient-header";
import { ClipboardList } from "lucide-react";
import { StockCountGenerator } from "@/components/inventory/stock-count-generator";
import { db } from "@/db";
import { getCompanyIdSafe } from "@/lib/auth";
import { warehouses, itemCategories, itemBrands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logout } from "@/lib/auth/auth-service";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function NewStockCountPage() {
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

    // Fetch dependencies
    const warehouseData = await db.query.warehouses.findMany({
        where: eq(warehouses.companyId, companyId),
        columns: { id: true, name: true }
    });

    const categoriesRaw = await db.query.itemCategories.findMany({
         where: eq(itemCategories.companyId, companyId),
         columns: { id: true, name: true }
    });

    const brandsRaw = await db.query.itemBrands.findMany({
         where: eq(itemBrands.companyId, companyId),
         columns: { id: true, name: true }
    });
    
    const categories = JSON.parse(JSON.stringify(categoriesRaw));
    const brands = JSON.parse(JSON.stringify(brandsRaw));

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="New Stock Count"
        description="Initialize a new stock counting session"
        icon={ClipboardList}
      />
      
      <StockCountGenerator 
        warehouses={warehouseData} 
        categories={categories}
        brands={brands}
      />
    </div>
  );
}

