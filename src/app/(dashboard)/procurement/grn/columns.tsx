"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown, Eye, Edit, Trash, PackageCheck } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { format } from "date-fns"

export type GRN = {
  id: string
  grnNumber: string
  grnDate: Date | string
  supplier: { name: string } | null
  purchaseOrder: { orderNumber: string } | null
  status: string
}

export const columns: ColumnDef<GRN>[] = [
  {
    accessorKey: "grnNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="GRN #" />
    ),
    cell: ({ row }) => <div className="font-mono">{row.getValue("grnNumber")}</div>,
  },
  {
    accessorKey: "grnDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("grnDate")
      return (
        <div>
          {date ? format(new Date(date as string), "dd MMM yyyy") : "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "supplier.name",
    id: "supplier",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supplier" />
    ),
    cell: ({ row }) => {
       const supplier = row.original.supplier
       return <div>{supplier?.name || "-"}</div>
    }
  },
  {
    accessorKey: "purchaseOrder.orderNumber",
    id: "purchaseOrder",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PO Reference" />
    ),
    cell: ({ row }) => {
       const po = row.original.purchaseOrder
       return <div className="font-mono text-xs">{po?.orderNumber || "-"}</div>
    }
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "posted" ? "default" : "outline"}>
          {status || "Draft"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const grn = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(grn.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href={`/procurement/grn/${grn.id}`}>
                <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
            </Link>
             <Link href={`/procurement/grn/${grn.id}/edit`}>
                <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" /> Edit GRN
                </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
