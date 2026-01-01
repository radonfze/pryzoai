"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { formatDate } from "@/lib/utils"
import { AlertTriangle, CheckCircle } from "lucide-react"

export type Batch = {
  id: string
  batchNumber: string
  manufacturingDate: string | null
  expiryDate: string | null
  quantityReceived: string | null
  quantityOnHand: string | null
  quantityReserved: string | null
  unitCost: string | null
  isActive: boolean
  createdAt: Date
  item?: { id: string; code: string; name: string } | null
  warehouse?: { id: string; name: string } | null
}

export const columns: ColumnDef<Batch>[] = [
  {
    accessorKey: "batchNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Batch #" />
    ),
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.getValue("batchNumber")}</span>
    ),
  },
  {
    id: "item",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Item" />
    ),
    cell: ({ row }) => {
      const item = row.original.item;
      return (
        <div>
          <div className="font-mono text-xs text-muted-foreground">{item?.code}</div>
          <div className="font-medium truncate max-w-[200px]">{item?.name}</div>
        </div>
      );
    },
  },
  {
    id: "warehouse",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Warehouse" />
    ),
    cell: ({ row }) => row.original.warehouse?.name || "—",
  },
  {
    accessorKey: "quantityOnHand",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="On Hand" />
    ),
    cell: ({ row }) => {
      const qty = parseFloat(row.getValue("quantityOnHand") || "0");
      return <div className="text-right font-medium tabular-nums">{qty.toFixed(0)}</div>;
    },
  },
  {
    accessorKey: "quantityReserved",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reserved" />
    ),
    cell: ({ row }) => {
      const qty = parseFloat(row.original.quantityReserved || "0");
      return <div className="text-right font-medium tabular-nums text-amber-600">{qty.toFixed(0)}</div>;
    },
  },
  {
    accessorKey: "manufacturingDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mfg Date" />
    ),
    cell: ({ row }) => {
      const date = row.original.manufacturingDate;
      return date ? formatDate(date) : "—";
    },
  },
  {
    accessorKey: "expiryDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expiry" />
    ),
    cell: ({ row }) => {
      const expiry = row.original.expiryDate;
      if (!expiry) return <span className="text-muted-foreground text-xs">No expiry</span>;
      
      const expiryDate = new Date(expiry);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        return (
          <div className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-xs">Expired</span>
          </div>
        );
      } else if (daysUntilExpiry <= 30) {
        return (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-xs">{formatDate(expiry)}</span>
          </div>
        );
      }
      return <span className="text-xs">{formatDate(expiry)}</span>;
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("isActive");
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
];
