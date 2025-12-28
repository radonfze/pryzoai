"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown, Eye, Edit, Trash, Calendar } from "lucide-react"
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
import { format } from "date-fns"

export type LeaveRequest = {
  id: string
  requestNumber: string
  leaveType: string
  startDate: Date | string
  endDate: Date | string
  days: string | number
  status: string
  employee: { firstName: string; lastName: string } | null
}

export const columns: ColumnDef<LeaveRequest>[] = [
  {
    accessorKey: "requestNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Request #" />
    ),
    cell: ({ row }) => <div className="font-mono">{row.getValue("requestNumber")}</div>,
  },
  {
    accessorKey: "employee",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Employee" />
    ),
    cell: ({ row }) => {
      const emp = row.original.employee
      return (
        <div className="font-medium">
          {emp ? `${emp.firstName} ${emp.lastName}` : "-"}
        </div>
      )
    },
     filterFn: (row, id, value) => {
        const emp = row.original.employee
        const name = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : ""
        return name.includes(value.toLowerCase())
    },
  },
  {
    accessorKey: "leaveType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => <div className="capitalize">{row.getValue("leaveType")}</div>,
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    cell: ({ row }) => {
      const start = new Date(row.original.startDate as string)
      const end = new Date(row.original.endDate as string)
      return (
        <div className="text-sm">
          {format(start, "dd MMM")} - {format(end, "dd MMM yyyy")}
        </div>
      )
    },
  },
  {
    accessorKey: "days",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Days" />
    ),
    cell: ({ row }) => <div className="text-center w-12">{Number(row.getValue("days"))}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={
            status === 'approved' ? 'default' : 
            status === 'rejected' ? 'destructive' : 'secondary'
        }>
          {status || "Pending"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const leave = row.original

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
              onClick={() => navigator.clipboard.writeText(leave.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href={`/hr/leaves/${leave.id}`}>
                <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
            </Link>
             <Link href={`/hr/leaves/${leave.id}/edit`}>
                <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" /> Edit Request
                </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
