"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { convertQuotationToOrder } from "@/actions/sales/convert-quotation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConvertToOrderButtonProps {
  quotationId: string;
  quotationNumber: string;
  isConverted?: boolean;
}

export function ConvertToOrderButton({ 
  quotationId, 
  quotationNumber, 
  isConverted = false 
}: ConvertToOrderButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    setLoading(true);
    try {
      const result = await convertQuotationToOrder(quotationId);
      
      if (result.success) {
        toast.success(result.message, {
          action: {
            label: "View Order",
            onClick: () => router.push(`/sales/orders/${result.orderId}`),
          },
        });
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to convert quotation");
    } finally {
      setLoading(false);
    }
  };

  if (isConverted) {
    return (
      <Button variant="outline" disabled>
        <ShoppingCart className="mr-2 h-4 w-4" />
        Already Converted
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="mr-2 h-4 w-4" />
          )}
          Convert to Order
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Convert to Sales Order?</AlertDialogTitle>
          <AlertDialogDescription>
            This will create a new Sales Order from quotation <strong>{quotationNumber}</strong> and copy all line items.
            <br /><br />
            The quotation will be marked as converted and cannot be converted again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConvert} disabled={loading}>
            {loading ? "Converting..." : "Yes, Convert"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
