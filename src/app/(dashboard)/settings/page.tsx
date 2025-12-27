import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Package, Landmark, Receipt, Warehouse, Building2, Hash, CreditCard } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
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

