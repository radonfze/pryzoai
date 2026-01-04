import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCompanyId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, FileText, Bell, Receipt } from "lucide-react";
import Link from "next/link";
import { GradientHeader } from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

const templateIcons: Record<string, React.ReactNode> = {
  invoice: <FileText className="h-5 w-5" />,
  quotation: <FileText className="h-5 w-5" />,
  reminder: <Bell className="h-5 w-5" />,
  payment_receipt: <Receipt className="h-5 w-5" />,
};

const templateColors: Record<string, string> = {
  invoice: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  quotation: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  reminder: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  payment_receipt: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export default async function EmailTemplatesPage() {
  const companyId = await getCompanyId();
  
  const templates = companyId ? await db.query.emailTemplates.findMany({
    where: and(
      eq(emailTemplates.companyId, companyId),
      eq(emailTemplates.isActive, true)
    ),
    orderBy: (t, { asc }) => [asc(t.templateType), asc(t.templateName)],
  }) : [];

  // Group by type
  const groupedTemplates = templates.reduce((acc, t) => {
    const type = t.templateType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(t);
    return acc;
  }, {} as Record<string, typeof templates>);

  return (
    <div className="space-y-6 p-6">
      <GradientHeader
        module="settings"
        title="Email Templates"
        description="Customize email templates for invoices, quotations, and reminders"
        icon="Mail"
        backUrl="/settings"
      />

      <div className="flex justify-end">
        <Link href="/settings/email-templates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Create email templates to customize how your invoices, quotations, and reminders are sent to customers.
            </p>
            <Link href="/settings/email-templates/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([type, typeTemplates]) => (
            <div key={type}>
              <h3 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2">
                <span className={`p-2 rounded ${templateColors[type] || 'bg-gray-100'}`}>
                  {templateIcons[type] || <Mail className="h-5 w-5" />}
                </span>
                {type.replace('_', ' ')} Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeTemplates.map((template) => (
                  <Link key={template.id} href={`/settings/email-templates/${template.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{template.templateName}</CardTitle>
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-1">
                          {template.subject}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.body.substring(0, 100)}...
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Start Templates */}
      {templates.length === 0 && (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">Quick Start Templates</CardTitle>
            <CardDescription>Start with these pre-built templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <QuickTemplate 
                type="invoice" 
                name="Invoice Sent"
                desc="Notify customer when invoice is issued"
              />
              <QuickTemplate 
                type="reminder" 
                name="Payment Reminder"
                desc="Remind customer of overdue payment"
              />
              <QuickTemplate 
                type="quotation" 
                name="Quotation Sent"
                desc="Send quotation to prospective customer"
              />
              <QuickTemplate 
                type="payment_receipt" 
                name="Payment Received"
                desc="Confirm payment receipt to customer"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuickTemplate({ type, name, desc }: { type: string; name: string; desc: string }) {
  return (
    <Link href={`/settings/email-templates/new?type=${type}&name=${encodeURIComponent(name)}`}>
      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-background transition-colors">
        <span className={`p-2 rounded ${templateColors[type] || 'bg-gray-100'}`}>
          {templateIcons[type] || <Mail className="h-5 w-5" />}
        </span>
        <div>
          <div className="font-medium text-sm">{name}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
    </Link>
  );
}
