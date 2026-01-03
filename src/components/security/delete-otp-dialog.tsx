"use client";

import { useState, useEffect } from "react";
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
import { Loader2, ShieldAlert, Mail, Copy, Check } from "lucide-react";
import { generateOtp, verifyOtp } from "@/lib/services/security-service";
import { toast } from "sonner";

interface DeleteOtpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  targetTable: string;
  targetId: string;
  itemName?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function DeleteOtpDialog({
  open,
  onOpenChange,
  userId,
  targetTable,
  targetId,
  itemName = "this item",
  onSuccess,
  onCancel,
}: DeleteOtpDialogProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [displayOtp, setDisplayOtp] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<string>("toast");
  const [copied, setCopied] = useState(false);

  // Send OTP when dialog opens
  useEffect(() => {
    if (open && !otpSent) {
      handleSendOtp();
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    setIsSending(true);
    setError(null);
    setDisplayOtp(null);

    try {
      const result = await generateOtp(userId, "delete_master", targetTable, targetId, itemName);
      
      if (result.success) {
        setOtpSent(true);
        setCountdown(300); // 5 minutes
        setDeliveryMethod(result.deliveryMethod || "toast");
        
        // If OTP returned (dev mode), show it in toast and display
        if (result.otpCode) {
          setDisplayOtp(result.otpCode);
          toast.info(`Your OTP: ${result.otpCode}`, {
            description: "Valid for 5 minutes",
            duration: 10000,
          });
        } else if (result.deliveryMethod === "email") {
          toast.success("OTP sent to your email", {
            description: "Check your inbox",
          });
        }
      } else {
        setError(result.error || "Failed to send OTP");
      }
    } catch (err) {
      setError("Failed to send OTP");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyOtp = () => {
    if (displayOtp) {
      navigator.clipboard.writeText(displayOtp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyOtp(userId, otp, "delete_master");

      if (result.success) {
        setOtp("");
        setOtpSent(false);
        setDisplayOtp(null);
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
    setOtp("");
    setError(null);
    setOtpSent(false);
    setCountdown(0);
    setDisplayOtp(null);
    onOpenChange(false);
    onCancel?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Delete Confirmation Required
          </DialogTitle>
          <DialogDescription>
            You are about to delete <strong>{itemName}</strong>. 
            {deliveryMethod === "email" 
              ? " An OTP has been sent to your email."
              : " Enter the OTP code below to confirm."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {otpSent ? (
            <>
              {/* OTP Display for Dev Mode */}
              {displayOtp && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border border-purple-200 dark:border-purple-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                      🔐 Your OTP Code (Development Mode)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyOtp}
                      className="h-6 px-2"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="text-3xl font-mono font-bold text-center tracking-[0.5em] text-purple-700 dark:text-purple-300">
                    {displayOtp}
                  </div>
                </div>
              )}

              {/* Email Delivery Info */}
              {deliveryMethod === "email" && !displayOtp && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  <Mail className="h-4 w-4" />
                  OTP sent to your email!
                  {countdown > 0 && (
                    <span className="ml-auto font-mono">{formatTime(countdown)}</span>
                  )}
                </div>
              )}

              {/* Countdown for toast mode */}
              {displayOtp && countdown > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  Expires in <span className="font-mono font-medium">{formatTime(countdown)}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp">Enter 6-digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  className="text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
              </div>

              {countdown === 0 && (
                <Button variant="ghost" size="sm" onClick={handleSendOtp} disabled={isSending}>
                  {isSending ? "Sending..." : "Resend OTP"}
                </Button>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Sending OTP...</span>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleVerify} 
            disabled={isLoading || !otpSent}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Confirm Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
