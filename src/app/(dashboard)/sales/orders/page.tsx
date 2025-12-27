import { db } from "@/db";
import { salesOrders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function SalesOrdersPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "completed": return "default";
      case "partial": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Sales Orders</h2>
        <Link href="/sales/orders/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Sales Order</Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No sales orders yet.</p>
          <p className="text-sm mt-2">Create your first sales order to get started.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber || order.id.slice(0, 8)}</TableCell>
                  <TableCell>{order.orderDate ? format(new Date(order.orderDate), "dd/MM/yyyy") : "-"}</TableCell>
                  <TableCell>{order.customer?.name || "-"}</TableCell>
                  <TableCell className="text-right font-mono">
                    AED {Number(order.totalAmount || 0).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status || "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/sales/orders/${order.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
