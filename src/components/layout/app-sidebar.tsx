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
  Workflow,
  Lock,
  Coins,
  Calculator,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
    gradient: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md",
  },
  {
    title: "Sales",
    icon: ShoppingCart,
    href: "/sales",
    color: "text-blue-500",
    gradient: "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md",
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
      { title: "Statement of Account", href: "/sales/reports/customer-statement", icon: FileText },
    ],
  },
  {
    title: "Inventory",
    icon: Package,
    href: "/inventory",
    color: "text-emerald-500",
    gradient: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md",
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
    href: "/ai/copilot",
    color: "text-violet-600",
    gradient: "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md",
  },
  {
    title: "Purchase",
    icon: FileText,
    href: "/procurement",
    color: "text-orange-500",
    gradient: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md",
    items: [
      { title: "Purchase Orders", href: "/procurement/orders", icon: ClipboardList },
      { title: "Goods Receipt", href: "/procurement/grn", icon: Package },
      { title: "Bills", href: "/procurement/bills", icon: Receipt },
      { title: "Debit Notes", href: "/procurement/debit-notes", icon: Receipt },
      { title: "Returns", href: "/procurement/returns", icon: ClipboardList },
      { title: "Supplier Payments", href: "/procurement/payments", icon: CreditCard },
      { title: "Statement of Account", href: "/procurement/reports/supplier-statement", icon: FileText },
    ],
  },
  {
    title: "Finance",
    icon: PieChart,
    href: "/finance",
    color: "text-indigo-500",
    gradient: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md",
    items: [
      { title: "Chart of Accounts", href: "/finance/coa", icon: BookOpen },
      { title: "Journal Entries", href: "/finance/journals", icon: FileText },
      { title: "Fixed Assets", href: "/finance/assets", icon: Building },
      { title: "Bank Accounts", href: "/finance/bank-accounts", icon: Landmark },
      { title: "Budgets", href: "/finance/budgets", icon: Banknote },
      { title: "Reconciliation", href: "/finance/reconciliation", icon: ClipboardList },
      { title: "Tax Audit (FAF)", href: "/finance/tax-audit", icon: ShieldCheck },
      { title: "Reports Dashboard", href: "/reports", icon: PieChart },
    ],
  },
  {
    title: "Projects",
    icon: Briefcase,
    href: "/projects",
    color: "text-cyan-500",
    gradient: "bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md",
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
    color: "text-pink-500",
    gradient: "bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-md",
    items: [
      { title: "Employees", href: "/hr/employees", icon: UserCog },
      { title: "Attendance", href: "/hr/attendance", icon: Calendar },
      { title: "Leaves", href: "/hr/leaves", icon: ClipboardList },
      { title: "Payroll", href: "/hr/payroll", icon: Banknote },
    ],
  },
  {
    title: "Manufacture", // Shortened for fit
    icon: Factory,
    href: "/manufacturing",
    color: "text-slate-500",
    gradient: "bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-md",
    items: [
      { title: "Work Orders", href: "/manufacturing/work-orders", icon: Hammer },
      { title: "Bill of Materials", href: "/manufacturing/bom", icon: Boxes },
      { title: "Production Planning", href: "/manufacturing/planning", icon: Calendar },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-gray-500",
    items: [
      { title: "General", href: "/settings", icon: LayoutDashboard },
      { title: "Company", href: "/settings/company", icon: Building2 },
      { title: "Theme", href: "/settings/theme", icon: Layers },
      { title: "Customers", href: "/settings/customers", icon: Users },
      { title: "Suppliers", href: "/settings/suppliers", icon: UserPlus },
      { title: "Items", href: "/settings/items", icon: Package },
      { title: "Branches", href: "/settings/branches", icon: Building },
      { title: "Warehouses", href: "/settings/warehouses", icon: Warehouse },
      { title: "Currencies", href: "/settings/currencies", icon: Coins },
      { title: "Taxes", href: "/settings/taxes", icon: Banknote },
      { title: "Payment Terms", href: "/settings/payment-terms", icon: Clock },
      { title: "Approvals", href: "/settings/approvals", icon: ShieldCheck },
      { title: "GL Accounts", href: "/finance/coa", icon: Landmark },
      { title: "Mapping", href: "/settings/gl-mapping", icon: Calculator },
      { title: "Audit Logs", href: "/settings/audit-logs", icon: ClipboardList },
      { title: "Number Series", href: "/settings/number-series", icon: ListTodo },
      { title: "Users", href: "/settings/users", icon: UserCog },
      { title: "AI Policies", href: "/settings/ai-policies", icon: Shield },
      { title: "Roles", href: "/settings/roles", icon: Shield },
      { title: "Permissions", href: "/settings/roles/matrix", icon: Lock },
      { title: "Integrations", href: "/settings/integrations", icon: Workflow },
      { title: "Backup", href: "/settings/backup", icon: Layers },
    ],
  },
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
              <Collapsible key={item.title} defaultOpen={pathname.startsWith(item.href)} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      tooltip={item.title} 
                      className={`transition-all duration-200 ${pathname.startsWith(item.href) ? item.gradient : "hover:bg-sidebar-accent"}`}
                    >
                      <item.icon className={`h-4 w-4 ${pathname.startsWith(item.href) ? "text-white" : item.color}`} />
                      <span className={pathname.startsWith(item.href) ? "text-white font-medium" : "text-muted-foreground group-hover/collapsible:text-sidebar-foreground transition-colors"}>
                        {item.title}
                      </span>
                      <ChevronRight className={`ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90 ${pathname.startsWith(item.href) ? "text-white" : "text-muted-foreground"}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={pathname.startsWith(subItem.href)} className="ring-0 hover:bg-transparent">
                             <Link href={subItem.href} className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 
                                ${pathname.startsWith(subItem.href) 
                                  ? `${item.gradient} font-medium translate-x-1 shadow-sm` 
                                  : "text-muted-foreground hover:text-foreground hover:translate-x-1"
                                }`}>
                              <subItem.icon className={`h-3.5 w-3.5 ${pathname.startsWith(subItem.href) ? "text-white" : "text-muted-foreground"}`} />
                              <span className={pathname.startsWith(subItem.href) ? "text-white" : ""}>
                                {subItem.title}
                              </span>
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
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href} 
                  tooltip={item.title} 
                  className={`transition-all duration-200 ${pathname === item.href ? item.gradient : "hover:bg-sidebar-accent"}`}
                >
                  <Link href={item.href}>
                    <item.icon className={`h-4 w-4 ${pathname === item.href ? "text-white" : item.color}`} />
                    <span className={pathname === item.href ? "text-white font-medium" : "text-muted-foreground"}>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         {/* Footer content can be used for user profile or version later */}
         <div className="px-4 py-2 text-xs text-muted-foreground text-center">
             v5.26 (Phase 26)
         </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
