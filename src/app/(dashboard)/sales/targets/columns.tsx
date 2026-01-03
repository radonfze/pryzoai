"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
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
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"

export type SalesTarget = {
  id: string
  name: string
  targetType: string
  targetAmount: number
  achievedAmount: number
  startDate: Date | string
  endDate: Date | string
  status: string
}

export function createColumns(): ColumnDef<SalesTarget>[] {
  return [
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
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Target Name" />
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "targetType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.getValue("targetType")}</Badge>,
    },
    {
      accessorKey: "targetAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Target" />
      ),
      cell: ({ row }) => <div className="text-right font-medium">{(row.getValue("targetAmount") as number).toLocaleString()}</div>,
    },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const target = row.original
        const progress = target.targetAmount > 0 ? (target.achievedAmount / target.targetAmount) * 100 : 0
        return (
          <div className="w-32 space-y-1">
            <Progress value={Math.min(progress, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">{progress.toFixed(1)}%</div>
          </div>
        )
      },
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="End Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("endDate") as string
        const isPast = new Date(date) < new Date()
        return (
          <div className={isPast ? "text-muted-foreground" : ""}>
            {format(new Date(date), "dd MMM yyyy")}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "achieved" ? "default" : status === "in_progress" ? "secondary" : "outline"}>
            {status.replace("_", " ")}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const target = row.original
        
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
              <Link href={`/sales/targets/${target.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" /> Update Progress
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export const columns: ColumnDef<SalesTarget>[] = createColumns()
