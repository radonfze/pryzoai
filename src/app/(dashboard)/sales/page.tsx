import { db } from "@/db";
import { salesInvoices, salesOrders, salesQuotations, customerPayments, customers, salesLines } from "@/db/schema";
import { eq, count, sum, desc, sql, and, gte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  TrendingUp, 
  FileText, 
  ShoppingCart, 
  CreditCard,
  ArrowUpRight,
  Zap,
  BarChart3,
  DollarSign,
  Plus,
  Activity,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Receipt,
  Package,
  Undo2
} from "lucide-react";
import { getCompanyIdSafe } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

// Helper to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export default async function SalesDashboardPage() {
  const companyId = await getCompanyIdSafe();
  
  // Redirect to login if no valid session
  if (!companyId) {
    redirect("/login");
  }
  
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch real stats
  const [totalRevenueResult] = await db
    .select({ 
      total: sum(salesInvoices.grandTotal),
      count: count()
    })
    .from(salesInvoices)
    .where(eq(salesInvoices.companyId, companyId));

  const [invoicesThisMonthResult] = await db
    .select({ count: count() })
    .from(salesInvoices)
    .where(and(
      eq(salesInvoices.companyId, companyId),
      gte(salesInvoices.createdAt, thirtyDaysAgo)
    ));

  const [ordersCountResult] = await db
    .select({ count: count() })
    .from(salesOrders)
    .where(eq(salesOrders.companyId, companyId));

  const [paymentsResult] = await db
    .select({ total: sum(customerPayments.amount) })
    .from(customerPayments)
    .where(eq(customerPayments.companyId, companyId));

  const [outstandingResult] = await db
    .select({ total: sum(salesInvoices.balanceAmount) })
    .from(salesInvoices)
    .where(and(
      eq(salesInvoices.companyId, companyId),
      sql`${salesInvoices.balanceAmount} > 0`
    ));

  const [quotationsResult] = await db
    .select({ count: count() })
    .from(salesQuotations)
    .where(and(
      eq(salesQuotations.companyId, companyId),
      eq(salesQuotations.status, 'draft')
    ));

  // Recent invoices
  const recentInvoices = await db
    .select({
      id: salesInvoices.id,
      invoiceNumber: salesInvoices.invoiceNumber,
      grandTotal: salesInvoices.grandTotal,
      status: salesInvoices.status,
      createdAt: salesInvoices.createdAt,
      customerId: salesInvoices.customerId,
    })
    .from(salesInvoices)
    .where(eq(salesInvoices.companyId, companyId))
    .orderBy(desc(salesInvoices.createdAt))
    .limit(5);

  // Top customers by revenue
  const topCustomers = await db
    .select({
      customerId: salesInvoices.customerId,
      totalRevenue: sum(salesInvoices.grandTotal),
      invoiceCount: count(),
    })
    .from(salesInvoices)
    .where(eq(salesInvoices.companyId, companyId))
    .groupBy(salesInvoices.customerId)
    .orderBy(desc(sum(salesInvoices.grandTotal)))
    .limit(5);

  // Pending orders
  const pendingOrders = await db
    .select({
      id: salesOrders.id,
      orderNumber: salesOrders.orderNumber,
      grandTotal: salesOrders.grandTotal,
      status: salesOrders.status,
      createdAt: salesOrders.createdAt,
    })
    .from(salesOrders)
    .where(and(
      eq(salesOrders.companyId, companyId),
      sql`${salesOrders.status} IN ('draft', 'pending_approval', 'issued')`
    ))
    .orderBy(desc(salesOrders.createdAt))
    .limit(5);

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(Number(totalRevenueResult?.total) || 0),
      subtitle: `${totalRevenueResult?.count ?? 0} invoices`,
      icon: DollarSign,
      href: "/sales/invoices",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      title: "This Month",
      value: invoicesThisMonthResult?.count ?? 0,
      subtitle: "New invoices",
      icon: FileText,
      href: "/sales/invoices",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      title: "Outstanding",
      value: formatCurrency(Number(outstandingResult?.total) || 0),
      subtitle: "Receivables",
      icon: Clock,
      href: "/finance/receivables",
      gradient: "from-amber-500 to-orange-500",
      alert: Number(outstandingResult?.total || 0) > 0,
    },
    {
      title: "Payments",
      value: formatCurrency(Number(paymentsResult?.total) || 0),
      subtitle: "Collected",
      icon: CreditCard,
      href: "/finance/receivables",
      gradient: "from-emerald-500 to-teal-500",
    },
  ];

  const quickActions = [
    { title: "New Invoice", href: "/sales/invoices/new", icon: FileText, color: "bg-violet-500" },
    { title: "New Order", href: "/sales/orders/new", icon: ShoppingCart, color: "bg-pink-500" },
    { title: "New Quote", href: "/sales/quotations/new", icon: Receipt, color: "bg-cyan-500" },
    { title: "Receipt", href: "/finance/receivables/receipts/new", icon: CreditCard, color: "bg-emerald-500" },
    { title: "Customers", href: "/settings/customers", icon: Users, color: "bg-blue-500" },
    { title: "Delivery", href: "/sales/delivery-notes/new", icon: Package, color: "bg-amber-500" },
    { title: "Returns", href: "/sales/returns/new", icon: Undo2, color: "bg-rose-500" },
    { title: "Reports", href: "/sales/reports/customer-statement", icon: BarChart3, color: "bg-indigo-500" },
  ];

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'completed':
      case 'issued':
        return CheckCircle;
      case 'draft':
        return Clock;
      case 'cancelled':
        return AlertCircle;
      default:
        return FileText;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
      case 'issued':
        return "text-emerald-500";
      case 'draft':
        return "text-amber-500";
      case 'cancelled':
        return "text-rose-500";
      default:
        return "text-blue-500";
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-orange-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAtMThjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-6 w-6" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Sales Module</span>
            {(quotationsResult?.count ?? 0) > 0 && (
              <span className="text-sm font-medium bg-amber-400/30 px-3 py-1 rounded-full">
                {quotationsResult?.count} pending quotes
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-2">Sales Dashboard</h1>
          <p className="text-white/80 text-lg">Track revenue, invoices, orders and customer payments</p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl scale-150"></div>
            <BarChart3 className="h-32 w-32 text-white/30" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} text-white border-0 hover:scale-105 transition-all duration-300 cursor-pointer ${stat.alert ? 'ring-2 ring-amber-300 ring-offset-2' : ''}`}>
              <div className="absolute inset-0 bg-black/5"></div>
              <div className="absolute -right-4 -top-4 opacity-20">
                <stat.icon className="h-24 w-24" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-white/90">{stat.title}</CardTitle>
                <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">{stat.value}</div>
                <span className="text-sm text-white/80">{stat.subtitle}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <div className={`${action.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-center">{action.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Invoices */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-pink-500" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length > 0 ? (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => {
                  const StatusIcon = getStatusIcon(invoice.status);
                  return (
                    <Link key={invoice.id} href={`/sales/invoices/${invoice.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800 hover:shadow-md transition-all cursor-pointer">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-white shadow ${getStatusColor(invoice.status)}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{invoice.invoiceNumber || 'Draft'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-violet-600">
                          {formatCurrency(Number(invoice.grandTotal) || 0)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
                <Link href="/sales/invoices">
                  <Button variant="outline" className="w-full mt-2">
                    View All Invoices
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No invoices yet</p>
                <Link href="/sales/invoices/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Create First Invoice
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length > 0 ? (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div key={customer.customerId} className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Customer {customer.customerId?.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">{customer.invoiceCount} invoices</p>
                    </div>
                    <span className="text-sm font-bold text-blue-600">
                      {formatCurrency(Number(customer.totalRevenue) || 0)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No customer data yet</p>
                <Link href="/settings/customers/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Add Customer
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-cyan-500" />
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingOrders.length > 0 ? (
              <div className="space-y-3">
                {pendingOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status);
                  return (
                    <Link key={order.id} href={`/sales/orders/${order.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800 hover:shadow-md transition-all cursor-pointer">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-white shadow ${getStatusColor(order.status)}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{order.orderNumber || 'Draft'}</p>
                          <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                        </div>
                        <span className="text-sm font-bold text-cyan-600">
                          {formatCurrency(Number(order.grandTotal) || 0)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
                <Link href="/sales/orders">
                  <Button variant="outline" className="w-full mt-2">
                    View All Orders
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No pending orders</p>
                <Link href="/sales/orders/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Create Order
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
