"use client";

import { DataTable } from "@/components/ui/data-table";
import { createColumns } from "./columns";
import { deleteCustomersAction } from "@/actions/settings/delete-customers";

interface CustomersTableProps {
    data: any[];
    userId: string;
}

export function CustomersTable({ data, userId }: CustomersTableProps) {
    const columns = createColumns(userId);

    return (
        <DataTable 
          columns={columns} 
          data={data} 
          searchKey="name"
          placeholder="Search customers..."
          onDelete={async (ids) => {
            await deleteCustomersAction(ids);
          }}
        />
    );
}
