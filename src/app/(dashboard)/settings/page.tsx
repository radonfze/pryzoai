import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building, Package, Landmark, Receipt, Warehouse, Building2, Hash, CreditCard, Shield, Database, Download, Settings2 } from "lucide-react";
import GradientHeader from "@/components/ui/gradient-header";

export const dynamic = 'force-dynamic';

const companySettings = [
  {
    title: "Company Setup",
    description: "Configure company details, TRN, and preferences",
    href: "/settings/company",
    icon: Building2,
    priority: true,
  },
  {
    title: "Users",
    description: "Manage system users and access",
    href: "/settings/users",
    icon: Users,
  },
  {
    title: "Roles & Permissions",
    description: "Configure user roles and permissions",
    href: "/settings/roles",
    icon: Shield,
  },
  {
    title: "Number Series",
    description: "Auto-numbering for documents and codes",
    href: "/settings/number-series",
    icon: Hash,
  },
  {
    title: "Payment Terms",
    description: "Define payment terms and conditions",
    href: "/settings/payment-terms",
    icon: CreditCard,
  },
  {
    title: "Database Backup",
    description: "Backup and restore database",
    href: "/settings/backup",
    icon: Database,
    priority: true,
  },
];

const masterDataItems = [
  {
    title: "Customers",
    description: "Manage customer accounts and contacts",
    href: "/settings/customers",
    icon: Users,
  },
  {
    title: "Suppliers",
    description: "Manage supplier/vendor accounts",
    href: "/settings/suppliers",
    icon: Building,
  },
  {
    title: "Items",
    description: "Manage inventory items and products",
    href: "/settings/items",
    icon: Package,
  },
  {
    title: "Warehouses",
    description: "Manage warehouse locations",
    href: "/settings/warehouses",
    icon: Warehouse,
  },
  {
    title: "Chart of Accounts",
    description: "Manage general ledger accounts",
    href: "/finance/coa",
    icon: Landmark,
  },
  {
    title: "Taxes",
    description: "Manage tax rates and configurations",
    href: "/settings/taxes",
    icon: Receipt,
  },
];

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <GradientHeader
        module="hr"
        title="Settings & Configuration"
        description="Manage system settings, master data, and preferences"
        icon={Settings2}
      />
      
      {/* Company Settings Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-muted-foreground">Company Configuration</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companySettings.map((item) => (
            <Link key={item.title} href={item.href}>
              <Card className={`hover:bg-muted/50 transition-colors cursor-pointer h-full ${item.priority ? 'border-primary/50' : ''}`}>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className={`p-2 rounded-md ${item.priority ? 'bg-primary/20' : 'bg-primary/10'}`}>
                    <item.icon className={`h-6 w-6 ${item.priority ? 'text-primary' : 'text-primary'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Master Data Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-muted-foreground">Master Data</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {masterDataItems.map((item) => (
            <Link key={item.title} href={item.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

