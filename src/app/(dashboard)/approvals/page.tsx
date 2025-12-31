import { db } from "@/db";
import { approvalRequests, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import ApprovalActions from "@/components/approvals/approval-actions"; // Client component we'll create next

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const companyId = await getCompanyId();

  // Fetch Pending Requests
  const requests = await db.query.approvalRequests.findMany({
    where: and(
        eq(approvalRequests.companyId, companyId),
        eq(approvalRequests.status, "PENDING")
    ),
    with: {
        requestedByUser: true,
        rule: true
    },
    orderBy: [desc(approvalRequests.requestedAt)]
  });

  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <GradientHeader
        module="settings" 
        title="Approvals"
        description="Manage pending requests and workflow tasks."
        icon={Clock}
      />

      <div className="grid gap-4">
        {requests.length === 0 ? (
            <Card>
                <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                    No pending approval requests.
                </CardContent>
            </Card>
        ) : (
            requests.map(req => (
                <Card key={req.id} className="overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-l-4 border-l-yellow-500">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">{req.documentType.toUpperCase()} #{req.documentNumber}</span>
                                <Badge variant="outline">{req.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Requested by <span className="font-medium text-foreground">{req.requestedByUser?.name}</span> on {new Date(req.requestedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Rule: {req.rule?.name}</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* View Document Link */}
                            <a href={`/sales/invoices/${req.documentId}`} target="_blank" className="text-sm underline text-blue-600 hover:text-blue-800 mr-4">
                                View Document
                            </a>
                            
                            {/* Actions */}
                            <ApprovalActions requestId={req.id} />
                        </div>
                    </div>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}
