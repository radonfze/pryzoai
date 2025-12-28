import { db } from "@/db";
import { salesReturns, salesLines, customers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Undo2 } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

const columns = [
  { accessorKey: "returnNumber", header: "Return #" },
  { 
    accessorKey: "customer.name", 
    header: "Customer",
    cell: ({ row }: any) => row.original.customer?.name || "-"
  },
  { 
    accessorKey: "returnDate", 
    header: "Date",
    cell: ({ row }: any) => format(new Date(row.original.returnDate), "dd MMM yyyy")
  },
  { 
    accessorKey: "totalAmount", 
    header: "Amount",
    cell: ({ row }: any) => `${Number(row.original.totalAmount).toLocaleString()} AED`
  },
  { 
    accessorKey: "status", 
    header: "Status",
    cell: ({ row }: any) => <Badge variant="outline">{row.original.status}</Badge>
  },
];

export default async function SalesReturnsPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const returns = await db.query.salesReturns.findMany({
    where: eq(salesReturns.companyId, companyId),
    with: { customer: true },
    orderBy: [desc(salesReturns.createdAt)],
    limit: 100
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Sales Returns"
        description="Manage customer returns and credit notes"
        icon={Undo2}
      />

      <div className="flex justify-end">
        <Link href="/sales/returns/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Return</Button>
        </Link>
      </div>

      <DataTable columns={columns} data={returns} searchColumn="returnNumber" />
    </div>
  );
}
