import { db } from "@/db";
import { salesTargets } from "@/db/schema/sales-teams";
import { DataTable } from "@/components/ui/data-table";
import { createActionColumn } from "@/components/ui/data-table-columns";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";

export default async function SalesTargetsPage() {
  const companyId = await getCompanyId();
  const targets = await db.query.salesTargets.findMany({
    where: eq(salesTargets.companyId, companyId),
    with: {
      team: true,
      user: true,
    }
  });

  const columns = [
    {
      accessorKey: "periodName",
      header: "Period",
    },
    {
      accessorKey: "targetType", // Virtual column
      header: "Target For",
      cell: ({ row }: any) => row.original.team ? `Team: ${row.original.team.name}` : `User: ${row.original.user?.name}`,
    },
    {
      accessorKey: "targetAmount",
      header: "Target Amount",
      cell: ({ row }: any) => Number(row.original.targetAmount).toLocaleString(),
    },
    {
      accessorKey: "achievedAmount",
      header: "Achieved",
      cell: ({ row }: any) => Number(row.original.achievedAmount).toLocaleString(),
    },
    {
      accessorKey: "progress",
      header: "Progress",
       cell: ({ row }: any) => {
          const t = Number(row.original.targetAmount) || 1;
          const a = Number(row.original.achievedAmount) || 0;
          const pct = Math.round((a / t) * 100);
          return (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }}></div>
            </div>
          );
       }
    },
    createActionColumn({
      basePath: "/sales/targets",
      hasEdit: true,
      hasDelete: true,
    }),
  ];

  return (
    <div className="space-y-6">
      <GradientHeader
        module="sales"
        title="Sales Targets"
        description="Monitor sales performance against targets"
        icon="Target"
      >
        <Link href="/sales/targets/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Set Target
          </Button>
        </Link>
      </GradientHeader>

      <DataTable
        columns={columns}
        data={targets}
        searchKey="periodName"
        exportName="sales_targets"
      />
    </div>
  );
}
