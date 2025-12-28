import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { deleteSuppliersAction } from "@/actions/settings/delete-suppliers";

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const companyId = "00000000-0000-0000-0000-000000000000";

  const supplierList = await db.query.suppliers.findMany({
    where: eq(suppliers.companyId, companyId),
    orderBy: (suppliers, { asc }) => [asc(suppliers.name)],
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <GradientHeader
        module="procurement"
        title="Suppliers"
        description="Manage your vendor relationships and contacts"
        icon={UserPlus}
      />
      <div className="flex items-center justify-end">
        <Link href="/settings/suppliers/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Supplier</Button>
        </Link>
      </div>

      <DataTable 
        columns={columns} 
        data={supplierList} 
        searchKey="name"
        placeholder="Search suppliers..." 
        onDelete={async (ids) => {
          "use server";
          await deleteSuppliersAction(ids);
        }}
      />
    </div>
  );
}
