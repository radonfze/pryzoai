import { db } from "@/db";
import { salesInvoices, purchaseBills, customers, suppliers } from "@/db/schema";
import { sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ShoppingCart
} from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 1. Fetch Key Metrics
  const [revenueData] = await db
    .select({
      totalSales: sql<number>`sum(${salesInvoices.totalAmount})`,
      count: sql<number>`count(*)`
    })
    .from(salesInvoices)
    .where(sql`${salesInvoices.companyId} = ${DEMO_COMPANY_ID}`);

  const [purchaseData] = await db
    .select({
      totalPurchases: sql<number>`sum(${purchaseBills.totalAmount})`,
    })
    .from(purchaseBills)
    .where(sql`${purchaseBills.companyId} = ${DEMO_COMPANY_ID}`);

  const [customerCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .where(sql`${customers.companyId} = ${DEMO_COMPANY_ID}`);

  // Fetch recent sales
  const recentSales = await db.query.salesInvoices.findMany({
    where: (sales, { eq }) => eq(sales.companyId, DEMO_COMPANY_ID),
    orderBy: (sales, { desc }) => [desc(sales.createdAt)],
    limit: 5,
    with: {
        customer: true
    }
  });

  const totalRevenue = Number(revenueData?.totalSales || 0);
  const totalExpenses = Number(purchaseData?.totalPurchases || 0);
  const netProfit = totalRevenue - totalExpenses;

  // Formatting helper
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(amount);

  return (
    <div className="flex-1 space-y-6 p-4 pt-0">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/sales/invoices/new">New Invoice</Link>
          </Button>
          <Button variant="outline" asChild>
             <Link href="/finance/reports">Download Report</Link>
          </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
              <span className="text-emerald-500 font-medium">+20.1%</span>
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
               <TrendingDown className="h-3 w-3 text-rose-500 mr-1" />
               <span className="text-rose-500 font-medium">+4.5%</span> 
               <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(netProfit)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Current financial year
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount?.count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +12 since last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Main Chart Area Placeholder */}
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Monthly revenue vs expenses</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-md border border-dashed">
                <p className="text-muted-foreground text-sm">Chart Component Placeholder</p> 
                {/* Integrate Recharts here later */}
             </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest invoices generated</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <ShoppingCart className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium leading-none">{sale.invoiceNumber}</p>
                                <p className="text-xs text-muted-foreground mt-1">{sale.customer?.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-sm font-bold">{formatCurrency(Number(sale.totalAmount))}</p>
                             <p className="text-xs text-muted-foreground">{new Date(sale.invoiceDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
                {recentSales.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-4">No recent sales found</p>
                )}
             </div>
             <div className="pt-4 mt-2">
                 <Button variant="ghost" className="w-full text-xs" asChild>
                    <Link href="/sales/invoices">View All Invoices</Link>
                 </Button>
             </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Links Row */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/inventory/items/new" className="block">
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                        <Package className="h-8 w-8 text-muted-foreground mb-2" />
                        <h3 className="font-semibold">Add Item</h3>
                        <p className="text-xs text-muted-foreground">Create new inventory item</p>
                    </CardContent>
                </Card>
            </Link>
             <Link href="/sales/customers/new" className="block">
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                        <Users className="h-8 w-8 text-muted-foreground mb-2" />
                        <h3 className="font-semibold">Add Customer</h3>
                         <p className="text-xs text-muted-foreground">Register new client</p>
                    </CardContent>
                </Card>
            </Link>
             <Link href="/finance/journals/new" className="block">
                 <Card className="hover:bg-slate-50 transition-colors cursor-pointer border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                        <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                        <h3 className="font-semibold">New Journal</h3>
                         <p className="text-xs text-muted-foreground">Manual GL entry</p>
                    </CardContent>
                </Card>
            </Link>
              <Link href="/settings" className="block">
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                        <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                        <h3 className="font-semibold">Settings</h3>
                         <p className="text-xs text-muted-foreground">System configuration</p>
                    </CardContent>
                </Card>
            </Link>
       </div>

    </div>
  );
}