import { db } from "@/db";
import { salesOrders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from "lucide-react";
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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Sales Orders"
        description="Manage customer orders and track fulfillment"
        icon={ShoppingCart}
      />
      
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
