import { db } from "@/db";
import { purchaseOrders } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart, Clock, CheckCircle2 } from "lucide-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
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

  // Stats
  let statsData = { total: 0, pending: 0, completed: 0 };
  try {
    const statsResult = await db.select({ status: purchaseOrders.status, count: count() })
        .from(purchaseOrders)
        .where(eq(purchaseOrders.companyId, companyId))
        .groupBy(purchaseOrders.status);
    
    statsData = statsResult.reduce((acc, curr) => {
        acc.total += curr.count;
        if (curr.status === 'draft' || curr.status === 'sent') acc.pending += curr.count;
        if (curr.status === 'completed' || curr.status === 'received') acc.completed += curr.count;
        return acc;
    }, { total: 0, pending: 0, completed: 0 });
  } catch(e) {}

  const orderStats: any[] = [
      { title: "Total Purchase Orders", value: statsData.total, icon: ShoppingCart, color: "text-blue-500" },
      { title: "Pending Receipt", value: statsData.pending, icon: Clock, description: "Not received yet", color: "text-orange-500" },
      { title: "Completed", value: statsData.completed, icon: CheckCircle2, description: "Received & Billed", color: "text-green-500" }
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Purchase Orders"
        description="Create and track purchase orders from suppliers"
        icon={ShoppingCart}
      />
      
      <StatsCards stats={orderStats} className="grid-cols-3" />

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
