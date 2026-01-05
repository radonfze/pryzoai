import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { SuppliersClient } from "./client";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  
  const userId = session.userId;
  const companyId = session.companyId || "00000000-0000-0000-0000-000000000000";

  const supplierList = await db.query.suppliers.findMany({
    where: eq(suppliers.companyId, companyId),
    orderBy: (suppliers, { asc }) => [asc(suppliers.name)],
    columns: {
      id: true,
      name: true,
      code: true,
      phone: true,
      email: true,
      taxId: true,
      isActive: true,
    }
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

      <SuppliersClient data={supplierList} userId={userId} />
    </div>
  );
}
