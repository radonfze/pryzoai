import { getSubcategories } from "@/actions/inventory/subcategories";
import { SubcategoriesClient } from "./client";
import { GradientHeader } from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Plus, Layers } from "lucide-react";
import Link from "next/link";
import { getCompanyIdSafe } from "@/lib/auth";
import { logout } from "@/lib/auth/auth-service";
import { redirect } from "next/navigation";

export default async function SubcategoriesPage() {
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

  let subcategories = [];
  try {
    const dataRaw = await getSubcategories();
    // Full serialization to handle nested objects (categoryMappings, etc.)
    subcategories = JSON.parse(JSON.stringify(dataRaw));
    console.log('[Subcategories] Data loaded successfully:', subcategories.length, 'items');
  } catch (error: any) {
    console.error('[Subcategories] Error loading data:', error);
    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Error Loading Subcategories</h1>
        <pre className="bg-red-50 p-4 rounded text-sm overflow-auto">{error.message}</pre>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">{error.stack}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="Subcategories"
        description="Manage item subcategories (Level 2)"
        icon={Layers}
      >
        <Link href="/inventory/subcategories/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Subcategory
          </Button>
        </Link>
      </GradientHeader>

      <SubcategoriesClient data={subcategories} />
    </div>
  );
}

export const dynamic = 'force-dynamic';