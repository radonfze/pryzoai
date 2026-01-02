"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Eye, Trash2 } from "lucide-react"
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
import { EditPasswordDialog, DeleteOtpDialog } from "@/components/security"
import { useRouter } from "next/navigation"

export type Customer = {
  id: string
  name: string
  code: string
  phone: string | null
  email: string | null
  taxId: string | null
  isActive: boolean
}

// Secure Actions Cell Component
function CustomerActionsCell({ customer, userId }: { customer: Customer; userId: string }) {
  const router = useRouter()
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [showDeleteOtp, setShowDeleteOtp] = useState(false)

  const handleEditSuccess = () => {
    router.push(`/settings/customers/${customer.id}/edit`)
  }

  const handleDeleteSuccess = () => {
    // TODO: Implement actual delete action after OTP verification
    console.log("Deleting customer:", customer.id)
    router.refresh()
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
          
          <Link href={`/settings/customers/${customer.id}`}>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
          </Link>
          
          {/* Edit - Requires Password */}
          <DropdownMenuItem onClick={() => setShowEditPassword(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          
          {/* Delete - Requires OTP */}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteOtp(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Password Dialog */}
      <EditPasswordDialog
        open={showEditPassword}
        onOpenChange={setShowEditPassword}
        userId={userId}
        action="edit_customer"
        targetTable="customers"
        targetId={customer.id}
        title="Edit Customer"
        description={`Enter your edit password to modify ${customer.name}.`}
        onSuccess={handleEditSuccess}
      />

      {/* Delete OTP Dialog */}
      <DeleteOtpDialog
        open={showDeleteOtp}
        onOpenChange={setShowDeleteOtp}
        userId={userId}
        targetTable="customers"
        targetId={customer.id}
        itemName={customer.name}
        onSuccess={handleDeleteSuccess}
      />
    </>
  )
}

// Column factory that accepts userId
export function createColumns(userId: string): ColumnDef<Customer>[] {
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
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Code" />
      ),
      cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("code")}</div>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      accessorKey: "taxId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="TRN" />
      ),
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const isActive = row.getValue("isActive")
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <CustomerActionsCell customer={row.original} userId={userId} />,
    },
  ]
}

// Legacy export for backward compatibility
export const columns: ColumnDef<Customer>[] = createColumns("")
