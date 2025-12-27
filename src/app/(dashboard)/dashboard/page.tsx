import { db } from "@/db";
import { salesInvoices, purchaseOrders, items, customers } from "@/db/schema";
import { eq, count, sql, and, ne, gte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  // Get quick stats
  const [invoiceCount] = await db
    .select({ count: count() })
    .from(salesInvoices)
    .where(eq(salesInvoices.companyId, companyId));

  const [poCount] = await db
    .select({ count: count() })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.companyId, companyId));

  const [itemCount] = await db
    .select({ count: count() })
    .from(items)
    .where(eq(items.companyId, companyId));

  const [customerCount] = await db
    .select({ count: count() })
    .from(customers)
    .where(eq(customers.companyId, companyId));

  const stats = [
    {
      title: "Total Invoices",
      value: invoiceCount?.count ?? 0,
      icon: DollarSign,
      href: "/sales/invoices",
    },
    {
      title: "Purchase Orders",
      value: poCount?.count ?? 0,
      icon: ShoppingCart,
      href: "/procurement/orders",
    },
    {
      title: "Inventory Items",
      value: itemCount?.count ?? 0,
      icon: Package,
      href: "/inventory/items",
    },
    {
      title: "Customers",
      value: customerCount?.count ?? 0,
      icon: Users,
      href: "/sales",
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/sales/invoices/new" className="block p-2 hover:bg-muted rounded-md transition-colors">
              + Create Invoice
            </Link>
            <Link href="/procurement/orders/new" className="block p-2 hover:bg-muted rounded-md transition-colors">
              + Create Purchase Order
            </Link>
            <Link href="/inventory/adjustments/new" className="block p-2 hover:bg-muted rounded-md transition-colors">
              + Stock Adjustment
            </Link>
            <Link href="/finance/journals/new" className="block p-2 hover:bg-muted rounded-md transition-colors">
              + Journal Entry
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Welcome to PryzoAI ERP! To get started:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Set up your Chart of Accounts</li>
              <li>Add Customers and Suppliers</li>
              <li>Create Inventory Items</li>
              <li>Set up Warehouses</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>Database Connected</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>API Services Online</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
