"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { requestAdminOtp, verifyResetOtp, resetPassword } from "@/actions/auth/reset-password";
import { toast } from "sonner";

export function ForgotPasswordDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [loading, setLoading] = useState(false);
  
  // Data
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRequestOtp = async () => {
    if (!email) {
        toast.error("Please enter your email");
        return;
    }
    setLoading(true);
    try {
        const res = await requestAdminOtp(email);
        if (res.success) {
            toast.success(res.message);
            setStep("otp");
        } else {
            toast.error(res.error || "Failed to request OTP");
        }
    } catch (err) {
        toast.error("An error occurred");
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
        toast.error("Please enter the OTP");
        return;
    }
    setLoading(true);
    try {
        const res = await verifyResetOtp(email, otp);
        if (res.success) {
            toast.success("OTP Verified");
            setStep("reset");
        } else {
            toast.error(res.error || "Invalid OTP");
        }
    } catch (err) {
        toast.error("An error occurred");
    } finally {
        setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
        toast.error("Please enter new password");
        return;
    }
    if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
    }
    setLoading(true);
    try {
        const res = await resetPassword(email, otp, newPassword);
        if (res.success) {
            toast.success(res.message);
            setOpen(false);
            // Reset state
            setStep("email");
            setEmail("");
            setOtp("");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            toast.error(res.error || "Failed to reset password");
        }
    } catch (err) {
        toast.error("An error occurred");
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-sm text-primary hover:underline">
          Forgot password?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            {step === "email" && "Enter your email to receive an Admin OTP."}
            {step === "otp" && `Enter the OTP sent to the admin for ${email}.`}
            {step === "reset" && "Enter your new password."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {step === "email" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reset-email" className="text-right">
                Email
              </Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                placeholder="name@company.com"
              />
            </div>
          )}

          {step === "otp" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="otp-code" className="text-right">
                OTP
              </Label>
              <Input
                id="otp-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="col-span-3"
                placeholder="123456"
              />
            </div>
          )}

          {step === "reset" && (
            <>
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-pass" className="text-right">
                    New Pass
                </Label>
                <Input
                    id="new-pass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="col-span-3"
                />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="conf-pass" className="text-right">
                    Confirm
                </Label>
                <Input
                    id="conf-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="col-span-3"
                />
                </div>
            </>
          )}
        </div>

        <DialogFooter>
          {step === "email" && (
            <Button onClick={handleRequestOtp} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Request OTP
            </Button>
          )}
          {step === "otp" && (
            <Button onClick={handleVerifyOtp} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify OTP
            </Button>
          )}
          {step === "reset" && (
            <Button onClick={handleResetPassword} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
