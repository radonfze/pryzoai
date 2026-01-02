import { db } from "@/db";
import { bom, items } from "@/db/schema/items";
import { eq, and } from "drizzle-orm";
import { getCompanyIdSafe } from "@/lib/auth";
import { logout } from "@/lib/auth/auth-service";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import BomForm from "@/components/inventory/bom-form";
import GradientHeader from "@/components/ui/gradient-header";
import { Edit } from "lucide-react";
import { notFound } from "next/navigation";

interface EditBomPageProps {
  params: { id: string };
}

export default async function EditBomPage({ params }: EditBomPageProps) {
  const companyId = await getCompanyIdSafe();
  if (!companyId) {
      return (
          <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
              <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight">Session Expired</h1>
                  <p className="text-muted-foreground">Your session is invalid. Please log in again.</p>
              </div>
              <form action={async () => {
                  "use server"
                  await logout();
                  redirect("/login");
              }}>
                  <Button variant="default">Return to Login</Button>
              </form>
          </div>
      );
  }

  const bomData = await db.query.bom.findFirst({
    where: and(eq(bom.id, params.id), eq(bom.companyId, companyId)),
    with: {
      lines: true,
    },
  });

  if (!bomData) {
    notFound();
  }

  // Fetch all active items to populate dropdowns
  const allItemsRaw = await db.query.items.findMany({
    where: and(eq(items.companyId, companyId), eq(items.isActive, true)),
    columns: {
      id: true,
      code: true,
      name: true,
      uom: true,
    },
  });

  const allItems = JSON.parse(JSON.stringify(allItemsRaw));
  const bomDataSanitized = JSON.parse(JSON.stringify(bomData));

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="inventory"
        title="Edit BOM"
        description={`Editing BOM #${bomData.name || params.id}`}
        icon={Edit}
      />
      <BomForm items={allItems} initialData={bomDataSanitized} isEdit />
    </div>
  );
}
