"use client";

import { DataTable } from "@/components/ui/data-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const columns = [
  { accessorKey: "paymentNumber", header: "Payment #" },
  { 
    accessorKey: "supplier.name", 
    header: "Supplier",
    cell: ({ row }: any) => row.original.supplier?.name || "-"
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

interface SupplierPaymentsTableProps {
  payments: any[];
}

export function SupplierPaymentsTable({ payments }: SupplierPaymentsTableProps) {
  return <DataTable columns={columns} data={payments} searchColumn="paymentNumber" />;
}
