"use client";

import { SetEditPasswordDialog } from "@/components/security";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Check, X } from "lucide-react";

interface SecuritySettingsCardProps {
  userId: string;
  hasEditPassword: boolean;
}

export function SecuritySettingsCard({ userId, hasEditPassword }: SecuritySettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Manage your edit password and security preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Edit Password</span>
              {hasEditPassword ? (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                  <Check className="h-3 w-3" /> Set
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  <X className="h-3 w-3" /> Not Set
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              A separate password required when editing documents or master data.
            </p>
          </div>
          <SetEditPasswordDialog 
            userId={userId} 
            hasExisting={hasEditPassword}
          />
        </div>

        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Why Edit Password?</strong>
          <p className="mt-1">
            The edit password provides an extra layer of security. Even if someone gains access to your session, 
            they cannot modify critical records without knowing your edit password.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
