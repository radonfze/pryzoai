"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, LogIn } from "lucide-react";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before logout

interface AutoLogoutProviderProps {
  children: React.ReactNode;
}

export function AutoLogoutProvider({ children }: AutoLogoutProviderProps) {
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleSessionExpired = useCallback(() => {
    // Show session expired dialog instead of redirecting
    setShowExpiredDialog(true);
    // Clear the session quietly in the background
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }, []);

  const handleLoginClick = useCallback(() => {
    window.location.href = "/login";
  }, []);

  const showWarning = useCallback(() => {
    toast.warning("Your session will expire in 2 minutes due to inactivity. Move your mouse to stay logged in.", {
      duration: 10000,
    });
  }, []);

  const resetTimer = useCallback(() => {
    // Don't reset if session already expired
    if (showExpiredDialog) return;
    
    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Set warning timer (28 minutes)
    warningTimeoutRef.current = setTimeout(() => {
      showWarning();
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Set logout timer (30 minutes)
    timeoutRef.current = setTimeout(() => {
      handleSessionExpired();
    }, INACTIVITY_TIMEOUT);
  }, [handleSessionExpired, showWarning, showExpiredDialog]);

  useEffect(() => {
    // Events that indicate user activity
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Throttle the reset to avoid excessive timer resets
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledReset = () => {
      if (throttleTimer || showExpiredDialog) return;
      throttleTimer = setTimeout(() => {
        resetTimer();
        throttleTimer = null;
      }, 1000); // Throttle to once per second
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, throttledReset);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, throttledReset);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [resetTimer, showExpiredDialog]);

  return (
    <>
      {children}
      
      {/* Session Expired Dialog */}
      <Dialog open={showExpiredDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-center text-xl">Session Expired</DialogTitle>
            <DialogDescription className="text-center">
              Your session has expired due to inactivity. Please login again to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={handleLoginClick} className="gap-2">
              <LogIn className="h-4 w-4" />
              Login Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

