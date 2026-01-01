"use client";

import { DataTable } from "@/components/ui/data-table";
import { createActionColumn } from "@/components/ui/data-table-columns";
import { deleteModel } from "@/actions/inventory/models";

// Define helper for status badge
const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs ${
      isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    }`}
  >
    {isActive ? "Active" : "Inactive"}
  </span>
);

export function ModelsClient({ data }: { data: any[] }) {
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
      cell: ({ row }: any) => <StatusBadge isActive={row.original.isActive} />,
    },
    createActionColumn({
      basePath: "/inventory/models",
      hasEdit: true,
      hasDelete: true,
      onDelete: deleteModel,
    }),
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      exportName="models"
    />
  );
}
