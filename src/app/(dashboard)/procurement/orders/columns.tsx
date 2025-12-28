"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown, Eye, Edit, Trash, ShoppingCart } from "lucide-react"
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

export type PurchaseOrder = {
  id: string
  orderNumber: string
  orderDate: Date | string
  supplier: { name: string } | null
  totalAmount: string | null
  status: string
}

export const columns: ColumnDef<PurchaseOrder>[] = [
  {
    accessorKey: "orderNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PO Number" />
    ),
    cell: ({ row }) => <div className="font-mono">{row.getValue("orderNumber")}</div>,
  },
  {
    accessorKey: "orderDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("orderDate")
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
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalAmount") || "0")
      const formatted = new Intl.NumberFormat("en-AE", {
        style: "currency",
        currency: "AED",
      }).format(amount)
 
      return <div className="text-right font-medium font-mono">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
       const variant = 
          status === "issued" || status === "completed" ? "default" :
          status === "cancelled" ? "destructive" :
          status === "partial" ? "secondary" : "secondary"

      return (
        <Badge variant={variant}>
          {status || "Draft"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original

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
              onClick={() => navigator.clipboard.writeText(order.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href={`/procurement/orders/${order.id}`}>
                <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
            </Link>
             <Link href={`/procurement/orders/${order.id}/edit`}>
                <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" /> Edit Order
                </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
