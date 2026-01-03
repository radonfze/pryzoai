import { db } from "@/db";
import { purchaseOrders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { createColumns } from "./columns";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function PurchaseOrderListPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  
  const userId = session.userId;
  const companyId = session.companyId || "00000000-0000-0000-0000-000000000000";

  const orders = await db.query.purchaseOrders.findMany({
    where: eq(purchaseOrders.companyId, companyId),
    with: {
        supplier: true
    },
    orderBy: [desc(purchaseOrders.orderDate)]
  });

  // Create columns with user ID for security dialogs
  const columns = createColumns(userId);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Purchase Orders"
        description="Create and track purchase orders from suppliers"
        icon={ShoppingCart}
      />
      
      <div className="flex items-center justify-end">
        <Link href="/procurement/orders/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Order</Button>
        </Link>
      </div>

      <DataTable 
        columns={columns} 
        data={orders} 
        searchKey="orderNumber"
        placeholder="Search orders..." 
      />
    </div>
  );
}
