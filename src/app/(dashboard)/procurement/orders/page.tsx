import { db } from "@/db";
import { purchaseOrders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

export default async function PurchaseOrderListPage() {
  const orders = await db.query.purchaseOrders.findMany({
    where: eq(purchaseOrders.companyId, DEMO_COMPANY_ID),
    with: {
        supplier: true
    },
    // Schema uses orderDate not transactionDate
    orderBy: [desc(purchaseOrders.orderDate)]
  });

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
         <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
         <Link href="/procurement/orders/new">
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Order
            </Button>
         </Link>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
            ) : (
                orders.map((po) => (
                    <TableRow key={po.id}>
                        <TableCell className="text-xs">
                             {/* Schema uses orderDate not transactionDate */}
                             {format(new Date(po.orderDate), "dd MMM yyyy")}
                        </TableCell>
                        {/* Schema has orderNumber */}
                        <TableCell className="font-mono text-xs font-medium">{po.orderNumber}</TableCell>
                        <TableCell>{po.supplier.name}</TableCell>
                        <TableCell className="text-right font-mono">
                            {Number(po.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                            <Badge variant={po.status === "draft" ? "secondary" : "default"} className="uppercase text-[10px]">
                                {po.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
