import { GradientHeader } from "@/components/ui/gradient-header";
import { Scale, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getUoms } from "@/actions/inventory/uom";
import { UomsClient } from "./client";
import { getCompanyIdSafe } from "@/lib/auth";
import { logout } from "@/lib/auth/auth-service";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function UOMListPage() {
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

  const dataRaw = await getUoms();
  const uoms = dataRaw.map(item => ({
      ...item,
      createdAt: item.createdAt?.toISOString() ?? null,
      updatedAt: item.updatedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Units of Measure"
        description="Manage units of measure and conversion factors"
        icon={Scale}
      >
        <Link href="/inventory/uom/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New UOM
          </Button>
        </Link>
      </GradientHeader>
      
      <UomsClient data={uoms} />
    </div>
  );
}
