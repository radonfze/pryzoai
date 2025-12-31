"use client";

import { Button } from "@/components/ui/button";
import { manageApprovalRequest } from "@/actions/approvals/manage-approval";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function ApprovalActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comments, setComments] = useState("");
  const router = useRouter();

  const handleAction = async (action: "APPROVE" | "REJECT") => {
    setLoading(true);
    try {
      const res = await manageApprovalRequest(requestId, action, comments);
      if (res.success) {
        toast.success(`Request ${action === "APPROVE" ? "Approved" : "Rejected"}`);
        setRejectOpen(false);
        router.refresh(); 
      } else {
        toast.error("Action Failed: " + res.message);
      }
    } catch (e) {
        toast.error("Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Approve Button */}
      <Button 
        size="sm" 
        onClick={() => handleAction("APPROVE")} 
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
        Approve
      </Button>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="destructive" disabled={loading}>
                <X className="mr-1 h-4 w-4" /> Reject
            </Button>
          </DialogTrigger>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Reject Request?</DialogTitle>
                  <DialogDescription>
                      Please provide a reason for rejecting this request. The document will be reverted to Draft.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                  <Textarea 
                    placeholder="Reason for rejection..." 
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => handleAction("REJECT")} disabled={loading || !comments.trim()}>
                      Confirm Rejection
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
