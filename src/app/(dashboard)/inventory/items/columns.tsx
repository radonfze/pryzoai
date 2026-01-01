"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, Package, AlertTriangle, Lock, Wrench } from "lucide-react"
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
import { ItemDrillThroughDialog } from "@/components/inventory/item-drill-through-dialog"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type Item = {
  id: string
  code: string
  name: string
  itemType: string
  sellingPrice: string | null
  isActive: boolean
  reorderLevel?: string | null
  // Stock data from aggregation
  stockOnHand?: string
  stockReserved?: string
  stockAvailable?: string
  // Relations
  category?: any
  brand?: any
  subCategory?: any
  uom?: any
  model?: any
  costPrice?: any
  barcode?: any
}

// Helper to check low stock
const isLowStock = (item: Item) => {
  const available = parseFloat(item.stockAvailable || "0");
  const reorderLevel = parseFloat(item.reorderLevel || "0");
  return item.itemType !== "service" && available > 0 && available <= reorderLevel;
};

const isOutOfStock = (item: Item) => {
  const available = parseFloat(item.stockAvailable || "0");
  return item.itemType !== "service" && available <= 0;
};

const hasReservations = (item: Item) => {
  return parseFloat(item.stockReserved || "0") > 0;
};

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
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("code")}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Item Name" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.getValue("name")}</span>
          {/* Visual Indicators */}
          {item.itemType === "service" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Wrench className="h-3.5 w-3.5 text-purple-500" />
                </TooltipTrigger>
                <TooltipContent>Service Item (Non-Stock)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isLowStock(item) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>Low Stock Warning</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {hasReservations(item) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Lock className="h-3.5 w-3.5 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>Has Reservations</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "itemType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => <div className="capitalize text-xs">{row.getValue("itemType")}</div>,
  },
  {
    accessorKey: "stockOnHand",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="On Hand" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      if (item.itemType === "service") return <span className="text-muted-foreground text-xs">N/A</span>;
      const qty = parseFloat(item.stockOnHand || "0");
      return <div className="text-right font-medium tabular-nums">{qty.toFixed(0)}</div>;
    },
  },
  {
    accessorKey: "stockReserved",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reserved" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      if (item.itemType === "service") return <span className="text-muted-foreground text-xs">N/A</span>;
      const qty = parseFloat(item.stockReserved || "0");
      return (
        <div className={`text-right font-medium tabular-nums ${qty > 0 ? "text-blue-600" : ""}`}>
          {qty.toFixed(0)}
        </div>
      );
    },
  },
  {
    accessorKey: "stockAvailable",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Available" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      if (item.itemType === "service") return <span className="text-muted-foreground text-xs">N/A</span>;
      const qty = parseFloat(item.stockAvailable || "0");
      const isLow = isLowStock(item);
      const isOut = isOutOfStock(item);
      return (
        <div className={`text-right font-medium tabular-nums ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-green-600"}`}>
          {qty.toFixed(0)}
        </div>
      );
    },
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
      const item = row.original;
      const isActive = row.getValue("isActive");
      const isOut = isOutOfStock(item);
      const isLow = isLowStock(item);
      
      if (!isActive) {
        return <Badge variant="secondary">Inactive</Badge>;
      }
      if (item.itemType === "service") {
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">Service</Badge>;
      }
      if (isOut) {
        return <Badge variant="destructive">Out of Stock</Badge>;
      }
      if (isLow) {
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Low Stock</Badge>;
      }
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">In Stock</Badge>;
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
            <DrillDialogItem item={item} />

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

// Helper component here for Drill-Through Dialog in Dropdown
const DrillDialogItem = ({ item }: { item: Item }) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpen(true); }}>
                <Package className="mr-2 h-4 w-4" /> Stock Drill-Through
            </DropdownMenuItem>
            <ItemDrillThroughDialog
                itemId={item.id}
                itemCode={item.code}
                itemName={item.name}
                open={open}
                onOpenChange={setOpen}
                initialTab="stock"
            />
        </>
    )
}

