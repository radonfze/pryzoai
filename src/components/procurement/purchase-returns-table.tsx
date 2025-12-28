"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const columns = [
  { accessorKey: "returnNumber", header: "Return #" },
  { 
    accessorKey: "supplier.name", 
    header: "Supplier",
    cell: ({ row }: any) => row.original.supplier?.name || "-"
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
  {
    id: "actions",
    cell: ({ row }: any) => (
      <Link href={`/procurement/returns/${row.original.id}`}>
        <Button variant="ghost" size="sm">View</Button>
      </Link>
    )
  }
];

interface PurchaseReturnsTableProps {
  returns: any[];
}

export function PurchaseReturnsTable({ returns }: PurchaseReturnsTableProps) {
  return <DataTable columns={columns} data={returns} searchColumn="returnNumber" />;
}
