import { db } from "@/db";
import { bom } from "@/db/schema/items";
import { eq, and } from "drizzle-orm";
import { getCompanyIdSafe } from "@/lib/auth";
import GradientHeader from "@/components/ui/gradient-header";
import { FileText, ArrowLeft, Edit } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface ViewBomPageProps {
  params: { id: string };
}

export default async function ViewBomPage({ params }: ViewBomPageProps) {
  const companyId = await getCompanyIdSafe();
  if (!companyId) return null;

  const bomData = await db.query.bom.findFirst({
    where: and(eq(bom.id, params.id), eq(bom.companyId, companyId)),
    with: {
      parentItem: true,
      lines: {
        with: {
          componentItem: true,
        },
      },
    },
  });

  if (!bomData) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <GradientHeader
          module="inventory"
          title={`BOM: ${bomData.bomNumber || "View"}`}
          description={bomData.description || "Bill of Materials details"}
          icon={FileText}
        />
        <div className="flex gap-2">
          <Link href="/inventory/bom">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          <Link href={`/inventory/bom/${params.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>BOM Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">BOM Number</label>
                <p className="font-mono">{bomData.bomNumber}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Status</label>
                <p>
                  <Badge variant={bomData.isActive ? "default" : "secondary"}>
                    {bomData.isActive ? "Active" : "Inactive"}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Parent Item</label>
                <p className="font-medium">{(bomData as any).parentItem?.name || "—"}</p>
                <p className="text-xs text-muted-foreground">{(bomData as any).parentItem?.code}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Output Quantity</label>
                <p className="font-medium">{bomData.outputQty} {bomData.uom}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Effective Date</label>
                <p>{bomData.effectiveDate ? formatDate(bomData.effectiveDate) : "—"}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Created</label>
                <p className="text-sm">{formatDate(bomData.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Components ({(bomData as any).lines?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(bomData as any).lines?.map((line: any) => (
                <div key={line.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{line.componentItem?.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{line.componentItem?.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium tabular-nums">{line.quantity} {line.uom}</p>
                    {line.isOptional && (
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    )}
                  </div>
                </div>
              ))}
              {(!bomData as any).lines?.length && (
                <p className="text-muted-foreground text-center py-4">No components added</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
