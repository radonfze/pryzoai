import { db } from "@/db";
import { stockCounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";
import GradientHeader from "@/components/ui/gradient-header";
import { ClipboardList, ArrowLeft, Edit, CheckCircle } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface ViewStockCountPageProps {
  params: { id: string };
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  posted: "bg-purple-100 text-purple-700",
};

export default async function ViewStockCountPage({ params }: ViewStockCountPageProps) {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  const countData = await db.query.stockCounts.findFirst({
    where: and(eq(stockCounts.id, params.id), eq(stockCounts.companyId, companyId)),
    with: {
      warehouse: true,
      lines: {
        with: {
          item: true,
        },
      },
    },
  });

  if (!countData) {
    notFound();
  }

  const isEditable = countData.status === "draft" || countData.status === "in_progress";

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <GradientHeader
          module="inventory"
          title={`Stock Count: ${countData.countNumber}`}
          description={countData.notes || "Stock count details"}
          icon={ClipboardList}
        />
        <div className="flex gap-2">
          <Link href="/inventory/count">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          {isEditable && (
            <Link href={`/inventory/count/${params.id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Count Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Count Number</label>
                <p className="font-mono">{countData.countNumber}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Status</label>
                <p>
                  <Badge className={statusColors[countData.status] || "bg-gray-100"}>
                    {countData.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Warehouse</label>
                <p className="font-medium">{(countData as any).warehouse?.name || "—"}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Count Date</label>
                <p>{formatDate(countData.countDate)}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Type</label>
                <p className="capitalize">{countData.countType}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Created</label>
                <p className="text-sm">{formatDate(countData.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Count Lines ({(countData as any).lines?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-auto">
              {(countData as any).lines?.map((line: any) => {
                const variance = parseFloat(line.countedQty || "0") - parseFloat(line.systemQty || "0");
                return (
                  <div key={line.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{line.item?.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{line.item?.code}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">System:</span>{" "}
                          <span className="font-medium tabular-nums">{line.systemQty}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Counted:</span>{" "}
                          <span className="font-medium tabular-nums">{line.countedQty || "—"}</span>
                        </div>
                      </div>
                      {line.countedQty && (
                        <p className={`text-xs font-medium ${variance !== 0 ? (variance > 0 ? "text-green-600" : "text-red-600") : "text-gray-500"}`}>
                          Variance: {variance > 0 ? "+" : ""}{variance}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {!(countData as any).lines?.length && (
                <p className="text-muted-foreground text-center py-4">No items to count</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
