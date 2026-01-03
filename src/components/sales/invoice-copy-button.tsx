"use client";

import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { copyInvoiceAction } from "@/actions/sales/copy-invoice";
import { useRouter } from "next/navigation";

interface InvoiceCopyButtonProps {
  invoiceId: string;
}

export default function InvoiceCopyButton({ invoiceId }: InvoiceCopyButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCopy = async () => {
    setLoading(true);
    try {
      const result = await copyInvoiceAction(invoiceId);
      
      if (result.success && result.newInvoiceId) {
        toast.success(result.message);
        router.push(`/sales/invoices/${result.newInvoiceId}`);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to copy invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleCopy} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Copy className="mr-2 h-4 w-4" />
      )}
      Copy
    </Button>
  );
}
