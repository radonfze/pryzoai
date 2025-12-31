import { getSubcategories, deleteSubcategory } from "@/actions/inventory/subcategories";
import { DataTable } from "@/components/ui/data-table";
import { createActionColumn } from "@/components/ui/data-table-columns";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus, Layers } from "lucide-react";
import Link from "next/link";

export default async function SubcategoriesPage() {
  const subcategories = await getSubcategories();

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
      accessorKey: "category.name",
      header: "Category",
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
      basePath: "/inventory/subcategories",
      hasEdit: true,
      hasDelete: true,
      onDelete: deleteSubcategory
    }),
  ];

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Subcategories"
        description="Manage item subcategories (Level 2)"
        icon={Layers}
      >
        <Link href="/inventory/subcategories/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Subcategory
          </Button>
        </Link>
      </GradientHeader>

      <DataTable
        columns={columns}
        data={subcategories}
        searchKey="name"
        exportName="subcategories"
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';