"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, Copy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { saveEmailTemplate, TEMPLATE_VARIABLES } from "@/actions/settings/email-templates";
import { GradientHeader } from "@/components/ui/gradient-header";

const templateTypeOptions = [
  { value: "invoice", label: "Invoice" },
  { value: "quotation", label: "Quotation" },
  { value: "reminder", label: "Payment Reminder" },
  { value: "payment_receipt", label: "Payment Receipt" },
];

export default function NewEmailTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    templateName: searchParams.get("name") || "",
    templateType: searchParams.get("type") || "invoice",
    subject: "",
    body: "",
    isDefault: false,
  });

  const currentVariables = TEMPLATE_VARIABLES[formData.templateType as keyof typeof TEMPLATE_VARIABLES] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await saveEmailTemplate({
        templateName: formData.templateName,
        templateType: formData.templateType,
        subject: formData.subject,
        body: formData.body,
        isDefault: formData.isDefault,
        variables: currentVariables,
      });

      if (result.success) {
        toast.success(result.message);
        router.push("/settings/email-templates");
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      body: prev.body + " " + variable,
    }));
  };

  return (
    <div className="space-y-6 p-6">
      <GradientHeader
        module="settings"
        title="New Email Template"
        description="Create a new email template"
        icon="Mail"
        backUrl="/settings/email-templates"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={formData.templateName}
                      onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                      placeholder="e.g., Invoice Sent"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="templateType">Template Type</Label>
                    <Select
                      value={formData.templateType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, templateType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Invoice {{invoice_number}} from {{company_name}}"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    value={formData.body}
                    onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Dear {{customer_name}},&#10;&#10;Please find attached your invoice..."
                    rows={12}
                    className="font-mono text-sm"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                  />
                  <Label htmlFor="isDefault">Set as default template for this type</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Variables */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Available Variables</CardTitle>
                <CardDescription>Click to insert into body</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {currentVariables.map((variable) => (
                    <Badge
                      key={variable}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => insertVariable(variable)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {variable}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted rounded text-sm space-y-2">
                  <div className="font-medium border-b pb-2">
                    Subject: {formData.subject || "(empty)"}
                  </div>
                  <div className="whitespace-pre-wrap text-xs text-muted-foreground">
                    {formData.body || "Email body preview will appear here..."}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Link href="/settings/email-templates">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Template
          </Button>
        </div>
      </form>
    </div>
  );
}
