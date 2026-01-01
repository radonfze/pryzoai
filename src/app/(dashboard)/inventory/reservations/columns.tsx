"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, ExternalLink } from "lucide-react"
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
import { formatCurrency, formatDate } from "@/lib/utils"

export type Reservation = {
  id: string
  documentType: string
  documentNumber: string | null
  quantityReserved: string
  quantityFulfilled: string | null
  reservedPrice: string | null
  status: string
  expiresAt: Date | null
  createdAt: Date
  item?: { id: string; code: string; name: string } | null
  warehouse?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
  customer?: { id: string; name: string } | null
}

const statusColors: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  fulfilled: "bg-green-100 text-green-700",
  released: "bg-gray-100 text-gray-700",
  expired: "bg-red-100 text-red-700",
}

export const columns: ColumnDef<Reservation>[] = [
  {
    accessorKey: "documentNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Document" />
    ),
    cell: ({ row }) => {
      const docType = row.original.documentType;
      const docNum = row.original.documentNumber;
      return (
        <div>
          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
            {docType}
          </span>
          <span className="font-medium">{docNum || "—"}</span>
        </div>
      );
    },
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
    accessorKey: "quantityReserved",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reserved" />
    ),
    cell: ({ row }) => {
      const qty = parseFloat(row.getValue("quantityReserved") || "0");
      return <div className="text-right font-medium tabular-nums">{qty.toFixed(0)}</div>;
    },
  },
  {
    accessorKey: "quantityFulfilled",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fulfilled" />
    ),
    cell: ({ row }) => {
      const qty = parseFloat(row.original.quantityFulfilled || "0");
      return <div className="text-right font-medium tabular-nums text-green-600">{qty.toFixed(0)}</div>;
    },
  },
  {
    id: "project",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Project" />
    ),
    cell: ({ row }) => row.original.project?.name || "—",
  },
  {
    id: "customer",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => (
      <div className="truncate max-w-[150px]">
        {row.original.customer?.name || "—"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge className={statusColors[status] || "bg-gray-100 text-gray-700"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expires" />
    ),
    cell: ({ row }) => {
      const expires = row.original.expiresAt;
      if (!expires) return <span className="text-muted-foreground text-xs">No expiry</span>;
      const isExpired = new Date(expires) < new Date();
      return (
        <span className={`text-xs ${isExpired ? "text-red-600" : ""}`}>
          {formatDate(expires)}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const reservation = row.original;

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(reservation.id)}>
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {reservation.item && (
              <Link href={`/inventory/items/${reservation.item.id}`}>
                <DropdownMenuItem>
                  <ExternalLink className="mr-2 h-4 w-4" /> View Item
                </DropdownMenuItem>
              </Link>
            )}
            {reservation.project && (
              <Link href={`/projects/${reservation.project.id}`}>
                <DropdownMenuItem>
                  <ExternalLink className="mr-2 h-4 w-4" /> View Project
                </DropdownMenuItem>
              </Link>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
