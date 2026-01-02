"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, X, Printer, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditPasswordDialog, CancelDocumentDialog } from "@/components/security";

interface SecureDocumentActionsProps {
  documentId: string;
  documentNumber: string;
  documentType: "Invoice" | "Sales Order" | "Quotation" | "Payment" | "Credit Note";
  basePath: string;
  userId: string;
  status: string;
  canEdit?: boolean;
  canCancel?: boolean;
  showPrint?: boolean;
  onCancel?: (reason: string) => Promise<{ success: boolean; error?: string }>;
}

export function SecureDocumentActions({
  documentId,
  documentNumber,
  documentType,
  basePath,
  userId,
  status,
  canEdit = true,
  canCancel = true,
  showPrint = false,
  onCancel,
}: SecureDocumentActionsProps) {
  const router = useRouter();
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Disabled states
  const isPosted = status === "issued" || status === "completed" || status === "posted";
  const isCancelled = status === "cancelled" || status === "void";

  const handleEditClick = () => {
    setShowEditPassword(true);
  };

  const handleEditSuccess = () => {
    router.push(`${basePath}/${documentId}/edit`);
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const defaultCancelHandler = async (reason: string) => {
    // This should be overridden by the onCancel prop
    console.log("Cancel requested with reason:", reason);
    return { success: false, error: "Cancel handler not provided" };
  };

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
          
          {/* View - Always available */}
          <Link href={`${basePath}/${documentId}`}>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
          </Link>

          {/* Edit - Requires Edit Password */}
          {canEdit && !isPosted && !isCancelled && (
            <DropdownMenuItem onClick={handleEditClick}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          )}

          {/* Print PDF */}
          {showPrint && (
            <Link href={`/api/sales/invoices/${documentId}/pdf`} target="_blank">
              <DropdownMenuItem>
                <Printer className="mr-2 h-4 w-4" /> Print PDF
              </DropdownMenuItem>
            </Link>
          )}

          <DropdownMenuSeparator />

          {/* Cancel - Instead of Delete */}
          {canCancel && !isCancelled && onCancel && (
            <DropdownMenuItem 
              onClick={handleCancelClick}
              className="text-destructive focus:text-destructive"
            >
              <X className="mr-2 h-4 w-4" /> Cancel {documentType}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Password Dialog */}
      <EditPasswordDialog
        open={showEditPassword}
        onOpenChange={setShowEditPassword}
        userId={userId}
        action={`edit_${documentType.toLowerCase().replace(" ", "_")}`}
        targetTable={documentType.toLowerCase().replace(" ", "_") + "s"}
        targetId={documentId}
        title={`Edit ${documentType}`}
        description={`Enter your edit password to modify ${documentNumber}.`}
        onSuccess={handleEditSuccess}
      />

      {/* Cancel Document Dialog */}
      <CancelDocumentDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        documentType={documentType}
        documentNumber={documentNumber}
        onConfirm={onCancel || defaultCancelHandler}
      />
    </>
  );
}
