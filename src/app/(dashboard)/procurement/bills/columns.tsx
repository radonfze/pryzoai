"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, Printer, CheckCircle, Copy, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"

export type PurchaseBill = {
  id: string
  invoiceNumber: string // Bill #
  invoiceDate: Date | string
  dueDate: Date | string
  status: string
  totalAmount: string
  balanceAmount: string
  supplier: {
    name: string
  }
}

export const columns: ColumnDef<PurchaseBill>[] = [
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
    accessorKey: "invoiceNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bill #" />
    ),
    cell: ({ row }) => <div className="font-mono font-medium">{row.getValue("invoiceNumber")}</div>,
  },
  {
    accessorKey: "supplier.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supplier" />
    ),
  },
  {
    accessorKey: "invoiceDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => <div>{format(new Date(row.getValue("invoiceDate")), "dd MMM yyyy")}</div>,
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("dueDate");
      return <div>{date ? format(new Date(date as string), "dd MMM yyyy") : "-"}</div>
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "posted" ? "default" : status === "draft" ? "secondary" : "outline"}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => <div className="text-right font-medium">{Number(row.getValue("totalAmount")).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>,
  },
  {
    accessorKey: "balanceAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Balance" />
    ),
    cell: ({ row }) => <div className="text-right text-muted-foreground">{Number(row.getValue("balanceAmount")).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const bill = row.original
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
            <Link href={`/procurement/bills/${bill.id}`}>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
            </Link>
            {bill.status !== "posted" && (
              <Link href={`/procurement/bills/${bill.id}/edit`}>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              </Link>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.open(`/api/procurement/bills/${bill.id}/pdf`, '_blank')}>
              <Printer className="mr-2 h-4 w-4" /> Print PDF
            </DropdownMenuItem>
            {bill.status === "draft" && (
              <DropdownMenuItem onClick={() => {
                // TODO: Implement post to GL functionality
                alert('Post to GL functionality - to be implemented');
              }}>
                <CheckCircle className="mr-2 h-4 w-4" /> Post to GL
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => {
              // TODO: Implement duplicate functionality
              alert('Duplicate bill functionality - to be implemented');
            }}>
              <Copy className="mr-2 h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => {
                if (confirm(`Delete bill ${bill.invoiceNumber}?`)) {
                  // TODO: Implement delete functionality
                  alert('Delete functionality - to be implemented');
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
