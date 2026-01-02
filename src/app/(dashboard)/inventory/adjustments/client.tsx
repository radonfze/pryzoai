"use client";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { columns, StockAdjustment } from "./columns";
import { toast } from "sonner";
import { deleteStockAdjustments } from "@/actions/inventory/create-stock-adjustment";

interface AdjustmentsClientProps {
  data: StockAdjustment[];
}

export function AdjustmentsClient({ data }: AdjustmentsClientProps) {
  const router = useRouter();

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    
    try {
      const result = await deleteStockAdjustments(ids);
      if (result.success) {
        toast.success(`Deleted ${ids.length} adjustment(s)`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete adjustments");
    }
  };

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="adjustmentNumber"
      placeholder="Search by number..."
      onDelete={handleDelete}
      exportName="stock-adjustments"
    />
  );
}

