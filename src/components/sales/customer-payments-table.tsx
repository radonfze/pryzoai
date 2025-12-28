"use client";

import { DataTable } from "@/components/ui/data-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const columns = [
  { accessorKey: "paymentNumber", header: "Payment #" },
  { 
    accessorKey: "customer.name", 
    header: "Customer",
    cell: ({ row }: any) => row.original.customer?.name || "-"
  },
  { 
    accessorKey: "paymentDate", 
    header: "Date",
    cell: ({ row }: any) => format(new Date(row.original.paymentDate), "dd MMM yyyy")
  },
  { accessorKey: "paymentMethod", header: "Method" },
  { 
    accessorKey: "amount", 
    header: "Amount",
    cell: ({ row }: any) => `${Number(row.original.amount).toLocaleString()} AED`
  },
  { 
    accessorKey: "status", 
    header: "Status",
    cell: ({ row }: any) => <Badge variant="outline">{row.original.status}</Badge>
  },
];

interface CustomerPaymentsTableProps {
  payments: any[];
}

export function CustomerPaymentsTable({ payments }: CustomerPaymentsTableProps) {
  return <DataTable columns={columns} data={payments} searchColumn="paymentNumber" />;
}
