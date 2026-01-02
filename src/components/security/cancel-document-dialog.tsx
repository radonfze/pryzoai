"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Ban } from "lucide-react";

interface CancelDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: string;
  documentNumber: string;
  onConfirm: (reason: string) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
}

export function CancelDocumentDialog({
  open,
  onOpenChange,
  documentType,
  documentNumber,
  onConfirm,
  onCancel,
}: CancelDocumentDialogProps) {
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for cancellation");
      return;
    }

    if (!confirmed) {
      setError("Please confirm that you understand this action is irreversible");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onConfirm(reason);

      if (result.success) {
        setReason("");
        setConfirmed(false);
        onOpenChange(false);
      } else {
        setError(result.error || "Cancellation failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setConfirmed(false);
    setError(null);
    onOpenChange(false);
    onCancel?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Ban className="h-5 w-5" />
            Cancel {documentType}
          </DialogTitle>
          <DialogDescription>
            You are about to cancel <strong>{documentNumber}</strong>.
            This will reverse all related transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason for Cancellation *</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Enter the reason for cancelling this document..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
              autoFocus
            />
          </div>

          <div className="flex items-start space-x-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
            <Checkbox
              id="confirm-cancel"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <label
              htmlFor="confirm-cancel"
              className="text-sm text-amber-800 dark:text-amber-200 leading-tight cursor-pointer"
            >
              I understand that this action will reverse all GL entries, stock movements, 
              and other related transactions. This action cannot be undone.
            </label>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Keep Document
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={isLoading || !reason.trim() || !confirmed}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Document"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
