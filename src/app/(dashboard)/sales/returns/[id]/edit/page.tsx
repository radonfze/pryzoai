"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import GradientHeader from "@/components/ui/gradient-header";
import { Undo2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";

export default function EditSalesReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    returnNumber: "",
    returnDate: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    async function loadReturn() {
      try {
        const res = await fetch(`/api/sales/returns/${id}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            returnNumber: data.returnNumber || "",
            returnDate: data.returnDate?.split("T")[0] || "",
            reason: data.reason || "",
            notes: data.notes || "",
          });
        }
      } catch (error) {
        console.error("Failed to load return:", error);
      } finally {
        setLoading(false);
      }
    }
    loadReturn();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/sales/returns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push(`/sales/returns/${id}`);
      }
    } catch (error) {
      console.error("Failed to update return:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="sales"
        title="Edit Sales Return"
        description={`Editing ${formData.returnNumber}`}
        icon={Undo2}
      />

      <div className="flex justify-between items-center">
        <Link href={`/sales/returns/${id}`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Return Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Return Number</Label>
                <Input value={formData.returnNumber} disabled />
              </div>
              <div className="space-y-2">
                <Label>Return Date</Label>
                <Input 
                  type="date" 
                  value={formData.returnDate}
                  onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input 
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Reason for return"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Link href={`/sales/returns/${id}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
