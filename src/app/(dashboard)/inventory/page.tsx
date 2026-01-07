import { db } from "@/db";
import { items, stockLedger, stockTransactions, stockAdjustments, stockTransfers } from "@/db/schema";
import { eq, count, sum, desc, sql, and, gte, lt } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Package, 
  Boxes, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Zap,
  Activity,
  Warehouse,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  ClipboardList,
  BarChart3,
  PackageCheck
} from "lucide-react";

export const dynamic = 'force-dynamic';

// Helper to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export default async function InventoryDashboardPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch real stats
  const [itemCountResult] = await db
    .select({ count: count() })
    .from(items)
    .where(eq(items.companyId, companyId));

  const [stockValueResult] = await db
    .select({ 
      totalValue: sum(sql`COALESCE(${stockLedger.quantityOnHand}, 0) * COALESCE(${stockLedger.averageCost}, 0)`)
    })
    .from(stockLedger)
    .where(eq(stockLedger.companyId, companyId));

  const [lowStockResult] = await db
    .select({ count: count() })
    .from(stockLedger)
    .where(and(
      eq(stockLedger.companyId, companyId),
      sql`${stockLedger.quantityOnHand} <= ${stockLedger.reorderLevel}`
    ));

  const [movementsResult] = await db
    .select({ count: count() })
    .from(stockTransactions)
    .where(and(
      eq(stockTransactions.companyId, companyId),
      gte(stockTransactions.createdAt, sevenDaysAgo)
    ));

  // Recent stock movements
  const recentMovements = await db
    .select({
      id: stockTransactions.id,
      type: stockTransactions.transactionType,
      qty: stockTransactions.quantity,
      createdAt: stockTransactions.createdAt,
      itemId: stockTransactions.itemId,
    })
    .from(stockTransactions)
    .where(eq(stockTransactions.companyId, companyId))
    .orderBy(desc(stockTransactions.createdAt))
    .limit(5);

  // Low stock items
  const lowStockItems = await db
    .select({
      id: stockLedger.id,
      itemId: stockLedger.itemId,
      qty: stockLedger.quantityOnHand,
      reorderLevel: stockLedger.reorderLevel,
    })
    .from(stockLedger)
    .where(and(
      eq(stockLedger.companyId, companyId),
      sql`${stockLedger.quantityOnHand} <= ${stockLedger.reorderLevel}`
    ))
    .limit(5);

  // Top items by stock value
  const topItemsByValue = await db
    .select({
      itemId: stockLedger.itemId,
      qty: stockLedger.quantityOnHand,
      avgCost: stockLedger.averageCost,
      value: sql<number>`COALESCE(${stockLedger.quantityOnHand}, 0) * COALESCE(${stockLedger.averageCost}, 0)`,
    })
    .from(stockLedger)
    .where(eq(stockLedger.companyId, companyId))
    .orderBy(desc(sql`COALESCE(${stockLedger.quantityOnHand}, 0) * COALESCE(${stockLedger.averageCost}, 0)`))
    .limit(5);

  const stats = [
    {
      title: "Total Items",
      value: itemCountResult?.count ?? 0,
      subtitle: "SKUs in catalog",
      icon: Package,
      href: "/inventory/items",
      gradient: "from-teal-500 to-cyan-600",
    },
    {
      title: "Stock Value",
      value: formatCurrency(Number(stockValueResult?.totalValue) || 0),
      subtitle: "At average cost",
      icon: TrendingUp,
      href: "/inventory/ledger",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      title: "Low Stock Alerts",
      value: lowStockResult?.count ?? 0,
      subtitle: "Need reorder",
      icon: AlertTriangle,
      href: "/inventory/items",
      gradient: "from-amber-500 to-orange-500",
      alert: (lowStockResult?.count ?? 0) > 0,
    },
    {
      title: "Movements (7d)",
      value: movementsResult?.count ?? 0,
      subtitle: "Transactions",
      icon: Activity,
      href: "/inventory/ledger",
      gradient: "from-blue-500 to-indigo-500",
    },
  ];

  const quickActions = [
    { title: "View Items", href: "/inventory/items", icon: Package, color: "bg-teal-500" },
    { title: "Stock Ledger", href: "/inventory/ledger", icon: Boxes, color: "bg-violet-500" },
    { title: "Adjustment", href: "/inventory/adjustments/new", icon: ClipboardList, color: "bg-amber-500" },
    { title: "Transfer", href: "/inventory/transfers/new", icon: RotateCcw, color: "bg-blue-500" },
    { title: "Categories", href: "/inventory/categories", icon: BarChart3, color: "bg-pink-500" },
    { title: "Brands", href: "/inventory/brands", icon: PackageCheck, color: "bg-emerald-500" },
    { title: "BOM", href: "/inventory/bom", icon: Boxes, color: "bg-indigo-500" },
    { title: "Warehouses", href: "/settings/warehouses", icon: Warehouse, color: "bg-cyan-500" },
  ];

  const getMovementIcon = (type: string | null) => {
    if (!type) return Activity;
    if (type.includes('in') || type === 'purchase' || type === 'return_in') return ArrowDownRight;
    if (type.includes('out') || type === 'sale' || type === 'return_out') return ArrowUpRight;
    return Activity;
  };

  const getMovementColor = (type: string | null) => {
    if (!type) return "text-gray-500";
    if (type.includes('in') || type === 'purchase' || type === 'return_in') return "text-emerald-500";
    if (type.includes('out') || type === 'sale' || type === 'return_out') return "text-rose-500";
    return "text-blue-500";
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAtMThjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-6 w-6" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Inventory Module</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Inventory Dashboard</h1>
          <p className="text-white/80 text-lg">Track stock levels, movements and valuations in real-time</p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
          <Boxes className="h-32 w-32 text-white/20" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} text-white border-0 hover:scale-105 transition-all duration-300 cursor-pointer ${stat.alert ? 'ring-2 ring-amber-300 ring-offset-2' : ''}`}>
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
        {/* Recent Movements */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-500" />
              Recent Movements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMovements.length > 0 ? (
              <div className="space-y-3">
                {recentMovements.map((movement) => {
                  const Icon = getMovementIcon(movement.type);
                  return (
                    <div key={movement.id} className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-white shadow ${getMovementColor(movement.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{movement.type?.replace(/_/g, ' ') || 'Movement'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(movement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-sm font-bold ${getMovementColor(movement.type)}`}>
                        {movement.type?.includes('in') ? '+' : '-'}{Number(movement.qty).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
                <Link href="/inventory/ledger">
                  <Button variant="outline" className="w-full mt-2">
                    View All Movements
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Boxes className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No stock movements yet</p>
                <Link href="/inventory/adjustments/new">
                  <Button className="mt-4" variant="outline">
                    Create First Adjustment
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div>
                      <p className="text-sm font-medium">Item {item.itemId?.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">Reorder at: {Number(item.reorderLevel)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600">{Number(item.qty)}</p>
                      <p className="text-xs text-muted-foreground">In stock</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No low stock items</p>
                <p className="text-xs mt-2">All items are above reorder levels</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Items by Value */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-500" />
              Top Items by Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topItemsByValue.length > 0 ? (
              <div className="space-y-3">
                {topItemsByValue.map((item, index) => (
                  <div key={item.itemId} className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800">
                    <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Item {item.itemId?.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">Qty: {Number(item.qty)}</p>
                    </div>
                    <span className="text-sm font-bold text-violet-600">
                      {formatCurrency(Number(item.value) || 0)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No stock data yet</p>
                <Link href="/inventory/items/new">
                  <Button className="mt-4" variant="outline">
                    Add First Item
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
