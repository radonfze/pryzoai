"use client";

import { DataTable } from "@/components/ui/data-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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

interface DeliveryNotesTableProps {
  orders: any[];
}

export function DeliveryNotesTable({ orders }: DeliveryNotesTableProps) {
  return <DataTable columns={columns} data={orders} searchColumn="orderNumber" />;
}
