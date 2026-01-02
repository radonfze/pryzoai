import { getModels } from "@/actions/inventory/models";
import { ModelsClient } from "./client";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus, Boxes } from "lucide-react";
import Link from "next/link";
import { getCompanyIdSafe } from "@/lib/auth";
import { logout } from "@/lib/auth/auth-service";
import { redirect } from "next/navigation";

export default async function ModelsPage() {
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

  const dataRaw = await getModels();
  const models = dataRaw.map(item => ({
      ...item,
      createdAt: item.createdAt?.toISOString() ?? null,
      updatedAt: item.updatedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Models"
        description="Manage item models and variants"
        icon={Boxes}
      >
        <Link href="/inventory/models/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Model
          </Button>
        </Link>
      </GradientHeader>

      <ModelsClient data={models} />
    </div>
  );
}

export const dynamic = 'force-dynamic';