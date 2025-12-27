import { db } from "@/db";
import { suppliers, items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import PurchaseOrderForm from "@/components/procurement/po-form";

export default async function NewPurchaseOrderPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  // Fetch Master Data
  const supplierList = await db.query.suppliers.findMany({
    where: and(eq(suppliers.companyId, companyId), eq(suppliers.isActive, true))
  });
  
  const itemList = await db.query.items.findMany({
    where: and(eq(items.companyId, companyId), eq(items.isActive, true))
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
       <PurchaseOrderForm suppliers={supplierList} items={itemList} />
    </div>
  );
}
