import { getBrands } from "@/actions/inventory/brands";
import { BrandsClient } from "./client";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus, Tag } from "lucide-react";
import Link from "next/link";
import { getCompanyIdSafe } from "@/lib/auth";
import { logout } from "@/lib/auth/auth-service";
import { redirect } from "next/navigation";

export default async function BrandsPage() {
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

  const dataRaw = await getBrands();
  const brands = dataRaw.map(item => ({
      ...item,
      createdAt: item.createdAt?.toISOString() ?? null,
      updatedAt: item.updatedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Brands"
        description="Manage item brands"
        icon={Tag}
      >
        <Link href="/inventory/brands/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Brand
          </Button>
        </Link>
      </GradientHeader>

      <BrandsClient data={brands} />
    </div>
  );
}

export const dynamic = 'force-dynamic';