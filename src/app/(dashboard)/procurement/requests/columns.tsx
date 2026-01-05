"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/button";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export type PurchaseRequest = {
  id: string;
  requestNumber: string;
  requestDate: string;
  requiredDate: string | null;
  requestedBy: string | null;
  department: string | null;
  status: string;
  createdAt: Date;
};

export const columns: ColumnDef<PurchaseRequest>[] = [
  {
    accessorKey: "requestNumber",
    header: "Request #",
    cell: ({ row }) => (
      <Link 
        href={`/procurement/requests/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.getValue("requestNumber")}
      </Link>
    ),
  },
  {
    accessorKey: "requestDate",
    header: "Request Date",
    cell: ({ row }) => format(new Date(row.getValue("requestDate")), "MMM dd, yyyy"),
  },
  {
    accessorKey: "requiredDate",
    header: "Required By",
    cell: ({ row }) => {
      const date = row.getValue("requiredDate") as string | null;
      return date ? format(new Date(date), "MMM dd, yyyy") : "—";
    },
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => row.getValue("department") || "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variants: Record<string, string> = {
        draft: "bg-gray-100 text-gray-800",
        pending_approval: "bg-yellow-100 text-yellow-800",
        issued: "bg-blue-100 text-blue-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[status] || variants.draft}`}>
          {status.replace(/_/g, " ").toUpperCase()}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const request = row.original;

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
            <DropdownMenuItem asChild>
              <Link href={`/procurement/requests/${request.id}`}>View</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/procurement/requests/${request.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
