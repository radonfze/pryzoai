"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, AlertCircle } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"

export type Warranty = {
  id: string
  warrantyNumber: string
  serialNumber?: string
  startDate: Date | string
  expiryDate: Date | string
  status: string
  customer?: {
    name: string
  }
  item?: {
    name: string
  }
}

export function createColumns(): ColumnDef<Warranty>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "warrantyNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Warranty #" />
      ),
      cell: ({ row }) => <div className="font-mono font-medium">{row.getValue("warrantyNumber")}</div>,
    },
    {
      accessorKey: "customer.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => <div>{row.original.customer?.name || "-"}</div>,
    },
    {
      accessorKey: "item.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      cell: ({ row }) => <div className="truncate max-w-[150px]">{row.original.item?.name || "-"}</div>,
    },
    {
      accessorKey: "serialNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Serial #" />
      ),
      cell: ({ row }) => <div className="font-mono text-muted-foreground">{row.getValue("serialNumber") || "-"}</div>,
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Expiry Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("expiryDate") as string
        const isExpired = new Date(date) < new Date()
        return (
          <div className={isExpired ? "text-destructive" : ""}>
            {format(new Date(date), "dd MMM yyyy")}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const expiryDate = row.original.expiryDate
        const isExpired = expiryDate && new Date(expiryDate) < new Date()
        
        return (
          <Badge variant={isExpired ? "destructive" : status === "active" ? "default" : "secondary"}>
            {isExpired ? "Expired" : status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const warranty = row.original
        
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
              <Link href={`/sales/warranty/${warranty.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
              </Link>
              <Link href={`/sales/warranty/${warranty.id}/edit`}>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <AlertCircle className="mr-2 h-4 w-4" /> Process Claim
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export const columns: ColumnDef<Warranty>[] = createColumns()
