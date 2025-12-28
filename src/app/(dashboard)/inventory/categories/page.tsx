import { Button } from "@/components/ui/button";
import { Plus, Boxes, Tags } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";
import { Card, CardContent } from "@/components/ui/card";

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <GradientHeader
        module="inventory"
        title="Item Categories"
        description="Organize your inventory with product categories and sub-categories"
        icon={Tags}
      />
      
      <div className="flex items-center justify-end">
         <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Category
         </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <Card className="col-span-full py-10 flex flex-col items-center justify-center text-center border-dashed">
            <Tags className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Categories Found</h3>
            <p className="text-muted-foreground">Start by creating your first item category.</p>
         </Card>
      </div>
    </div>
  );
}
