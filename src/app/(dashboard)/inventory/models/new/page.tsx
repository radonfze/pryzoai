import { ModelForm } from "@/components/inventory/model-form";
import { GradientHeader } from "@/components/ui/gradient-header";
import { getBrands } from "@/actions/inventory/brands";
import { getSubcategories } from "@/actions/inventory/subcategories";
import { getNextModelCode } from "@/actions/inventory/models";

import { getCompanyIdSafe } from "@/lib/auth";
import { logout } from "@/lib/auth/auth-service";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewModelPage() {
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
  const [brandsRaw, subcategoriesRaw, nextCode] = await Promise.all([
    getBrands(),
    getSubcategories(),
    getNextModelCode(),
  ]);

  // Serialize to handle nested objects
  const brands = JSON.parse(JSON.stringify(brandsRaw));
  const subcategories = JSON.parse(JSON.stringify(subcategoriesRaw));

  return (
    <div className="space-y-6">
      <GradientHeader
        module="inventory"
        title="New Model"
        description="Create a new item model"
        icon={Plus}
      />
      <div className="max-w-2xl mx-auto">
        <ModelForm brands={brands} subcategories={subcategories} initialCode={nextCode} />
      </div>
    </div>
  );
}
