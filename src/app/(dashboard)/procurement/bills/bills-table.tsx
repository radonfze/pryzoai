"use client"

import { DataTable } from "@/components/ui/data-table"
import { columns, PurchaseBill } from "./columns"

interface BillsTableProps {
  data: PurchaseBill[]
}

export function BillsTable({ data }: BillsTableProps) {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
      searchKey="supplier"
      filterColumns={[
        {
           accessorKey: "status",
           title: "Status",
           options: [
             { label: "Draft", value: "draft" },
             { label: "Posted", value: "posted" },
             { label: "Paid", value: "paid" },
             { label: "Cancelled", value: "cancelled" },
           ]
        }
      ]}
    />
  )
}
