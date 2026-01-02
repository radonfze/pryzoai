import { db } from "@/db";
import { items } from "@/db/schema/items";
import { eq, and } from "drizzle-orm";
import { getCompanyIdSafe } from "@/lib/auth";
import BomForm from "@/components/inventory/bom-form";
import GradientHeader from "@/components/ui/gradient-header";
import { FilePlus } from "lucide-react";

export default async function NewBomPage() {
    const companyId = await getCompanyIdSafe();
    if (!companyId) return null;

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
