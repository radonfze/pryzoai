"use client";

import { Button } from "@/components/ui/button";
import { postInvoiceAction } from "@/actions/sales/post-invoice";
import { useState } from "react";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InvoiceActions({ id, status, isPosted }: { id: string, status: string, isPosted: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePost = async () => {
    if (!confirm("Are you sure you want to Post this invoice? This will lock the invoice, deduce stock, and post to GL.")) return;

    setLoading(true);
    try {
      const res = await postInvoiceAction(id);
      if (res.success) {
        toast.success("Invoice Posted Successfully");
        router.refresh(); // Refresh server component
      } else {
        toast.error("Posting Failed: " + res.message);
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Only show header button if NOT posted and NOT draft (assuming Draft needs 'Submit' first? Or can we Post Draft directly?)
  // Let's assume user works in Draft, then hits 'Post' to finalize.
  // Existing Statuses: 'draft', 'issued', 'paid', 'void', 'pending', 'sent'
  // If status is 'draft' OR 'sent' but NOT isPosted, we allow posting.
  
  if (isPosted) return null; // Already posted

  return (
    <Button onClick={handlePost} disabled={loading} variant="default">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Post to GL
    </Button>
  );
}
