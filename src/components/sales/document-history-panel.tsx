"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDocumentHistory } from "@/lib/services/document-history-service";
import { format } from "date-fns";
import { 
  FileText, 
  Edit, 
  Mail, 
  Printer, 
  CheckCircle, 
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react";

interface DocumentHistoryPanelProps {
  documentId: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <FileText className="h-4 w-4 text-green-500" />,
  UPDATE: <Edit className="h-4 w-4 text-blue-500" />,
  STATUS_CHANGE: <Clock className="h-4 w-4 text-yellow-500" />,
  EMAIL_SENT: <Mail className="h-4 w-4 text-purple-500" />,
  PRINTED: <Printer className="h-4 w-4 text-gray-500" />,
  POSTED: <CheckCircle className="h-4 w-4 text-green-600" />,
  CANCELLED: <XCircle className="h-4 w-4 text-red-500" />,
  PAYMENT_RECEIVED: <DollarSign className="h-4 w-4 text-emerald-500" />,
};

const actionLabels: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  STATUS_CHANGE: "Status Changed",
  EMAIL_SENT: "Email Sent",
  PRINTED: "Printed",
  POSTED: "Posted to GL",
  CANCELLED: "Cancelled",
  REVERSED: "Reversed",
  PAYMENT_RECEIVED: "Payment Received",
};

export default function DocumentHistoryPanel({ documentId }: DocumentHistoryPanelProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getDocumentHistory(documentId);
        setHistory(data);
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [documentId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No history available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={entry.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {actionIcons[entry.action] || <FileText className="h-4 w-4" />}
                </div>
                {index < history.length - 1 && (
                  <div className="w-px flex-1 bg-border" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {actionLabels[entry.action] || entry.action}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {format(new Date(entry.createdAt), "MMM d, h:mm a")}
                  </Badge>
                </div>
                {entry.performer && (
                  <p className="text-xs text-muted-foreground">
                    by {entry.performer.firstName} {entry.performer.lastName}
                  </p>
                )}
                {entry.changes && Object.keys(entry.changes).length > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {Object.entries(entry.changes).slice(0, 2).map(([key, val]) => (
                      <span key={key} className="mr-2">
                        {key}: {String(val)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
