import { getModels, deleteModel } from "@/actions/inventory/models";
import { DataTable } from "@/components/ui/data-table";
import { createActionColumn } from "@/components/ui/data-table-columns";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function ModelsPage() {
  const models = await getModels();

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
      accessorKey: "brand.name",
      header: "Brand",
    },
    {
      accessorKey: "subcategory.name",
      header: "Subcategory",
    },
    {
      accessorKey: "description",
      header: "Description",
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
      basePath: "/inventory/models",
      hasEdit: true,
      hasDelete: true,
      onDelete: deleteModel
    }),
  ];

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Models"
        description="Manage item models and variants"
        icon="Boxes"
      >
        <Link href="/inventory/models/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Model
          </Button>
        </Link>
      </GradientHeader>

      <DataTable
        columns={columns}
        data={models}
        searchKey="name"
        exportName="models"
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';