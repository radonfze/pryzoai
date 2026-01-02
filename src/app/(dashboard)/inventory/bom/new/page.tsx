import { db } from "@/db";
import { items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyIdSafe } from "@/lib/auth";
import { logout } from "@/lib/auth/auth-service";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import GradientHeader from "@/components/ui/gradient-header";
import { FilePlus } from "lucide-react";
import { BomForm } from "@/components/inventory/bom-form";

export default async function NewBomPage() {
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

    // Fetch all active items to populate Parent and Component dropdowns
    const allItems = await db.query.items.findMany({
        where: and(eq(items.companyId, companyId), eq(items.isActive, true)),
        columns: {
            id: true,
            code: true,
            name: true,
            uom: true,
        }
    });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="Create New BOM"
        description="Define a new Bill of Materials recipe."
        icon={FilePlus}
      />
      <BomForm items={allItems} />
    </div>
  );
}
