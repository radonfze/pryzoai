import { db } from "@/db";
import { salesInvoices, purchaseOrders, items, customers } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  Zap,
  ArrowUpRight,
  BarChart3,
  Wallet,
  Activity
} from "lucide-react";
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
      title: "Total Revenue",
      value: "AED 0",
      change: "+0%",
      icon: DollarSign,
      href: "/sales/invoices",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      title: "Sales Invoices",
      value: invoiceCount?.count ?? 0,
      change: "+12%",
      icon: TrendingUp,
      href: "/sales/invoices",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      title: "Purchase Orders",
      value: poCount?.count ?? 0,
      change: "+8%",
      icon: ShoppingCart,
      href: "/procurement/orders",
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      title: "Inventory Items",
      value: itemCount?.count ?? 0,
      change: "+5%",
      icon: Package,
      href: "/inventory/items",
      gradient: "from-emerald-500 to-teal-500",
    },
  ];

  const quickActions = [
    { title: "New Invoice", href: "/sales/invoices/new", icon: DollarSign, color: "bg-violet-500" },
    { title: "New Order", href: "/sales/orders/new", icon: ShoppingCart, color: "bg-pink-500" },
    { title: "Add Customer", href: "/settings/customers/new", icon: Users, color: "bg-cyan-500" },
    { title: "Add Item", href: "/settings/items/new", icon: Package, color: "bg-emerald-500" },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAtMThjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-6 w-6" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Live Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Welcome to PryzoAI</h1>
          <p className="text-white/80 text-lg">Your intelligent ERP system is ready. Here&apos;s your business overview.</p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl scale-150"></div>
            <Activity className="h-32 w-32 text-white/30" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Link key={stat.title} href={stat.href}>
            <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} text-white border-0 hover:scale-105 transition-all duration-300 cursor-pointer`}>
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
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-white/80" />
                  <span className="text-sm text-white/80">{stat.change} from last month</span>
                </div>
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

      {/* Bottom Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Activity Feed */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { text: "System initialized", time: "Just now", color: "bg-green-500" },
                { text: "Database connected", time: "1 min ago", color: "bg-blue-500" },
                { text: "UI deployed", time: "2 min ago", color: "bg-purple-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`h-2 w-2 rounded-full ${item.color}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-500" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Receivables", value: "AED 0.00", color: "text-blue-500" },
                { label: "Payables", value: "AED 0.00", color: "text-rose-500" },
                { label: "Cash Balance", value: "AED 0.00", color: "text-emerald-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
