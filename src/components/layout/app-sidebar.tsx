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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
  Scale,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

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
      { title: "Dashboard", href: "/sales", icon: LayoutDashboard },
      { title: "Invoice Wizard", href: "/sales/invoices/wizard", icon: Wand2 },
      { 
        title: "Invoices", 
        href: "/sales/invoices", 
        icon: Receipt,
        subItems: [
          { title: "List", href: "/sales/invoices" },
          { title: "New Invoice", href: "/sales/invoices/new" }
        ]
      },
      { 
        title: "Sales Orders", 
        href: "/sales/orders", 
        icon: ClipboardList,
        subItems: [
          { title: "List", href: "/sales/orders" },
          { title: "New Order", href: "/sales/orders/new" }
        ]
      },
      { 
        title: "Quotations", 
        href: "/sales/quotations", 
        icon: FileText,
        subItems: [
          { title: "List", href: "/sales/quotations" },
          { title: "New Quotation", href: "/sales/quotations/new" }
        ]
      },
      { 
        title: "Credit Notes", 
        href: "/sales/credit-notes", 
        icon: Receipt,
        subItems: [
          { title: "List", href: "/sales/credit-notes" },
          { title: "New Credit Note", href: "/sales/credit-notes/new" }
        ]
      },
      { 
        title: "Delivery Notes", 
        href: "/sales/delivery-notes", 
        icon: Package,
        subItems: [
          { title: "List", href: "/sales/delivery-notes" },
          { title: "New Delivery Note", href: "/sales/delivery-notes/new" }
        ]
      },
      { 
        title: "Returns", 
        href: "/sales/returns", 
        icon: ClipboardList,
        subItems: [
          { title: "List", href: "/sales/returns" },
          { title: "New Return", href: "/sales/returns/new" }
        ]
      },
      { 
        title: "Warranty Claims", 
        href: "/sales/warranty", 
        icon: ShieldCheck,
        subItems: [
          { title: "List", href: "/sales/warranty" },
          { title: "New Claim", href: "/sales/warranty/new" }
        ]
      },
      { 
        title: "Sales Teams", 
        href: "/sales/teams", 
        icon: Users,
        subItems: [
          { title: "List", href: "/sales/teams" },
          { title: "New Team", href: "/sales/teams/new" }
        ]
      },
      { 
        title: "Sales Targets", 
        href: "/sales/targets", 
        icon: Target,
        subItems: [
          { title: "List", href: "/sales/targets" },
          { title: "New Target", href: "/sales/targets/new" }
        ]
      },
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
      { title: "Dashboard", href: "/inventory", icon: LayoutDashboard },

      { 
        title: "Items", 
        href: "/inventory/items", 
        icon: Boxes,
        subItems: [
           { title: "List", href: "/inventory/items" },
           { title: "New Item", href: "/inventory/items/new" }
        ]
      },
      { 
        title: "Categories", 
        href: "/inventory/categories", 
        icon:  Package,
        subItems: [
           { title: "List", href: "/inventory/categories" },
           { title: "New Category", href: "/inventory/categories/new" }
        ]
      },
      { 
        title: "Subcategories", 
        href: "/inventory/subcategories", 
        icon: Layers,
        subItems: [
           { title: "List", href: "/inventory/subcategories" },
           { title: "New Subcategory", href: "/inventory/subcategories/new" }
        ]
      },
      { 
        title: "Brands", 
        href: "/inventory/brands", 
        icon: Tag,
        subItems: [
           { title: "List", href: "/inventory/brands" },
           { title: "New Brand", href: "/inventory/brands/new" }
        ]
      },
      { 
        title: "Models", 
        href: "/inventory/models", 
        icon: Boxes,
        subItems: [
           { title: "List", href: "/inventory/models" },
           { title: "New Model", href: "/inventory/models/new" }
        ]
      },
      { 
        title: "Units of Measure", 
        href: "/inventory/uom", 
        icon: Scale,
        subItems: [
           { title: "List", href: "/inventory/uom" },
           { title: "New UOM", href: "/inventory/uom/new" }
        ]
      },
      { title: "Stock Ledger", href: "/inventory/ledger", icon: BookOpen },
      { 
        title: "Stock Transfers", 
        href: "/inventory/transfers", 
        icon: ClipboardList,
         subItems: [
           { title: "List", href: "/inventory/transfers" },
           { title: "New Transfer", href: "/inventory/transfers/new" }
        ]
      },
      { 
        title: "Adjustments", 
        href: "/inventory/adjustments", 
        icon: ClipboardList,
        subItems: [
           { title: "List", href: "/inventory/adjustments" },
           { title: "New Adjustment", href: "/inventory/adjustments/new" }
        ]
      },
      { 
        title: "Stock Count", 
        href: "/inventory/count", 
        icon: ClipboardList,
        subItems: [
           { title: "List", href: "/inventory/count" },
           { title: "New Count", href: "/inventory/count/new" }
        ]
      },
      { 
        title: "Bill of Materials", 
        href: "/inventory/bom", 
        icon: Boxes,
        subItems: [
           { title: "List", href: "/inventory/bom" },
           { title: "New BOM", href: "/inventory/bom/new" }
        ]
      },
      { title: "Batch Tracking", href: "/inventory/batches", icon: Boxes },
      { title: "Serial Numbers", href: "/inventory/serials", icon: Tag },
      { title: "Reservations", href: "/inventory/reservations", icon: Lock },
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
      { title: "Dashboard", href: "/finance", icon: LayoutDashboard },
      { title: "Receivables", href: "/finance/receivables", icon: DollarSign,
        subItems: [
          { title: "Customer Receipts", href: "/finance/receivables/receipts" },
          { title: "Advance Payments", href: "/finance/receivables/advances" },
        ]
      },
      { title: "Payables", href: "/finance/payables", icon: CreditCard,
        subItems: [
          { title: "Supplier Payments", href: "/finance/payables/payments" },
          { title: "Advance to Suppliers", href: "/finance/payables/advances" },
        ]
      },
      { title: "Chart of Accounts", href: "/finance/coa", icon: BookOpen },
      { title: "Journal Entries", href: "/finance/journals", icon: FileText },
      { title: "Bank Accounts", href: "/finance/bank-accounts", icon: Landmark },
      { title: "Fixed Assets", href: "/finance/assets", icon: Building },
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
  const { state } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="relative h-16 w-auto min-w-[50px] flex items-center justify-center">
            {state === "collapsed" ? (
               <Image src="/logo-hq.png" alt="PryzoAI" width={50} height={50} className="object-contain h-12 w-auto" priority />
            ) : (
               <Image src="/logo-full.png" alt="PryzoAI" width={180} height={60} className="object-contain h-14 w-auto" priority />
            )}
          </div>
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
                      {item.items.map((subItem: any) => (
                        <div key={subItem.title}>
                           {subItem.subItems ? (
                               // 3rd Level Item
                              <Collapsible key={subItem.title} defaultOpen={pathname.startsWith(subItem.href)} className="group/sub-collapsible">
                                <SidebarMenuItem>
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuSubButton 
                                      className={`ring-0 hover:bg-transparent justify-between
                                        ${pathname.startsWith(subItem.href)
                                          ? "text-foreground font-medium"
                                          : "text-muted-foreground hover:text-foreground"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <subItem.icon className={`h-3.5 w-3.5`} />
                                        <span>{subItem.title}</span>
                                      </div>
                                      <ChevronRight className={`h-3 w-3 transition-transform group-data-[state=open]/sub-collapsible:rotate-90`} />
                                    </SidebarMenuSubButton>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="pl-4 border-l ml-2 mt-1 space-y-1">
                                      {subItem.subItems.map((grandItem: any) => (
                                          <SidebarMenuButton 
                                            key={grandItem.title}
                                            asChild 
                                            size="sm" 
                                            className={`h-7 text-xs
                                              ${pathname === grandItem.href 
                                              ? "bg-muted text-foreground font-medium" 
                                              : "text-muted-foreground hover:text-foreground"
                                            }`}
                                          >
                                            <Link href={grandItem.href}>
                                              <span>{grandItem.title}</span>
                                            </Link>
                                          </SidebarMenuButton>
                                      ))}
                                    </div>
                                  </CollapsibleContent>
                                </SidebarMenuItem>
                              </Collapsible>
                           ) : (
                             // 2nd Level Item (Standard)
                             <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={pathname.startsWith(subItem.href)} className="ring-0 hover:bg-transparent">
                                 <Link href={subItem.href} className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 
                                    ${pathname.startsWith(subItem.href) 
                                      ? `${item.gradient} font-medium translate-x-1 shadow-sm text-white` 
                                      : "text-muted-foreground hover:text-foreground hover:translate-x-1"
                                    }`}>
                                  <subItem.icon className={`h-3.5 w-3.5 ${pathname.startsWith(subItem.href) ? "text-white" : "text-muted-foreground"}`} />
                                  <span className={pathname.startsWith(subItem.href) ? "text-white" : ""}>
                                    {subItem.title}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                           )}
                        </div>
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
      <SidebarFooter className="mt-auto">
         <div className="p-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2">
                        <UserCog className="h-4 w-4" />
                        <div className="flex flex-col items-start gap-0.5 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">User Options</span>
                            <span>v5.26 (Phase 26)</span>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuItem asChild>
                        <Link href="/settings/profile">
                            <UserCog className="mr-2 h-4 w-4" /> Profile
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        className="text-red-600 focus:text-red-700 focus:bg-red-100"
                        onClick={async () => {
                            await fetch("/api/auth/logout", { method: "POST" });
                            window.location.href = "/auth/login";
                        }}
                    >
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
         </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
