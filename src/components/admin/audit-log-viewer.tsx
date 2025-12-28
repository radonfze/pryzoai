"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function AuditLogViewer({ logs }: any) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>System Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Resource</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log: any) => (
                            <TableRow key={log.id}>
                                <TableCell>{format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                                <TableCell>{log.userName || "System"}</TableCell>
                                <TableCell className="font-semibold">{log.action}</TableCell>
                                <TableCell>{log.resourceType} : {log.resourceId}</TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                                    {JSON.stringify(log.changes || log.metadata)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">Success</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
