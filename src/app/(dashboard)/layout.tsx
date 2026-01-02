import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeSelector } from "@/components/theme-selector"
import { HardRefreshButton } from "@/components/hard-refresh-button"
import { AutoLogoutProvider } from "@/components/auto-logout-provider"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Force all dashboard pages to render dynamically (not static generation)
// This prevents DB queries during build time
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1 font-semibold">
           {/* Dynamic breadcrumbs can go here later */}
           PryzoAI ERP
          </div>
          <HardRefreshButton />
          <ThemeSelector />
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <AutoLogoutProvider>
            {children}
          </AutoLogoutProvider>
        </div>
      </main>
    </SidebarProvider>
  )
}

