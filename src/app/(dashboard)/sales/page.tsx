import { getSalesStats, getRecentInvoices } from "@/lib/sales/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { 
  DollarSign, 
  CreditCard, 
  Users, 
  FileText 
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mock Company ID for Dev - in real app, get from session
const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000"; // Replace with real ID from DB during seed

export default async function SalesDashboardPage() {
  // In production: const session = await getSession(); const companyId = session.companyId;
  const companyId = DEMO_COMPANY_ID;

  // Parallel data fetching
  const stats = await getSalesStats(companyId);
  const recentInvoices = await getRecentInvoices(companyId);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Sales Dashboard</h2>
      </div>
      
      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRevenue.toLocaleString(undefined, { style: 'currency', currency: 'AED' })}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.outstandingAmount.toLocaleString(undefined, { style: 'currency', currency: 'AED' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Across posted invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              +2 since last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingQuotations}</div>
            <p className="text-xs text-muted-foreground">
              Requires follow-up
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No recent invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.customer.name}</TableCell>
                      <TableCell>{format(new Date(inv.invoiceDate), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === "confirmed" || inv.status === "completed" ? "default" : "secondary"}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Placeholder for Quick Actions or Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid gap-2">
                <div className="flex items-center justify-between rounded-md border p-4 hover:bg-muted cursor-pointer">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">New Invoice</span>
                    </div>
                </div>
                <div className="flex items-center justify-between rounded-md border p-4 hover:bg-muted cursor-pointer">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">New Quotation</span>
                    </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
