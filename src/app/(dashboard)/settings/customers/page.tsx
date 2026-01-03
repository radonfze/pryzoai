import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { createColumns } from "./columns";
import { deleteCustomersAction } from "@/actions/settings/delete-customers";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  
  const userId = session.userId;
  const companyId = session.companyId || "00000000-0000-0000-0000-000000000000";

  const customerList = await db.query.customers.findMany({
    where: eq(customers.companyId, companyId),
    orderBy: (customers, { asc }) => [asc(customers.name)],
  });

  // Create columns with user ID for security dialogs
  const columns = createColumns(userId);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <Link href="/settings/customers/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Customer</Button>
        </Link>
      </div>

      <DataTable 
        columns={columns} 
        data={customerList} 
        searchKey="name"
        placeholder="Search customers..."
        onDelete={async (ids) => {
          "use server";
          await deleteCustomersAction(ids);
        }}
      />
    </div>
  );
}
