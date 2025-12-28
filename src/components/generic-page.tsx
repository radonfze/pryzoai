import GradientHeader from "@/components/ui/gradient-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, FileText, Plus } from "lucide-react";

export default function GenericModulePage({ params }: { params: { slug: string } }) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Module Page"
        description="Manage your records here"
        icon={FileText}
      />
      
      <div className="flex justify-end mb-4">
        <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <Card className="col-span-full py-10 flex flex-col items-center justify-center text-center border-dashed">
            <Construction className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Under Construction</h3>
            <p className="text-muted-foreground">This interface is being generated. The backend logic is ready.</p>
         </Card>
      </div>
    </div>
  );
}
