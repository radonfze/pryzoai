import { db } from "@/db";
import { salesOrders } from "@/db/schema";
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
import { ExportButton } from "@/components/ui/export-button";

export const dynamic = 'force-dynamic';

export default async function SalesOrdersPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  
  const userId = session.userId;
  const companyId = session.companyId || "00000000-0000-0000-0000-000000000000";

  let orders: any[] = [];
  try {
    orders = await db.query.salesOrders.findMany({
      where: eq(salesOrders.companyId, companyId),
      orderBy: [desc(salesOrders.createdAt)],
      with: {
        customer: true,
      },
      limit: 50,
    });
  } catch {
    // Table might not exist
  }

  // Create columns with user ID for security dialogs
  const columns = createColumns(userId);

  // Calculate Order Stats
  let statsData = {
    total: 0,
    pending: 0,
    completed: 0
  };

  try {
    const statsResult = await db
      .select({
        status: salesOrders.status,
        count: count(),
      })
      .from(salesOrders)
      .where(eq(salesOrders.companyId, companyId))
      .groupBy(salesOrders.status);

    statsData = statsResult.reduce((acc, curr) => {
      acc.total += curr.count;
      if (curr.status === 'draft' || curr.status === 'pending_approval' || curr.status === 'sent') acc.pending += curr.count;
      if (curr.status === 'completed' || curr.status === 'issued') acc.completed += curr.count;
      return acc;
    }, { total: 0, pending: 0, completed: 0 });

  } catch (err) {
    console.error("Failed to fetch order stats", err);
  }

  const orderStats: any[] = [
    {
      title: "Total Orders",
      value: statsData.total,
      icon: ShoppingCart,
      color: "text-blue-500"
    },
    {
      title: "Active / Pending",
      value: statsData.pending,
      icon: Clock,
      description: "In progress",
      color: "text-orange-500"
    },
    {
      title: "Completed",
      value: statsData.completed,
      icon: CheckCircle2,
      description: "Fulfilled",
      color: "text-green-500"
    }
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Sales Orders"
        description="Manage customer orders and track fulfillment"
        icon={ShoppingCart}
      />
      
      <StatsCards stats={orderStats} className="grid-cols-3" />

      <div className="flex items-center justify-end gap-2">
        <ExportButton data={orders} filename="Sales_Orders" />
        <Link href="/sales/orders/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Sales Order</Button>
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
