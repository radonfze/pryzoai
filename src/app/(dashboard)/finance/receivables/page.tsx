import { db } from "@/db";
import { salesInvoices, customerPayments, customers } from "@/db/schema";
import { eq, count, sum, sql, and, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle,
  ArrowUpRight,
  Zap,
  TrendingUp,
  Receipt,
  Plus,
  AlertCircle
} from "lucide-react";

export const dynamic = 'force-dynamic';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export default async function ReceivablesPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  // Outstanding receivables
  const [outstandingResult] = await db
    .select({ total: sum(salesInvoices.balanceAmount) })
    .from(salesInvoices)
    .where(and(
      eq(salesInvoices.companyId, companyId),
      sql`${salesInvoices.balanceAmount} > 0`
    ));

  // Total collected
  const [collectedResult] = await db
    .select({ total: sum(customerPayments.amount) })
    .from(customerPayments)
    .where(eq(customerPayments.companyId, companyId));

  // Receipts count
  const [receiptsCountResult] = await db
    .select({ count: count() })
    .from(customerPayments)
    .where(eq(customerPayments.companyId, companyId));

  // Customers with balance
  const [customersWithBalanceResult] = await db
    .select({ count: count() })
    .from(salesInvoices)
    .where(and(
      eq(salesInvoices.companyId, companyId),
      sql`${salesInvoices.balanceAmount} > 0`
    ));

  // Recent receipts
  const recentReceipts = await db
    .select({
      id: customerPayments.id,
      receiptNumber: customerPayments.receiptNumber,
      amount: customerPayments.amount,
      paymentDate: customerPayments.paymentDate,
      status: customerPayments.status,
    })
    .from(customerPayments)
    .where(eq(customerPayments.companyId, companyId))
    .orderBy(desc(customerPayments.createdAt))
    .limit(5);

  const stats = [
    {
      title: "Outstanding Receivables",
      value: formatCurrency(Number(outstandingResult?.total) || 0),
      subtitle: "To be collected",
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
      alert: Number(outstandingResult?.total || 0) > 0,
    },
    {
      title: "Total Collected",
      value: formatCurrency(Number(collectedResult?.total) || 0),
      subtitle: "All time",
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      title: "Receipts",
      value: receiptsCountResult?.count ?? 0,
      subtitle: "Total transactions",
      icon: Receipt,
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      title: "Customers with Balance",
      value: customersWithBalanceResult?.count ?? 0,
      subtitle: "Need follow-up",
      icon: Users,
      gradient: "from-rose-500 to-pink-500",
    },
  ];

  const quickActions = [
    { title: "New Receipt", href: "/finance/receivables/receipts/new", icon: Plus, color: "bg-emerald-500" },
    { title: "View Receipts", href: "/finance/receivables/receipts", icon: Receipt, color: "bg-blue-500" },
    { title: "Advances", href: "/finance/receivables/advances", icon: DollarSign, color: "bg-violet-500" },
    { title: "Customer Statements", href: "/sales/reports/customer-statement", icon: Users, color: "bg-pink-500" },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white">
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-6 w-6" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Accounts Receivable</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Receivables Dashboard</h1>
          <p className="text-white/80 text-lg">Track customer payments, advances, and outstanding balances</p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
          <TrendingUp className="h-32 w-32 text-white/20" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} text-white border-0 ${stat.alert ? 'ring-2 ring-amber-300 ring-offset-2' : ''}`}>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <div className={`${action.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-center">{action.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Receipts */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-500" />
            Recent Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentReceipts.length > 0 ? (
            <div className="space-y-3">
              {recentReceipts.map((receipt) => (
                <Link key={receipt.id} href={`/finance/receivables/receipts/${receipt.id}`}>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800 hover:shadow-md transition-all cursor-pointer">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-white shadow ${receipt.status === 'posted' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {receipt.status === 'posted' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{receipt.receiptNumber || 'Draft'}</p>
                      <p className="text-xs text-muted-foreground">
                        {receipt.paymentDate ? new Date(receipt.paymentDate).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCurrency(Number(receipt.amount) || 0)}
                    </span>
                  </div>
                </Link>
              ))}
              <Link href="/finance/receivables/receipts">
                <Button variant="outline" className="w-full mt-2">
                  View All Receipts
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No receipts yet</p>
              <Link href="/finance/receivables/receipts/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Record First Receipt
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
