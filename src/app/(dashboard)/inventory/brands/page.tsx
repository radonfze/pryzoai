import { getBrands, deleteBrand } from "@/actions/inventory/brands";
import { DataTable } from "@/components/ui/data-table";
import { createActionColumn } from "@/components/ui/data-table-columns";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function BrandsPage() {
  const brands = await getBrands();

  const columns = [
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "website",
      header: "Website",
      cell: ({ row }: any) => row.original.website || "-",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.original.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    createActionColumn({
      basePath: "/inventory/brands",
      hasEdit: true,
      hasDelete: true,
      onDelete: deleteBrand,
    }),
  ];

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Brands"
        description="Manage item brands"
        icon="Tag"
      >
        <Link href="/inventory/brands/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Brand
          </Button>
        </Link>
      </GradientHeader>

      <DataTable
        columns={columns}
        data={brands}
        searchKey="name"
        exportName="brands"
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';