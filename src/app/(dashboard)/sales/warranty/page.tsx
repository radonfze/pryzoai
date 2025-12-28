import { db } from "@/db";
import { warrantyClaims } from "@/db/schema";
import { DataTable } from "@/components/ui/data-table";
import { createActionColumn } from "@/components/ui/data-table-columns";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getWarrantyClaims } from "@/actions/sales/warranty";

export default async function WarrantyPage() {
  const claims = await getWarrantyClaims();

  const columns = [
    { accessorKey: "claimNumber", header: "Claim #" },
    { accessorKey: "customer.name", header: "Customer" },
    { accessorKey: "item.name", header: "Item" },
    { accessorKey: "issueDescription", header: "Issue" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <span className={`px-2 py-1 rounded text-xs capitalize 
            ${row.original.status === 'received' ? 'bg-blue-100 text-blue-800' : 
              row.original.status === 'approved_replace' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
            {row.original.status?.replace('_', ' ')}
        </span>
      ),
    },
    createActionColumn({ basePath: "/sales/warranty", hasEdit: true }),
  ];

  return (
    <div className="space-y-6">
      <GradientHeader
        module="sales"
        title="Warranty Claims"
        description="Manage repairs and replacements"
        icon="ShieldCheck"
      >
        <Link href="/sales/warranty/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Claim
          </Button>
        </Link>
      </GradientHeader>

      <DataTable
        columns={columns}
        data={claims}
        searchKey="claimNumber"
        exportName="warranty_claims"
      />
    </div>
  );
}
