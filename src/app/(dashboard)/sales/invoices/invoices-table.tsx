"use client";

import { DataTable } from "@/components/ui/data-table";
import { createColumns, Invoice } from "./columns";
import { deleteInvoicesAction } from "@/actions/sales/delete-invoices";

interface InvoicesTableProps {
    invoices: Invoice[];
    userId: string;
}

export function InvoicesTable({ invoices, userId }: InvoicesTableProps) {
    const columns = createColumns(userId);

    return (
        <DataTable 
          columns={columns} 
          data={invoices} 
          searchKey="invoiceNumber"
          placeholder="Search invoices..." 
          onDelete={async (ids) => {
            await deleteInvoicesAction(ids);
          }}
        />
    );
}
