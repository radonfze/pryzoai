"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown, Eye, Edit, Trash, ArrowRightLeft } from "lucide-react"
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

export type StockTransfer = {
  id: string
  transferNumber: string
  transferDate: Date | string | null
  fromWarehouse: { name: string } | null
  toWarehouse: { name: string } | null
  status: string | null
}

export const columns: ColumnDef<StockTransfer>[] = [
  {
    accessorKey: "transferNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transfer #" />
    ),
    cell: ({ row }) => <div className="font-mono">{row.getValue("transferNumber")}</div>,
  },
  {
    accessorKey: "transferDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("transferDate")
      return (
        <div>
          {date ? format(new Date(date as string), "dd MMM yyyy") : "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "fromWarehouse.name",
    id: "fromWarehouse",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="From Warehouse" />
    ),
    cell: ({ row }) => {
       const warehouse = row.original.fromWarehouse
       return <div>{warehouse?.name || "-"}</div>
    }
  },
    {
    accessorKey: "toWarehouse.name",
    id: "toWarehouse",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="To Warehouse" />
    ),
    cell: ({ row }) => {
       const warehouse = row.original.toWarehouse
       return <div>{warehouse?.name || "-"}</div>
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
        <Badge variant={status === "completed" ? "default" : "secondary"}>
          {status || "Draft"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transfer = row.original

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
              onClick={() => navigator.clipboard.writeText(transfer.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href={`/inventory/transfers/${transfer.id}`}>
                <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
            </Link>
             <Link href={`/inventory/transfers/${transfer.id}/edit`}>
                <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" /> Edit Transfer
                </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
