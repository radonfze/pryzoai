"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createFiscalYear, togglePeriodStatus } from "@/actions/settings/fiscal-year-actions";
import { toast } from "sonner";
import { Plus, Lock, Unlock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export function CreateYearButton() {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    setLoading(true);
    try {
        const res = await createFiscalYear(year);
        if (res.success) {
            toast.success(res.message);
            setOpen(false);
            router.refresh();
        } else {
            toast.error(res.message);
        }
    } catch (e) { toast.error("Error creating year"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Add Fiscal Year</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Fiscal Year</DialogTitle>
          <DialogDescription>
            This will generate 12 monthly periods for the selected year.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">Year</Label>
            <Input 
                id="year" 
                type="number" 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))} 
                className="col-span-3" 
            />
          </div>
        </div>
        <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Periods"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function ToggleStatusButton({ id, status }: { id: string, status: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const isClosed = status === "closed";

    const handleToggle = async () => {
        setLoading(true);
        try {
            const newStatus = isClosed ? "open" : "closed";
            const res = await togglePeriodStatus(id, newStatus);
            if (res.success) {
                toast.success(`Period ${newStatus}`);
                router.refresh();
            } else {
                toast.error(res.message);
            }
        } finally { setLoading(false); }
    };

    return (
        <Button variant="ghost" size="sm" onClick={handleToggle} disabled={loading}>
            {isClosed ? (
                <Lock className="h-4 w-4 text-red-500" />
            ) : (
                <Unlock className="h-4 w-4 text-green-500" />
            )}
        </Button>
    );
}
