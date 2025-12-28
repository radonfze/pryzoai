"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Settings,
  PieChart,
  Briefcase,
  Layers,
  Factory,
  ChevronRight,
  Receipt,
  ClipboardList,
  CreditCard,
  Warehouse,
  BookOpen,
  Landmark,
  UserCog,
  Calendar,
  Banknote,
  ListTodo,
  Clock,
  Hammer,
  Boxes,
  Building2,
  UserPlus,
  Shield,
  DollarSign,
  Tag,
  ShieldCheck,
  Wand2,
  Target,
  Building,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Sales",
    icon: ShoppingCart,
    href: "/sales",
    items: [
      { title: "Invoice Wizard", href: "/sales/invoices/wizard", icon: Wand2 },
      { title: "Invoices", href: "/sales/invoices", icon: Receipt },
      { title: "Sales Orders", href: "/sales/orders", icon: ClipboardList },
      { title: "Quotations", href: "/sales/quotations", icon: FileText },
      { title: "Payments", href: "/sales/payments", icon: CreditCard },
      { title: "Credit Notes", href: "/sales/credit-notes", icon: Receipt },
      { title: "Delivery Notes", href: "/sales/delivery-notes", icon: Package },
      { title: "Returns", href: "/sales/returns", icon: ClipboardList },
      { title: "Warranty Claims", href: "/sales/warranty", icon: ShieldCheck },
      { title: "Sales Teams", href: "/sales/teams", icon: Users },
      { title: "Sales Targets", href: "/sales/targets", icon: Target },
      { title: "Statement of Account", href: "/sales/reports/customer-statement", icon: FileText }, // New Phase 19
    ],
  },
  {
    title: "Inventory",
    icon: Package,
    href: "/inventory",
    items: [
      { title: "Items", href: "/inventory/items", icon: Boxes },
      { title: "Categories", href: "/inventory/categories", icon:  Package },
      { title: "Subcategories", href: "/inventory/subcategories", icon: Layers },
      { title: "Brands", href: "/inventory/brands", icon: Tag },
      { title: "Models", href: "/inventory/models", icon: Boxes },
      { title: "Stock Ledger", href: "/inventory/ledger", icon: BookOpen },
      { title: "Stock Transfers", href: "/inventory/transfers", icon: ClipboardList },
      { title: "Adjustments", href: "/inventory/adjustments/new", icon: ClipboardList },
      { title: "Stock Count", href: "/inventory/count", icon: ClipboardList },
    ],
  },
  {
    title: "AI Copilot",
    icon: Wand2,
    href: "/ai/copilot", // New Ph17
  },
  {
    title: "Purchase",
    icon: FileText,
    href: "/procurement",
    items: [
      { title: "Purchase Orders", href: "/procurement/orders", icon: ClipboardList },
      { title: "Goods Receipt", href: "/procurement/grn", icon: Package },
      { title: "Bills", href: "/procurement/bills", icon: Receipt },
      { title: "Debit Notes", href: "/procurement/debit-notes", icon: Receipt },
      { title: "Returns", href: "/procurement/returns", icon: ClipboardList },
      { title: "Supplier Payments", href: "/procurement/payments", icon: CreditCard },
      { title: "Statement of Account", href: "/procurement/reports/supplier-statement", icon: FileText }, // New Phase 19
    ],
  },
  {
    title: "Finance",
    icon: PieChart,
    href: "/finance",
    items: [
      { title: "Chart of Accounts", href: "/finance/coa", icon: BookOpen },
      { title: "Journal Entries", href: "/finance/journals", icon: FileText },
      { title: "Fixed Assets", href: "/finance/assets", icon: Building },
      { title: "Bank Accounts", href: "/finance/bank-accounts", icon: Landmark },
      { title: "Budgets", href: "/finance/budgets", icon: Banknote },
      { title: "Reconciliation", href: "/finance/reconciliation", icon: ClipboardList },
      { title: "Tax Audit (FAF)", href: "/finance/tax-audit", icon: ShieldCheck },
      { title: "Financial Reports", href: "/finance/reports", icon: ClipboardList }, // Updated
    ],
  },
  {
    title: "Manufacturing",
    href: "/manufacturing",
    icon: Factory,
    items: [
      { title: "Production Orders", href: "/manufacturing/orders", icon: ClipboardList },
      { title: "Bill of Materials", href: "/manufacturing/bom", icon: Layers },
      { title: "Workstations", href: "/manufacturing/workstations", icon: Hammer },
    ],
  },
  {
    title: "Procurement",
    icon: Briefcase,
    href: "/projects",
    items: [
      { title: "Tasks", href: "/projects/tasks", icon: ListTodo },
      { title: "Technician Queue", href: "/projects/technician-queue", icon: Hammer },
      { title: "Time Tracking", href: "/projects/time", icon: Clock },
    ],
  },
  {
    title: "HR & Payroll",
    icon: Users,
    href: "/hr",
    items: [
      { title: "Employees", href: "/hr/employees", icon: UserCog },
      { title: "Attendance", href: "/hr/attendance", icon: Calendar },
      { title: "Leaves", href: "/hr/leaves", icon: ClipboardList },
      { title: "Payroll", href: "/hr/payroll", icon: Banknote },
    ],
  },
  {
    title: "Manufacturing",
    icon: Factory,
    href: "/manufacturing",
    items: [
      { title: "Work Orders", href: "/manufacturing/work-orders", icon: Hammer },
      { title: "Bill of Materials", href: "/manufacturing/bom", icon: Boxes },
      { title: "Production Planning", href: "/manufacturing/planning", icon: Calendar },
    ],
  },
];

const settingsItems = [
  { title: "Dashboard", href: "/settings", icon: LayoutDashboard },
  { title: "Company", href: "/settings/company", icon: Building2 },
  { title: "Theme", href: "/settings/theme", icon: Layers },
  { title: "Customers", href: "/settings/customers", icon: Users },
  { title: "Suppliers", href: "/settings/suppliers", icon: UserPlus },
  { title: "Items", href: "/settings/items", icon: Package },
  { title: "Currencies", href: "/settings/currencies", icon: Coins },
  { title: "Taxes", href: "/settings/taxes", icon: Banknote },
  { title: "GL Accounts (COA)", href: "/finance/coa", icon: Landmark },
  { title: "Defult GL Mapping", href: "/settings/gl-mapping", icon: Calculator },
  { title: "Audit Logs", href: "/settings/audit-logs", icon: ClipboardList }, // New Ph17
  { title: "Company Profile", href: "/settings/company", icon: Building },
  { title: "Number Series", href: "/settings/number-series", icon: ListTodo },
  { title: "Users", href: "/settings/users", icon: UserCog },
  { title: "AI Policies", href: "/settings/ai-policies", icon: Shield },
  { title: "Roles", href: "/settings/roles", icon: Shield },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Layers className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">PryzoAI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) =>
            item.items ? (
              <Collapsible key={item.title} defaultOpen={pathname.startsWith(item.href)}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                          <Link href={item.href}>Dashboard</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={pathname.startsWith(subItem.href)}>
                            <Link href={subItem.href}>
                              <subItem.icon className="h-3 w-3 mr-2" />
                              {subItem.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.href}>
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <Collapsible defaultOpen={pathname.startsWith("/settings")}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                  <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {settingsItems.map((item) => (
                    <SidebarMenuSubItem key={item.title}>
                      <SidebarMenuSubButton asChild isActive={pathname.startsWith(item.href)}>
                        <Link href={item.href}>
                          <item.icon className="h-3 w-3 mr-2" />
                          {item.title}
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
