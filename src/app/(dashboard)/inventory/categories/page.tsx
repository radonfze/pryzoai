import { getCategories, deleteCategory } from "@/actions/inventory/categories";
import { DataTable } from "@/components/ui/data-table";
import { createActionColumn } from "@/components/ui/data-table-columns";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus, Tags } from "lucide-react";
import Link from "next/link";

export default async function CategoriesPage() {
  const categories = await getCategories();

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
      basePath: "/inventory/categories",
      onDelete: deleteCategory
    }),
  ];

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Item Categories"
        description="Organize your inventory with product categories"
        icon={Tags}
      >
        <Link href="/inventory/categories/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Category
          </Button>
        </Link>
      </GradientHeader>

      <DataTable
        columns={columns}
        data={categories}
        searchKey="name"
        exportName="categories"
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';
