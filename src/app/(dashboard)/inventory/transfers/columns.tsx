"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, X } from "lucide-react"
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
import { EditPasswordDialog, CancelDocumentDialog } from "@/components/security"
import { useRouter } from "next/navigation"

export type StockTransfer = {
  id: string
  transferNumber: string
  transferDate: Date | string | null
  fromWarehouse: { name: string } | null
  toWarehouse: { name: string } | null
  status: string | null
}

// Secure Actions Cell Component
function TransferActionsCell({ transfer, userId }: { transfer: StockTransfer; userId: string }) {
  const router = useRouter()
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  
  const isCompleted = transfer.status === "completed"
  const isCancelled = transfer.status === "cancelled"

  const handleEditSuccess = () => {
    router.push(`/inventory/transfers/${transfer.id}/edit`)
  }

  const handleCancel = async (reason: string) => {
    // TODO: Implement actual cancel action
    console.log("Cancelling transfer:", transfer.id, "Reason:", reason)
    return { success: false, error: "Cancel action not implemented yet" }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(transfer.id)}>
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          <Link href={`/inventory/transfers/${transfer.id}`}>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
          </Link>
          
          {/* Edit - Requires Password */}
          {!isCompleted && !isCancelled && (
            <DropdownMenuItem onClick={() => setShowEditPassword(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Transfer
            </DropdownMenuItem>
          )}
          
          {/* Cancel instead of Delete */}
          {!isCompleted && !isCancelled && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowCancelDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <X className="mr-2 h-4 w-4" /> Cancel Transfer
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Password Dialog */}
      <EditPasswordDialog
        open={showEditPassword}
        onOpenChange={setShowEditPassword}
        userId={userId}
        action="edit_transfer"
        targetTable="stock_transfers"
        targetId={transfer.id}
        title="Edit Stock Transfer"
        description={`Enter your edit password to modify ${transfer.transferNumber}.`}
        onSuccess={handleEditSuccess}
      />

      {/* Cancel Document Dialog */}
      <CancelDocumentDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        documentType="Stock Transfer"
        documentNumber={transfer.transferNumber}
        onConfirm={handleCancel}
      />
    </>
  )
}

// Column factory that accepts userId
export function createColumns(userId: string): ColumnDef<StockTransfer>[] {
  return [
    {
      accessorKey: "transferNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transfer #" />
      ),
      cell: ({ row }) => <div className="font-mono">{row.getValue("transferNumber")}</div>,
    },
    {
      accessorKey: "transferDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("transferDate")
        return (
          <div>
            {date ? format(new Date(date as string), "dd MMM yyyy") : "-"}
          </div>
        )
      },
    },
    {
      accessorKey: "fromWarehouse.name",
      id: "fromWarehouse",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="From Warehouse" />
      ),
      cell: ({ row }) => {
         const warehouse = row.original.fromWarehouse
         return <div>{warehouse?.name || "-"}</div>
      }
    },
    {
      accessorKey: "toWarehouse.name",
      id: "toWarehouse",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="To Warehouse" />
      ),
      cell: ({ row }) => {
         const warehouse = row.original.toWarehouse
         return <div>{warehouse?.name || "-"}</div>
      }
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "completed" ? "default" : status === "cancelled" ? "destructive" : "secondary"}>
            {status || "Draft"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <TransferActionsCell transfer={row.original} userId={userId} />,
    },
  ]
}

// Legacy export for backward compatibility
export const columns: ColumnDef<StockTransfer>[] = createColumns("")
