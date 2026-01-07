"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Lock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Constants
const TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour
const WARNING_DURATION = 30 * 1000;      // 30 seconds
const INACTIVITY_CHECK_INTERVAL = 1000;  // 1 second

// For testing purposes (uncomment to test quickly)
// const TIMEOUT_DURATION = 10 * 1000; // 10s
// const WARNING_DURATION = 5 * 1000;  // 5s

export function SessionMonitor() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Timestamps
  const lastActivityRef = useRef<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number>(TIMEOUT_DURATION);
  const [isWarning, setIsWarning] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  
  // Login State (for modal)
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Skip monitoring on public pages
  const isPublicPage = ["/login", "/register", "/forgot-password"].some(path => pathname?.startsWith(path));

  // Activity Listeners
  useEffect(() => {
    if (isPublicPage) return;

    const updateActivity = () => {
      // Only update if we are not already in warning/logout state to avoid spamming updates that might cancel the countdown if we wanted strictly "idle"
      // However, typical behavior is any activity resets the timer.
      // If we are in warning state, activity should dismiss it.
      if (!isLoggedOut) {
         lastActivityRef.current = Date.now();
         if (isWarning) {
             setIsWarning(false);
             setTimeLeft(TIMEOUT_DURATION);
         }
      }
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    
    // Throttle event listeners for performance
    let throttleTimer: NodeJS.Timeout;
    const throttledUpdate = () => {
        if (!throttleTimer) {
            throttleTimer = setTimeout(() => {
                updateActivity();
                // @ts-ignore
                throttleTimer = null;
            }, 1000); // Max once per second
        }
    };

    events.forEach(event => window.addEventListener(event, throttledUpdate));
    
    return () => {
      events.forEach(event => window.removeEventListener(event, throttledUpdate));
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isPublicPage, isWarning, isLoggedOut]);

  // Timer Check
  useEffect(() => {
    if (isPublicPage || isLoggedOut) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      const remaining = TIMEOUT_DURATION - timeSinceLastActivity;
      
      setTimeLeft(remaining);

      // Warning Threshold
      if (remaining <= WARNING_DURATION && remaining > 0) {
        if (!isWarning) setIsWarning(true);
      }
      
      // Logout Threshold
      if (remaining <= 0) {
        handleLogout();
      }
    }, INACTIVITY_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isPublicPage, isLoggedOut, isWarning]);

  // Logout Handler
  const handleLogout = async () => {
    setIsLoggedOut(true);
    setIsWarning(false);
    
    // We don't verify server logout heavily here, we just assume client state is "expired"
    // Ideally we call the server to kill the cookie
    try {
        await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
        console.error("Failed to call logout endpoint", e);
    }
    
    // We stay on the page but show the login modal
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
       const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
         // Restore session state
         lastActivityRef.current = Date.now();
         setIsLoggedOut(false);
         setLoginPassword(""); // Clear sensitive data
         setLoginEmail("");
         toast.success("Session restored welcome back!");
         router.refresh();
      } else {
         setLoginError(data.error || "Login failed");
      }
    } catch (err: any) {
        setLoginError("Login failed");
    } finally {
        setLoginLoading(false);
    }
  };

  const formatTime = (ms: number) => {
      const seconds = Math.floor((ms / 1000) % 60);
      return `${seconds}s`;
  };

  if (isPublicPage) return null;

  return (
    <>
      {/* Warning Dialog */}
      <Dialog open={isWarning} onOpenChange={(open) => !open && setIsWarning(false)}>
        <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2 text-orange-600">
               <Loader2 className="h-5 w-5 animate-spin" />
               Inactivity Warning
             </DialogTitle>
             <DialogDescription>
               You have been inactive for a while. You will be logged out in <span className="font-bold text-foreground">{formatTime(timeLeft)}</span>.
             </DialogDescription>
           </DialogHeader>
           <DialogFooter>
             <Button variant="outline" onClick={() => handleLogout()}>Logout Now</Button>
             <Button onClick={() => {
                // Activity listener handles the actual reset, but concise manually here too
                lastActivityRef.current = Date.now();
                setIsWarning(false);
             }}>
               Stay Logged In
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout / Re-login Modal */}
      {isLoggedOut && (
          <div className="fixed inset-0 z-[50] flex items-center justify-center bg-background/80 backdrop-blur-sm">
             <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                      <Lock className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle>Session Expired</CardTitle>
                    <CardDescription>
                        You have been logged out due to inactivity (1 hour).<br/>
                        Please sign in again to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {loginError && (
                          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                            {loginError}
                          </div>
                        )}
                        <div className="space-y-2">
                           <Label>Email</Label>
                           <Input 
                             type="email" 
                             placeholder="name@company.com"
                             value={loginEmail}
                             onChange={(e) => setLoginEmail(e.target.value)}
                             required 
                           />
                        </div>
                        <div className="space-y-2">
                           <Label>Password</Label>
                           <Input 
                             type="password" 
                             placeholder="••••••••"
                             value={loginPassword}
                             onChange={(e) => setLoginPassword(e.target.value)}
                             required 
                           />
                        </div>
                        <Button type="submit" className="w-full" disabled={loginLoading}>
                            {loginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In to Resume
                        </Button>
                    </form>
                    <div className="mt-4 text-center">
                        <Button variant="link" onClick={() => window.location.href = '/login'}>
                            Go to Login Page
                        </Button>
                    </div>
                </CardContent>
             </Card>
          </div>
      )}
    </>
  );
}
