"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Check } from "lucide-react";
import { setEditPassword } from "@/lib/services/security-service";

interface SetEditPasswordDialogProps {
  userId: string;
  hasExisting?: boolean;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function SetEditPasswordDialog({
  userId,
  hasExisting = false,
  trigger,
  onSuccess,
}: SetEditPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (password.length < 6) {
      setError("Edit password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const result = await setEditPassword(userId, password);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setPassword("");
          setConfirmPassword("");
          setSuccess(false);
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error || "Failed to set edit password");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <KeyRound className="h-4 w-4" />
            {hasExisting ? "Change Edit Password" : "Set Edit Password"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            {hasExisting ? "Change Edit Password" : "Set Edit Password"}
          </DialogTitle>
          <DialogDescription>
            {hasExisting 
              ? "Enter a new edit password. This will be required when editing any documents or master data."
              : "Set a separate password for editing documents. This adds an extra layer of security for modifications."
            }
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-medium text-green-600 dark:text-green-400">
              Edit Password Set Successfully!
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-edit-password">New Edit Password</Label>
                <Input
                  id="new-edit-password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-edit-password">Confirm Edit Password</Label>
                <Input
                  id="confirm-edit-password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Edit Password"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
