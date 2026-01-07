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

export type Quotation = {
  id: string
  quotationNumber: string
  quotationDate: Date | string
  customer: { name: string } | null
  totalAmount: string | null
  status: string
}

// Secure Actions Cell Component
function QuotationActionsCell({ quote, userId }: { quote: Quotation; userId: string }) {
  const router = useRouter()
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  
  const isIssued = quote.status === "issued" || quote.status === "sent"
  const isCancelled = quote.status === "cancelled"

  const handleEditSuccess = () => {
    router.push(`/sales/quotations/${quote.id}/edit`)
  }

  const handleCancel = async (reason: string) => {
    // TODO: Implement actual cancel action
    console.log("Cancelling quotation:", quote.id, "Reason:", reason)
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
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(quote.id)}>
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          <Link href={`/sales/quotations/${quote.id}`}>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
          </Link>
          
          {/* Edit - Requires Password */}
          {!isCancelled && (
            <DropdownMenuItem onClick={() => setShowEditPassword(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Quotation
            </DropdownMenuItem>
          )}
          
          {/* Cancel instead of Delete */}
          {!isCancelled && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowCancelDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <X className="mr-2 h-4 w-4" /> Cancel Quotation
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
        action="edit_quotation"
        targetTable="sales_quotations"
        targetId={quote.id}
        title="Edit Quotation"
        description={`Enter your edit password to modify ${quote.quotationNumber}.`}
        onSuccess={handleEditSuccess}
      />

      {/* Cancel Document Dialog */}
      <CancelDocumentDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        documentType="Quotation"
        documentNumber={quote.quotationNumber}
        onConfirm={handleCancel}
      />
    </>
  )
}

// Column factory that accepts userId
export function createColumns(userId: string): ColumnDef<Quotation>[] {
  return [
    {
      accessorKey: "quotationNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Quotation #" />
      ),
      cell: ({ row }) => <div className="font-mono">{row.getValue("quotationNumber")}</div>,
    },
    {
      accessorKey: "quotationDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("quotationDate")
        return (
          <div>
            {date ? format(new Date(date as string), "dd MMM yyyy") : "-"}
          </div>
        )
      },
    },
    {
      accessorKey: "customer.name",
      id: "customer",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => {
         const customer = row.original.customer
         return <div>{customer?.name || "-"}</div>
      }
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalAmount") || "0")
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
            status === "issued" ? "default" :
            status === "sent" ? "outline" :
            status === "cancelled" ? "destructive" : "secondary"
            
        return (
          <Badge variant={variant}>
            {status || "Draft"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <QuotationActionsCell quote={row.original} userId={userId} />,
    },
  ]
}

// Legacy export for backward compatibility
export const columns: ColumnDef<Quotation>[] = createColumns("")
