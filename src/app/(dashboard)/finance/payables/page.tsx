import { db } from "@/db";
import { purchaseInvoices, supplierPayments, suppliers } from "@/db/schema";
import { eq, count, sum, sql, and, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  CreditCard, 
  Users, 
  Clock, 
  CheckCircle,
  Zap,
  TrendingDown,
  Receipt,
  Plus,
  Wallet
} from "lucide-react";

export const dynamic = 'force-dynamic';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export default async function PayablesPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  // Outstanding payables
  const [outstandingResult] = await db
    .select({ total: sum(purchaseInvoices.balanceAmount) })
    .from(purchaseInvoices)
    .where(and(
      eq(purchaseInvoices.companyId, companyId),
      sql`COALESCE(${purchaseInvoices.balanceAmount}, 0) > 0`
    ));

  // Total paid
  const [paidResult] = await db
    .select({ total: sum(supplierPayments.amount) })
    .from(supplierPayments)
    .where(eq(supplierPayments.companyId, companyId));

  // Payments count
  const [paymentsCountResult] = await db
    .select({ count: count() })
    .from(supplierPayments)
    .where(eq(supplierPayments.companyId, companyId));

  // Recent payments
  const recentPayments = await db
    .select({
      id: supplierPayments.id,
      paymentNumber: supplierPayments.paymentNumber,
      amount: supplierPayments.amount,
      paymentDate: supplierPayments.paymentDate,
      status: supplierPayments.status,
    })
    .from(supplierPayments)
    .where(eq(supplierPayments.companyId, companyId))
    .orderBy(desc(supplierPayments.createdAt))
    .limit(5);

  const stats = [
    {
      title: "Outstanding Payables",
      value: formatCurrency(Number(outstandingResult?.total) || 0),
      subtitle: "To be paid",
      icon: Clock,
      gradient: "from-rose-500 to-pink-500",
      alert: Number(outstandingResult?.total || 0) > 0,
    },
    {
      title: "Total Paid",
      value: formatCurrency(Number(paidResult?.total) || 0),
      subtitle: "All time",
      icon: CreditCard,
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      title: "Payments",
      value: paymentsCountResult?.count ?? 0,
      subtitle: "Total transactions",
      icon: Wallet,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: "Cash Flow",
      value: "Track",
      subtitle: "Monitor outflows",
      icon: TrendingDown,
      gradient: "from-slate-500 to-slate-700",
    },
  ];

  const quickActions = [
    { title: "Make Payment", href: "/finance/payables/payments/new", icon: Plus, color: "bg-blue-500" },
    { title: "View Payments", href: "/finance/payables/payments", icon: Wallet, color: "bg-violet-500" },
    { title: "Advances", href: "/finance/payables/advances", icon: CreditCard, color: "bg-emerald-500" },
    { title: "Supplier Statements", href: "/procurement/reports/supplier-statement", icon: Users, color: "bg-pink-500" },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white">
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-6 w-6" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Accounts Payable</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Payables Dashboard</h1>
          <p className="text-white/80 text-lg">Manage supplier payments, advances, and outstanding bills</p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
          <Wallet className="h-32 w-32 text-white/20" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} text-white border-0 ${stat.alert ? 'ring-2 ring-rose-300 ring-offset-2' : ''}`}>
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

      {/* Recent Payments */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-500" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPayments.length > 0 ? (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <Link key={payment.id} href={`/finance/payables/payments/${payment.id}`}>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800 hover:shadow-md transition-all cursor-pointer">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-white shadow ${payment.status === 'posted' ? 'text-blue-500' : 'text-amber-500'}`}>
                      {payment.status === 'posted' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{payment.paymentNumber || 'Draft'}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-blue-600">
                      {formatCurrency(Number(payment.amount) || 0)}
                    </span>
                  </div>
                </Link>
              ))}
              <Link href="/finance/payables/payments">
                <Button variant="outline" className="w-full mt-2">
                  View All Payments
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No payments yet</p>
              <Link href="/finance/payables/payments/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Make First Payment
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
