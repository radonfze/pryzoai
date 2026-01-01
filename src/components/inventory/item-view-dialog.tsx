"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ViewItemDialogProps {
  item: any; // Using any for flexibility, but allows strict typing if needed
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ViewItemDialog({ item, trigger, open, onOpenChange }: ViewItemDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             Item Details <Badge variant="outline">{item.code}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-4">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Name</p>
                    <p className="font-semibold">{item.name}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Arabic Name</p>
                    <p>{item.nameAr || "-"}</p>
                </div>
                
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Type</p>
                    <Badge variant="secondary" className="capitalize">{item.itemType}</Badge>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Status</p>
                    <Badge variant={item.isActive ? "default" : "destructive"}>
                        {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>

                <div className="col-span-2 border-t my-2"></div>

                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Category</p>
                    <p>{item.category?.name || "-"}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Subcategory</p>
                    <p>{item.subcategory?.name || "-"}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Brand</p>
                    <p>{item.brand?.name || "-"}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Model</p>
                    <p>{item.model?.name || "-"}</p>
                </div>

                <div className="col-span-2 border-t my-2"></div>

                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Selling Price</p>
                    <p className="font-semibold text-lg">
                        {item.sellingPrice ? formatCurrency(Number(item.sellingPrice)) : "-"}
                    </p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Cost Price</p>
                     <p>
                        {item.costPrice ? formatCurrency(Number(item.costPrice)) : "-"}
                    </p>
                </div>
                
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Base UOM</p>
                    <p>{item.uom?.name || item.uomId || "-"}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Barcode</p>
                    <p className="font-mono text-sm">{item.barcode || "-"}</p>
                </div>

                {item.description && (
                    <div className="col-span-2 mt-2">
                        <p className="text-sm text-muted-foreground font-medium mb-1">Description</p>
                        <div className="bg-muted/30 p-3 rounded-md text-sm whitespace-pre-wrap">
                            {item.description}
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
