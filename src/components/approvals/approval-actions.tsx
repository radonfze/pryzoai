"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { approveDocumentAction } from "@/actions/approvals/manage-approval";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function ApprovalActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAction(action: "approve" | "reject") {
    setLoading(true);
    try {
      // Logic for reject can be added to manage-approval later or use same action with status arg
      // For now assuming approveDocumentAction handles approval.
      // If we need reject, we should implement it. 
      // Current implementation only has approve.
      
      const res = await approveDocumentAction(requestId, "Approved via UI");
      if (res.success) {
        toast.success(`Request ${action}d successfully`);
        router.refresh();
      } else {
        toast.error(res.error || "Action failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button 
        onClick={() => handleAction("approve")} 
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Approve
      </Button>
      {/* Reject button omitted until implemented */}
    </div>
  );
}
