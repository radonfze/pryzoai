import { db } from "@/db";
import { fixedAssets } from "@/db/schema/fixed-assets";
import { DataTable } from "@/components/ui/data-table";
import { createActionColumn } from "@/components/ui/data-table-columns";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus, Building } from "lucide-react";
import Link from "next/link";
import { getAssets } from "@/actions/finance/assets";

export const dynamic = 'force-dynamic';

export default async function AssetsPage() {
  const assets = await getAssets();

  const columns = [
    { accessorKey: "assetCode", header: "Asset Code" },
    { accessorKey: "assetName", header: "Name" },
    { accessorKey: "category.name", header: "Category" },
    { 
        accessorKey: "purchaseCost", 
        header: "Cost",
        cell: ({ row }: any) => Number(row.original.purchaseCost).toLocaleString()
    },
    { 
        accessorKey: "currentValue", 
        header: "Current Value",
        cell: ({ row }: any) => Number(row.original.currentValue || 0).toLocaleString()
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <span className="capitalize px-2 py-1 bg-slate-100 rounded text-xs">{row.original.status?.replace('_', ' ')}</span>
      ),
    },
    createActionColumn({ basePath: "/finance/assets", hasEdit: true }),
  ];

  return (
    <div className="space-y-6">
      <GradientHeader
        module="finance"
        title="Fixed Assets"
        description="Track assets and depreciation"
        icon={Building}
      >
        <Link href="/finance/assets/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Asset
          </Button>
        </Link>
      </GradientHeader>

      <DataTable
        columns={columns}
        data={assets}
        searchKey="assetName"
        exportName="fixed_assets"
      />
    </div>
  );
}
