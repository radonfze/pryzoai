"use client";

import { DataTable } from "@/components/ui/data-table";
import { createActionColumn } from "@/components/ui/data-table-columns";
import { deleteBrand } from "@/actions/inventory/brands";

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

export function BrandsClient({ data }: { data: any[] }) {
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
      cell: ({ row }: any) => <StatusBadge isActive={row.original.isActive} />,
    },
    createActionColumn({
      basePath: "/inventory/brands",
      hasEdit: true,
      hasDelete: true,
      onDelete: deleteBrand,
    }),
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      exportName="brands"
    />
  );
}
