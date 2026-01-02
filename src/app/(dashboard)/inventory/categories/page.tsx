import { getCategories } from "@/actions/inventory/categories";
import { CategoriesClient } from "./client";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus, Tags } from "lucide-react";
import Link from "next/link";
import { getCompanyIdSafe } from "@/lib/auth";
import { logout } from "@/lib/auth/auth-service";
import { redirect } from "next/navigation";

export default async function CategoriesPage() {
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

  const categoriesRaw = await getCategories();
  const categories = categoriesRaw.map(cat => ({
      ...cat,
      createdAt: cat.createdAt?.toISOString() ?? null,
      updatedAt: cat.updatedAt?.toISOString() ?? null,
      parentCreatedAt: cat.parentCreatedAt?.toISOString() ?? null, // From join alias if exists
  }));

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Item Categories"
        description="Organize your inventory with product categories"
        icon={Tags}
      >
        <Link href="/inventory/categories/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Category
          </Button>
        </Link>
      </GradientHeader>

      <CategoriesClient data={categories} />
    </div>
  );
}

export const dynamic = 'force-dynamic';
