"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Search, ShieldCheck, ShieldX, Clock } from "lucide-react";

interface OtpLog {
  id: string;
  otpCode: string;
  purpose: string;
  targetTable: string | null;
  targetId: string | null;
  expiresAt: string | null;
  verifiedAt: string | null;
  createdAt: string | null;
  userName: string | null;
  userEmail: string | null;
}

interface OtpLogsClientProps {
  logs: OtpLog[];
}

export function OtpLogsClient({ logs }: OtpLogsClientProps) {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const searchLower = search.toLowerCase();
    return (
      log.userName?.toLowerCase().includes(searchLower) ||
      log.userEmail?.toLowerCase().includes(searchLower) ||
      log.targetTable?.toLowerCase().includes(searchLower) ||
      log.otpCode.includes(search)
    );
  });

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (log: OtpLog) => {
    const now = new Date();
    const expiresAt = log.expiresAt ? new Date(log.expiresAt) : null;

    if (log.verifiedAt) {
      return (
        <Badge className="bg-green-100 text-green-700">
          <ShieldCheck className="h-3 w-3 mr-1" /> Verified
        </Badge>
      );
    }
    if (expiresAt && expiresAt < now) {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" /> Expired
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-100 text-amber-700">
        <Clock className="h-3 w-3 mr-1" /> Pending
      </Badge>
    );
  };

  const getPurposeBadge = (purpose: string) => {
    const colors: Record<string, string> = {
      delete_master: "bg-red-100 text-red-700",
      reset_edit_password: "bg-blue-100 text-blue-700",
      cancel_document: "bg-purple-100 text-purple-700",
      admin_override: "bg-orange-100 text-orange-700",
    };
    return <Badge className={colors[purpose] || ""}>{purpose.replace("_", " ")}</Badge>;
  };

  // Stats
  const pending = logs.filter((l) => !l.verifiedAt && new Date(l.expiresAt!) > new Date()).length;
  const verified = logs.filter((l) => l.verifiedAt).length;
  const expired = logs.filter((l) => !l.verifiedAt && new Date(l.expiresAt!) <= new Date()).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by user, email, or table..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>OTP Code</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No OTP logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.userName || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded font-mono text-lg tracking-widest">
                        {log.otpCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopy(log.otpCode, log.id)}
                      >
                        {copiedId === log.id ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getPurposeBadge(log.purpose)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-mono text-xs">{log.targetTable || "-"}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(log)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {log.createdAt
                        ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })
                        : "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {log.expiresAt ? format(new Date(log.expiresAt), "HH:mm:ss") : "-"}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
