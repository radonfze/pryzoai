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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { verifyEditPassword } from "@/lib/services/security-service";

interface EditPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  action: string;
  targetTable: string;
  targetId: string;
  title?: string;
  description?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function EditPasswordDialog({
  open,
  onOpenChange,
  userId,
  action,
  targetTable,
  targetId,
  title = "Edit Password Required",
  description = "Enter your edit password to proceed with this action.",
  onSuccess,
  onCancel,
}: EditPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!password) {
      setError("Please enter your edit password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyEditPassword(
        userId,
        password,
        action,
        targetTable,
        targetId
      );

      if (result.success) {
        setPassword("");
        onOpenChange(false);
        onSuccess();
      } else {
        setError(result.error || "Verification failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError(null);
    onOpenChange(false);
    onCancel?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-password">Edit Password</Label>
            <Input
              id="edit-password"
              type="password"
              placeholder="Enter your edit password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
