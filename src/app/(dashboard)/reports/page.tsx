import { ReportingService } from "@/lib/services/reporting-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const pnl = await ReportingService.getProfitAndLoss(DEMO_COMPANY_ID);
  const sales = await ReportingService.getSalesAnalysis(DEMO_COMPANY_ID);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="finance"
        title="Reports Dashboard"
        description="Financial overview and business intelligence"
        icon={BarChart3}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              AED {pnl.revenue.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              AED {pnl.expense.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pnl.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              AED {pnl.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg">
            <strong>Total Orders Issued:</strong> {sales.summary.count}
          </div>
          <div className="text-lg">
            <strong>Total Sales Value:</strong> AED {Number(sales.summary.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.topCustomers.length === 0 ? (
            <p className="text-muted-foreground">No customer data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Customer</th>
                  <th className="text-right py-2">Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {sales.topCustomers.map((c: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{c.name || "Unknown"}</td>
                    <td className="text-right py-2 font-mono">
                      AED {Number(c.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
