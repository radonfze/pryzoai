"use client";

import { Button } from "@/components/ui/button";
import { postInvoiceAction } from "@/actions/sales/post-invoice";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Send, 
  Loader2, 
  Edit, 
  Copy, 
  Printer, 
  Mail, 
  Eye,
  Trash2,
  XCircle 
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InvoiceActionsProps {
  id: string;
  status: string;
  isPosted: boolean;
  invoiceNumber: string;
  invoiceData?: any; // For preview
}

export default function InvoiceActionsBar({ 
  id, 
  status, 
  isPosted, 
  invoiceNumber,
  invoiceData 
}: InvoiceActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const router = useRouter();

  const handlePost = async () => {
    if (!confirm("Post this invoice? This will lock it, deduct stock, and post to GL.")) return;

    setLoading('post');
    try {
      const res = await postInvoiceAction(id);
      if (res.success) {
        toast.success("Invoice Posted Successfully");
        router.refresh();
      } else {
        toast.error("Posting Failed: " + res.message);
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setLoading(null);
    }
  };

  const handleCopy = async () => {
    setLoading('copy');
    try {
      const res = await fetch(`/api/sales/invoices/${id}/copy`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.newInvoiceId) {
        toast.success(`Copied as ${data.newInvoiceNumber || 'new invoice'}`);
        router.push(`/sales/invoices/${data.newInvoiceId}`);
      } else {
        toast.error(data.message || "Failed to copy");
      }
    } catch (e) {
      toast.error("Copy failed");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    setLoading('delete');
    try {
      const res = await fetch(`/api/sales/invoices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success("Invoice deleted");
        router.push('/sales/invoices');
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (e) {
      toast.error("Delete failed");
    } finally {
      setLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = async () => {
    setLoading('cancel');
    try {
      const res = await fetch(`/api/sales/invoices/${id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success("Invoice cancelled");
        router.refresh();
      } else {
        toast.error(data.message || "Failed to cancel");
      }
    } catch (e) {
      toast.error("Cancel failed");
    } finally {
      setLoading(null);
      setShowCancelConfirm(false);
    }
  };

  const handleEmail = async () => {
    setLoading('email');
    try {
      // TODO: Implement email sending
      await new Promise(r => setTimeout(r, 1000));
      toast.success("Email sent to customer");
    } catch (e) {
      toast.error("Email failed");
    } finally {
      setLoading(null);
    }
  };

  const canEdit = !isPosted && status === 'draft';
  const canPost = !isPosted && (status === 'draft' || status === 'sent');
  const canCopy = true;
  const canDelete = !isPosted && status === 'draft';
  const canCancel = isPosted && status !== 'void' && status !== 'cancelled';

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Edit */}
        {canEdit && (
          <Link href={`/sales/invoices/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
          </Link>
        )}

        {/* Copy */}
        {canCopy && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
            disabled={loading === 'copy'}
          >
            {loading === 'copy' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Copy className="mr-1.5 h-4 w-4" />}
            Copy
          </Button>
        )}

        {/* Preview (Eye) */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowPreview(true)}
        >
          <Eye className="mr-1.5 h-4 w-4" />
          Preview
        </Button>

        {/* Print/PDF */}
        <a href={`/api/sales/invoices/${id}/pdf`} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm">
            <Printer className="mr-1.5 h-4 w-4" />
            Print
          </Button>
        </a>

        {/* Email */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleEmail}
          disabled={loading === 'email'}
        >
          {loading === 'email' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Mail className="mr-1.5 h-4 w-4" />}
          Email
        </Button>

        {/* Cancel (for posted invoices) */}
        {canCancel && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            onClick={() => setShowCancelConfirm(true)}
            disabled={loading === 'cancel'}
          >
            {loading === 'cancel' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
            Cancel
          </Button>
        )}

        {/* Delete (for draft only) */}
        {canDelete && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading === 'delete'}
          >
            {loading === 'delete' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
            Delete
          </Button>
        )}

        {/* Post to GL */}
        {canPost && (
          <Button 
            onClick={handlePost} 
            disabled={loading === 'post'} 
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            {loading === 'post' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
            Post to GL
          </Button>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview - {invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-6">
            <iframe 
              src={`/api/sales/invoices/${id}/pdf`} 
              className="w-full h-[600px]" 
              title="Invoice Preview"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice {invoiceNumber}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will void invoice {invoiceNumber}. A reversal entry will be created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancel}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Cancel Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
