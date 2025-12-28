import { db } from "@/db";
import { salesOrders, customers, salesLines } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Truck } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

const columns = [
  { accessorKey: "orderNumber", header: "Order #" },
  { 
    accessorKey: "customer.name", 
    header: "Customer",
    cell: ({ row }: any) => row.original.customer?.name || "-"
  },
  { 
    accessorKey: "orderDate", 
    header: "Date",
    cell: ({ row }: any) => format(new Date(row.original.orderDate), "dd MMM yyyy")
  },
  { 
    accessorKey: "deliveredQty", 
    header: "Delivered",
    cell: ({ row }: any) => `${Number(row.original.deliveredQty || 0)} / ${Number(row.original.totalQty || 0)}`
  },
  { 
    accessorKey: "status", 
    header: "Delivery Status",
    cell: ({ row }: any) => {
      const delivered = Number(row.original.deliveredQty || 0);
      const total = Number(row.original.totalQty || 1);
      if (delivered >= total) return <Badge className="bg-green-600">Delivered</Badge>;
      if (delivered > 0) return <Badge className="bg-yellow-600">Partial</Badge>;
      return <Badge variant="outline">Pending</Badge>;
    }
  },
];

export default async function DeliveryNotesPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  // Delivery notes are based on sales orders with delivery tracking
  const orders = await db.query.salesOrders.findMany({
    where: eq(salesOrders.companyId, companyId),
    with: { customer: true },
    orderBy: [desc(salesOrders.createdAt)],
    limit: 100
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Delivery Notes"
        description="Track order deliveries and shipments"
        icon={Truck}
      />

      <div className="flex justify-end">
        <Link href="/sales/delivery-notes/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Create Delivery Note</Button>
        </Link>
      </div>

      <DataTable columns={columns} data={orders} searchColumn="orderNumber" />
    </div>
  );
}
