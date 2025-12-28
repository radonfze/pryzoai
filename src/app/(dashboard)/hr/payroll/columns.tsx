"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown, Eye, Edit, Trash, Play } from "lucide-react"
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

export type PayrollRun = {
  id: string
  runNumber: string
  periodMonth: number
  periodYear: number
  runDate: Date | string
  totalEmployees: number | null
  totalNetPay: string | null
  status: string
}

export const columns: ColumnDef<PayrollRun>[] = [
  {
    accessorKey: "runNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Run #" />
    ),
    cell: ({ row }) => <div className="font-mono">{row.getValue("runNumber")}</div>,
  },
  {
    id: "period",
    accessorFn: row => `${row.periodYear}-${row.periodMonth}`,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Period" />
    ),
    cell: ({ row }) => {
      const month = row.original.periodMonth
      const year = row.original.periodYear
      const date = new Date(year, month - 1)
      return (
        <div className="font-medium">
          {format(date, "MMMM yyyy")}
        </div>
      )
    },
  },
  {
    accessorKey: "runDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Run Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("runDate")
      return (
        <div>
          {date ? format(new Date(date as string), "dd MMM yyyy") : "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "totalEmployees",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Employees" />
    ),
    cell: ({ row }) => <div className="text-center w-20">{row.getValue("totalEmployees")}</div>,
  },
  {
    accessorKey: "totalNetPay",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Pay" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalNetPay") || "0")
      const formatted = new Intl.NumberFormat("en-AE", {
        style: "currency",
        currency: "AED",
      }).format(amount)
 
      return <div className="text-right font-medium font-mono">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
       const variant = 
          status === "paid" ? "default" :
          status === "approved" ? "secondary" : 
          status === "processing" ? "outline" : "secondary"

      return (
        <Badge variant={variant} className="uppercase text-[10px]">
          {status || "Draft"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const run = row.original

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
              onClick={() => navigator.clipboard.writeText(run.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href={`/hr/payroll/${run.id}`}>
                <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
            </Link>
             <Link href={`/hr/payroll/${run.id}/edit`}>
                <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" /> Edit Run
                </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
