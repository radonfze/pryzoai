"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/untitled-20design.jpg"
              alt="Pryzo"
              width={120}
              height={50}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Products <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>Invoicing</DropdownMenuItem>
                <DropdownMenuItem>Expense Tracking</DropdownMenuItem>
                <DropdownMenuItem>Reports & Analytics</DropdownMenuItem>
                <DropdownMenuItem>Tax Management</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Solutions <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>Small Business</DropdownMenuItem>
                <DropdownMenuItem>Freelancers</DropdownMenuItem>
                <DropdownMenuItem>Enterprises</DropdownMenuItem>
                <DropdownMenuItem>Accountants</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Resources
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <Button variant="ghost" className="text-sm font-medium" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button className="text-sm bg-gradient-to-r from-primary via-chart-2 to-accent text-white hover:opacity-90 shadow-lg shadow-primary/25" asChild>
              <Link href="/login">Start free trial</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                Products
              </Link>
              <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                Solutions
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                Pricing
              </Link>
              <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground py-2">
                Resources
              </Link>
              <div className="flex flex-col gap-2 pt-4">
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button className="w-full bg-gradient-to-r from-primary via-chart-2 to-accent text-white" asChild>
                  <Link href="/login">Start free trial</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
