import { db } from "@/db";
import { purchaseRequests, purchaseLines } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, FileText } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import GradientHeader from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

export default async function ViewRequestPage({ params }: { params: { id: string } }) {
  const request = await db.query.purchaseRequests.findFirst({
    where: eq(purchaseRequests.id, params.id),
    with: {
      lines: {
        with: {
          item: true,
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    pending_approval: "bg-yellow-100 text-yellow-800",
    issued: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/procurement/requests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{request.requestNumber}</h1>
            <p className="text-sm text-muted-foreground">Purchase Request</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/procurement/requests/${request.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Request Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Request Number</p>
                <p className="text-base font-medium">{request.requestNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                  {request.status.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Request Date</p>
                <p className="text-base">{format(new Date(request.requestDate), "MMM dd, yyyy")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Required By</p>
                <p className="text-base">
                  {request.requiredDate ? format(new Date(request.requiredDate), "MMM dd, yyyy") : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Department</p>
                <p className="text-base">{request.department || "—"}</p>
              </div>
            </div>
            {request.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{request.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{request.lines?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm">{format(new Date(request.createdAt), "MMM dd, yyyy HH:mm")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requested Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase">Item</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {request.lines?.map((line: any, index: number) => (
                    <tr key={line.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm">{line.lineNumber}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{line.item?.name || "—"}</p>
                          {line.item?.code && (
                            <p className="text-xs text-muted-foreground">{line.item.code}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{line.quantity}</td>
                      <td className="px-4 py-3 text-sm">{line.uom}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {line.description || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
