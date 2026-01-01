"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown, Eye, Edit, Trash, Package } from "lucide-react"
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
import { ViewItemDialog } from "@/components/inventory/item-view-dialog"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"

export type Item = {
  id: string
  code: string
  name: string
  itemType: string
  sellingPrice: string | null
  isActive: boolean
  // Add loose typing for relations to avoid ts errors without full schema update here
  category?: any
  brand?: any
  subCategory?: any
  uom?: any
  model?: any
  costPrice?: any
  barcode?: any
}

import { Checkbox } from "@/components/ui/checkbox"

export const columns: ColumnDef<Item>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Item Code" />
    ),
    cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("code")}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Item Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.getValue("name")}
        </div>
      )
    },
  },
  {
    accessorKey: "itemType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => <div className="capitalize">{row.getValue("itemType")}</div>,
  },
  {
    accessorKey: "sellingPrice",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" />
    ),
    cell: ({ row }) => {
      const price = row.getValue("sellingPrice");
      return <div className="text-right font-medium">{formatCurrency(price as string)}</div>
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("isActive")
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original

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
              onClick={() => navigator.clipboard.writeText(item.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            <ViewDialogItem item={item} />

            <Link href={`/inventory/items/${item.id}/edit`}>
                <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" /> Edit Item
                </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// Helper component to handle Dialog inside Dropdown
const ViewDialogItem = ({ item }: { item: Item }) => {
    const [open, setOpen] = useState(false);
    return (
        <ViewItemDialog 
            item={item} 
            open={open} 
            onOpenChange={setOpen}
            trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
            }
        />
    )
}

