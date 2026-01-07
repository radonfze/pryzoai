"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, Printer, X } from "lucide-react"
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
import { EditPasswordDialog, CancelDocumentDialog } from "@/components/security"
import { useRouter } from "next/navigation"

export type Invoice = {
  id: string
  invoiceNumber: string
  invoiceDate: Date | string
  dueDate: Date | string
  status: string
  totalAmount: string
  balanceAmount: string
  isPosted?: boolean
  customer: {
    name: string
  }
}

// Secure Actions Cell Component
function InvoiceActionsCell({ invoice, userId }: { invoice: Invoice; userId: string }) {
  const router = useRouter()
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  
  const isPosted = invoice.isPosted || invoice.status === "completed" || invoice.status === "issued"
  const isCancelled = invoice.status === "cancelled" || invoice.status === "void"

  const handleEditSuccess = () => {
    router.push(`/sales/invoices/${invoice.id}/edit`)
  }

  const handleCancel = async (reason: string) => {
    try {
        const { cancelInvoiceAction } = await import("@/actions/sales/cancel-invoice");
        const result = await cancelInvoiceAction(invoice.id, reason);
        if (result.success) {
            router.refresh();
            return { success: true };
        } else {
            return { success: false, error: result.message };
        }
    } catch (error) {
        console.error("Cancel failed", error);
        return { success: false, error: "Failed to invoke cancel action" };
    }
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
          <Link href={`/sales/invoices/${invoice.id}`}>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
          </Link>
          
          {/* Edit - Requires Password */}
          {!isPosted && !isCancelled && (
            <DropdownMenuItem onClick={() => setShowEditPassword(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          )}
          
          <Link href={`/api/sales/invoices/${invoice.id}/pdf`} target="_blank">
            <DropdownMenuItem>
              <Printer className="mr-2 h-4 w-4" /> Print PDF
            </DropdownMenuItem>
          </Link>
          
          {/* Cancel instead of Delete */}
          {!isCancelled && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowCancelDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <X className="mr-2 h-4 w-4" /> Cancel Invoice
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
        action="edit_invoice"
        targetTable="sales_invoices"
        targetId={invoice.id}
        title="Edit Invoice"
        description={`Enter your edit password to modify ${invoice.invoiceNumber}.`}
        onSuccess={handleEditSuccess}
      />

      {/* Cancel Document Dialog */}
      <CancelDocumentDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        documentType="Invoice"
        documentNumber={invoice.invoiceNumber}
        onConfirm={handleCancel}
      />
    </>
  )
}

// Column factory that accepts userId
export function createColumns(userId: string): ColumnDef<Invoice>[] {
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
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice #" />
      ),
      cell: ({ row }) => <div className="font-mono font-medium">{row.getValue("invoiceNumber")}</div>,
    },
    {
      accessorKey: "customer.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
    },
    {
      accessorKey: "invoiceDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => <div>{format(new Date(row.getValue("invoiceDate")), "dd MMM yyyy")}</div>,
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => <div>{format(new Date(row.getValue("dueDate")), "dd MMM yyyy")}</div>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "issued" || status === "completed" ? "default" : status === "draft" ? "secondary" : status === "cancelled" ? "destructive" : "outline"}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      cell: ({ row }) => <div className="text-right font-medium">{Number(row.getValue("totalAmount")).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>,
    },
    {
      accessorKey: "balanceAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Balance" />
      ),
      cell: ({ row }) => <div className="text-right text-muted-foreground">{Number(row.getValue("balanceAmount")).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => <InvoiceActionsCell invoice={row.original} userId={userId} />,
    },
  ]
}

// Legacy export for backward compatibility (uses empty userId - dialogs will fail)
export const columns: ColumnDef<Invoice>[] = createColumns("")
