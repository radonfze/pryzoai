import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { ThemeSelector } from "@/components/theme-selector"
import { HardRefreshButton } from "@/components/hard-refresh-button"
import { AutoLogoutProvider } from "@/components/auto-logout-provider"
import { UserNav } from "@/components/ui/user-nav"
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
           {/* Logo in Header */}
           <div className="flex items-center gap-2">
              <Image src="/header-logo.png" alt="PryzoAI" width={180} height={64} className="h-16 w-auto object-contain" />
           </div>
          </div>
          <HardRefreshButton />
          <ThemeSelector />
          <UserNav />
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

