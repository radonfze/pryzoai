"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export type RecurringInvoice = {
  id: string;
  templateName: string;
  customer: {
    name: string;
  } | null;
  frequency: string;
  nextRunDate: string; // Date string
  lastRunDate?: string | null;
  totalAmount: string | number;
  isActive: boolean | null;
  status?: string; // fallback
};

export const columns: ColumnDef<RecurringInvoice>[] = [
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
    accessorKey: "templateName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Template Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("templateName")}</div>,
  },
  {
    accessorKey: "customer.name",
    header: "Customer",
    cell: ({ row }) => <div>{row.original.customer?.name || "N/A"}</div>,
  },
  {
    accessorKey: "frequency",
    header: "Frequency",
    cell: ({ row }) => <Badge variant="secondary" className="capitalize">{row.getValue("frequency")}</Badge>,
  },
  {
    accessorKey: "nextRunDate",
    header: "Next Run",
    cell: ({ row }) => {
        const date = row.getValue("nextRunDate");
        return date ? format(new Date(date as string), "dd MMM yyyy") : "-";
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalAmount") as string);
      return <div className="font-medium">AED {amount.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
        const active = row.getValue("isActive");
        return (
            <Badge variant={active ? "default" : "destructive"}>
                {active ? "Active" : "Inactive"}
            </Badge>
        );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const template = row.original;

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
            <Link href={`/sales/recurring-invoices/${template.id}/edit`}>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" /> Edit Template
              </DropdownMenuItem>
            </Link>
             <DropdownMenuItem className="text-destructive">
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
