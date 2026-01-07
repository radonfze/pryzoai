"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { History, LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function UserNav() {
  const router = useRouter();
  const [recentModules, setRecentModules] = useState<{ name: string; href: string }[]>([]);

  // Simulate recent modules (can be persisted in localStorage later)
  useEffect(() => {
    // This is a placeholder. In a real app, track page visits.
    setRecentModules([
        { name: "Sales Invoices", href: "/sales/invoices" },
        { name: "Quotations", href: "/sales/quotations" },
        { name: "Purchase Bills", href: "/procurement/bills" },
    ]);
  }, []);

  const handleLogout = async () => {
    try {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    } catch (e) {
        console.error("Logout failed", e);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.png" alt="@admin" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Admin User</p>
            <p className="text-xs leading-none text-muted-foreground">
              admin@pryzoai.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Recent Modules */}
        <DropdownMenuGroup>
             <DropdownMenuLabel className="text-xs text-muted-foreground">Recent</DropdownMenuLabel>
             {recentModules.map((module) => (
                <DropdownMenuItem key={module.href} onClick={() => router.push(module.href)}>
                   <History className="mr-2 h-4 w-4 opacity-70" />
                   {module.name}
                </DropdownMenuItem>
             ))}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
