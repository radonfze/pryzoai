"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Pencil, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type StockAdjustment = {
  id: string;
  adjustmentNumber: string;
  adjustmentDate: string;
  status: string;
  isPosted: boolean;
  notes: string | null;
  createdAt: Date;
  lines: { id: string }[];
};

export const columns: ColumnDef<StockAdjustment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        disabled={row.original.isPosted}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "adjustmentNumber",
    header: "Number",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.adjustmentNumber}</div>
    ),
  },
  {
    accessorKey: "adjustmentDate",
    header: "Date",
    cell: ({ row }) => format(new Date(row.original.adjustmentDate), "PP"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const isPosted = row.original.isPosted;
      return (
        <Badge variant={isPosted ? "default" : status === "draft" ? "secondary" : "outline"}>
          {isPosted ? "Posted" : status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "lines",
    header: "Lines",
    cell: ({ row }) => row.original.lines?.length || 0,
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm truncate max-w-[200px] block">
        {row.original.notes || "-"}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const adjustment = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/inventory/adjustments/${adjustment.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
