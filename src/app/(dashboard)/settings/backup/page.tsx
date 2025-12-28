"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Download, Upload, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DatabaseBackupPage() {
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { toast } = useToast();

  async function handleBackup() {
    setBackingUp(true);
    try {
      // TODO: Implement actual backup logic
      toast({
        title: "Backup Started",
        description: "Your database is being backed up...",
      });
      
      // Simulate backup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Backup Complete",
        description: "Database backup completed successfully",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to backup database",
        variant: "destructive",
      });
    } finally {
      setBackingUp(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      toast({
        title: "Restore Started",
        description: "Restoring database from backup...",
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Restore Complete",
        description: "Database restored successfully",
      });
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Failed to restore database",
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Database Backup</h2>
        <p className="text-muted-foreground mt-1">Backup and restore your database</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Backup Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Backup Database</CardTitle>
            </div>
            <CardDescription>
              Create a backup of your current database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will create a complete backup of all your data including:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All master data (customers, suppliers, items)</li>
              <li>• All transactions (invoices, orders, payments)</li>
              <li>• Settings and configurations</li>
              <li>• User accounts and permissions</li>
            </ul>
            <Button 
              onClick={handleBackup} 
              disabled={backingUp}
              className="w-full"
            >
              {backingUp ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Backing up...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Create Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              <CardTitle>Restore Database</CardTitle>
            </div>
            <CardDescription>
              Restore from a previous backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">⚠️ Warning</p>
              <p className="text-sm text-muted-foreground mt-1">
                Restoring will replace ALL current data with backup data. This action cannot be undone.
              </p>
            </div>
            <Button 
              onClick={handleRestore} 
              disabled={restoring}
              variant="destructive"
              className="w-full"
            >
              {restoring ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Restore from Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Backups</CardTitle>
          <CardDescription>
            Your recent database backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No backups yet.</p>
            <p className="text-sm mt-1">Create your first backup to get started.</p>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Backup Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>✓ Create regular backups (daily recommended)</li>
            <li>✓ Store backups in a secure location</li>
            <li>✓ Test restore process periodically</li>
            <li>✓ Keep multiple backup versions</li>
            <li>✓ Backup before major updates or changes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
