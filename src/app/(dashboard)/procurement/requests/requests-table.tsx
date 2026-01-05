"use client";

import { DataTable } from "@/app/data-table";
import { columns } from "./columns";

interface RequestsTableProps {
  data: any[];
}

export function RequestsTable({ data }: RequestsTableProps) {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="requestNumber"
      filterColumns={[
        {
          id: "status",
          title: "Status",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Pending Approval", value: "pending_approval" },
            { label: "Issued", value: "issued" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ],
        },
      ]}
    />
  );
}
