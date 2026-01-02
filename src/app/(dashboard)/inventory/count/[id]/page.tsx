
import { db } from "@/db";
import { stockCounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId, getUserPermissions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { StockCountSheet } from "@/components/inventory/stock-count-sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ViewStockCountPageProps {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

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
        orderBy: (lines, { asc }) => [asc(lines.item.name)], // Order by Item Name
      },
    },
  });

  if (!countData) {
    notFound();
  }

  // Serialize dates for Client Component
  const serializedCount = {
    ...countData,
    createdAt: countData.createdAt?.toISOString() ?? null,
    updatedAt: countData.updatedAt?.toISOString() ?? null,
    countDate: countData.countDate ? new Date(countData.countDate).toISOString() : null, // Ensure string
  };

  const serializedLines = (countData as any).lines.map((line: any) => ({
      ...line,
      item: {
          ...line.item,
          createdAt: line.item.createdAt?.toISOString() ?? null,
          updatedAt: line.item.updatedAt?.toISOString() ?? null,
      }
  }));

  const permissions = await getUserPermissions();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-2">
            <Link href="/inventory/count">
                <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                </Button>
            </Link>
        </div>

        <StockCountSheet 
            count={serializedCount as any} 
            lines={serializedLines} 
            permissions={permissions}
        />
    </div>
  );
}

