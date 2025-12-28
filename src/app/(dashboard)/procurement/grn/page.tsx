import { db } from "@/db";
import { goodsReceipts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, PackageCheck } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

export const dynamic = 'force-dynamic';

export default async function GRNPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  let grnList: any[] = [];
  try {
    grnList = await db.query.goodsReceipts.findMany({
      where: eq(goodsReceipts.companyId, companyId),
      orderBy: [desc(goodsReceipts.createdAt)],
      with: {
        supplier: true,
        purchaseOrder: true,
      },
      limit: 50,
    });
  } catch {
    // Table might not exist
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Goods Receipt Notes"
        description="Record incoming goods from suppliers and link to purchase orders"
        icon={PackageCheck}
      />
      
      <div className="flex items-center justify-end">
        <Link href="/procurement/grn/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New GRN</Button>
        </Link>
      </div>

      <DataTable 
        columns={columns} 
        data={grnList} 
        searchKey="grnNumber"
        placeholder="Search GRNs..." 
      />
    </div>
  );
}
