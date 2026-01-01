"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { formatDate } from "@/lib/utils"
import { CheckCircle, Clock, ShoppingCart, RotateCcw } from "lucide-react"

export type Serial = {
  id: string
  serialNumber: string
  status: string
  receivedDate: Date | null
  soldDate: Date | null
  warrantyEndDate: string | null
  createdAt: Date
  item?: { id: string; code: string; name: string } | null
  warehouse?: { id: string; name: string } | null
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  available: { label: "Available", color: "bg-green-100 text-green-700", icon: CheckCircle },
  reserved: { label: "Reserved", color: "bg-amber-100 text-amber-700", icon: Clock },
  sold: { label: "Sold", color: "bg-blue-100 text-blue-700", icon: ShoppingCart },
  returned: { label: "Returned", color: "bg-purple-100 text-purple-700", icon: RotateCcw },
};

export const columns: ColumnDef<Serial>[] = [
  {
    accessorKey: "serialNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Serial #" />
    ),
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.getValue("serialNumber")}</span>
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
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => row.original.warehouse?.name || <span className="text-muted-foreground text-xs">Sold/Shipped</span>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const config = statusConfig[status] || statusConfig.available;
      const Icon = config.icon;
      return (
        <Badge className={`${config.color} gap-1`}>
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "receivedDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Received" />
    ),
    cell: ({ row }) => {
      const date = row.original.receivedDate;
      return date ? formatDate(date) : "—";
    },
  },
  {
    accessorKey: "soldDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sold" />
    ),
    cell: ({ row }) => {
      const date = row.original.soldDate;
      return date ? formatDate(date) : "—";
    },
  },
  {
    accessorKey: "warrantyEndDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Warranty Until" />
    ),
    cell: ({ row }) => {
      const warranty = row.original.warrantyEndDate;
      if (!warranty) return <span className="text-muted-foreground text-xs">N/A</span>;
      
      const warrantyDate = new Date(warranty);
      const today = new Date();
      const isExpired = warrantyDate < today;
      
      return (
        <span className={`text-xs ${isExpired ? "text-red-600" : ""}`}>
          {formatDate(warranty)}
        </span>
      );
    },
  },
];
