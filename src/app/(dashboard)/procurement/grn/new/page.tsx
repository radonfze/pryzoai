import { db } from "@/db";
import { suppliers, items, purchaseOrders } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { GRNForm } from "@/components/procurement/grn-form";
import GradientHeader from "@/components/ui/gradient-header";
import { Truck } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function NewGRNPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const supplierList = await db.query.suppliers.findMany({
    where: and(eq(suppliers.companyId, companyId), eq(suppliers.isActive, true)),
    columns: { id: true, name: true }
  });

  const itemList = await db.query.items.findMany({
    where: and(eq(items.companyId, companyId), eq(items.isActive, true)),
    columns: {
        id: true,
        code: true,
        name: true,
        uom: true
    }
  });

  // Fetch 'Open' Purchase Orders for linking
  // In a real app, you'd filter by status 'confirmed' or 'sent'
  const openPOs = await db.query.purchaseOrders.findMany({
    where: and(
        eq(purchaseOrders.companyId, companyId),
        ne(purchaseOrders.status, 'completed'),
        ne(purchaseOrders.status, 'draft'),
        ne(purchaseOrders.status, 'cancelled')
    ),
    with: {
        lines: true
    }
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="New Goods Receipt Note"
        description="Receive items against a PO or directly"
        icon={Truck}
      />
      <GRNForm 
        suppliers={supplierList} 
        items={itemList} 
        openOrders={openPOs}
      />
    </div>
  );
}
