"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const columns = [
  { accessorKey: "returnNumber", header: "Return #" },
  { 
    accessorKey: "customer.name", 
    header: "Customer",
    cell: ({ row }: any) => row.original.customer?.name || "-"
  },
  { 
    accessorKey: "returnDate", 
    header: "Date",
    cell: ({ row }: any) => format(new Date(row.original.returnDate), "dd MMM yyyy")
  },
  { 
    accessorKey: "totalAmount", 
    header: "Amount",
    cell: ({ row }: any) => `${Number(row.original.totalAmount).toLocaleString()} AED`
  },
  { 
    accessorKey: "status", 
    header: "Status",
    cell: ({ row }: any) => <Badge variant="outline">{row.original.status}</Badge>
  },
];

interface SalesReturnsTableProps {
  returns: any[];
}

export function SalesReturnsTable({ returns }: SalesReturnsTableProps) {
  return <DataTable columns={columns} data={returns} searchColumn="returnNumber" />;
}
