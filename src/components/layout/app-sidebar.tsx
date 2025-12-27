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
      { title: "Invoices", href: "/sales/invoices", icon: Receipt },
      { title: "Sales Orders", href: "/sales/orders", icon: ClipboardList },
      { title: "Quotations", href: "/sales/quotations", icon: FileText },
      { title: "Payments", href: "/sales/payments", icon: CreditCard },
    ],
  },
  {
    title: "Inventory",
    icon: Package,
    href: "/inventory",
    items: [
      { title: "Items", href: "/inventory/items", icon: Boxes },
      { title: "Stock Ledger", href: "/inventory/ledger", icon: BookOpen },
      { title: "Adjustments", href: "/inventory/adjustments/new", icon: ClipboardList },
    ],
  },
  {
    title: "Purchase",
    icon: FileText,
    href: "/procurement",
    items: [
      { title: "Purchase Orders", href: "/procurement/orders", icon: ClipboardList },
      { title: "Goods Receipt", href: "/procurement/grn", icon: Package },
      { title: "Bills", href: "/procurement/bills", icon: Receipt },
    ],
  },
  {
    title: "Finance",
    icon: PieChart,
    href: "/finance",
    items: [
      { title: "Chart of Accounts", href: "/finance/coa", icon: BookOpen },
      { title: "Journal Entries", href: "/finance/journals", icon: FileText },
      { title: "Bank Accounts", href: "/finance/bank-accounts", icon: Landmark },
    ],
  },
  {
    title: "Projects",
    icon: Briefcase,
    href: "/projects",
    items: [
      { title: "Tasks", href: "/projects/tasks", icon: ListTodo },
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
    ],
  },
];

const settingsItems = [
  { title: "Company", href: "/settings/company", icon: Building2 },
  { title: "Customers", href: "/settings/customers", icon: Users },
  { title: "Suppliers", href: "/settings/suppliers", icon: UserPlus },
  { title: "Items", href: "/settings/items", icon: Package },
  { title: "Warehouses", href: "/settings/warehouses", icon: Warehouse },
  { title: "Taxes", href: "/settings/taxes", icon: Receipt },
  { title: "Currencies", href: "/settings/currencies", icon: DollarSign },
  { title: "Payment Terms", href: "/settings/payment-terms", icon: CreditCard },
  { title: "Number Series", href: "/settings/number-series", icon: ListTodo },
  { title: "Users", href: "/settings/users", icon: UserCog },
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
