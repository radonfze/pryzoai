"use client";

import { DataTable } from "@/components/ui/data-table";
import { Supplier, createColumns } from "./columns";
import { deleteSuppliersAction } from "@/actions/settings/delete-suppliers";

interface SuppliersClientProps {
  data: Supplier[];
  userId: string;
}

export function SuppliersClient({ data, userId }: SuppliersClientProps) {
  const columns = createColumns(userId);

  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="name"
      placeholder="Search suppliers..." 
      onDelete={async (ids) => {
        await deleteSuppliersAction(ids);
      }}
    />
  );
}
