"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Pencil, MoreHorizontal, Eye, X } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditPasswordDialog, CancelDocumentDialog } from "@/components/security";
import { useRouter } from "next/navigation";

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

// Secure Actions Cell Component
function AdjustmentActionsCell({ adjustment, userId }: { adjustment: StockAdjustment; userId: string }) {
  const router = useRouter();
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  const isPosted = adjustment.isPosted;
  const isCancelled = adjustment.status === "cancelled";

  const handleEditSuccess = () => {
    router.push(`/inventory/adjustments/${adjustment.id}/edit`);
  };

  const handleCancel = async (reason: string) => {
    // TODO: Implement actual cancel action
    console.log("Cancelling adjustment:", adjustment.id, "Reason:", reason);
    return { success: false, error: "Cancel action not implemented yet" };
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          {/* Edit - Requires Password, only if not posted */}
          {!isPosted && !isCancelled && (
            <DropdownMenuItem onClick={() => setShowEditPassword(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          )}
          
          {/* Cancel instead of Delete */}
          {!isPosted && !isCancelled && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowCancelDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <X className="mr-2 h-4 w-4" /> Cancel Adjustment
              </DropdownMenuItem>
            </>
          )}
          
          {isPosted && (
            <DropdownMenuItem disabled className="text-muted-foreground">
              Posted - No actions available
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Password Dialog */}
      <EditPasswordDialog
        open={showEditPassword}
        onOpenChange={setShowEditPassword}
        userId={userId}
        action="edit_adjustment"
        targetTable="stock_adjustments"
        targetId={adjustment.id}
        title="Edit Stock Adjustment"
        description={`Enter your edit password to modify ${adjustment.adjustmentNumber}.`}
        onSuccess={handleEditSuccess}
      />

      {/* Cancel Document Dialog */}
      <CancelDocumentDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        documentType="Stock Adjustment"
        documentNumber={adjustment.adjustmentNumber}
        onConfirm={handleCancel}
      />
    </>
  );
}

// Column factory that accepts userId
export function createColumns(userId: string): ColumnDef<StockAdjustment>[] {
  return [
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
          <Badge variant={isPosted ? "default" : status === "draft" ? "secondary" : status === "cancelled" ? "destructive" : "outline"}>
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
      cell: ({ row }) => <AdjustmentActionsCell adjustment={row.original} userId={userId} />,
    },
  ];
}

// Legacy export for backward compatibility
export const columns: ColumnDef<StockAdjustment>[] = createColumns("");
