"use client"

import { useState } from "react"
import { Check, ArrowRight, FileText, CreditCard, BarChart3, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"

const tabs = [
  {
    id: "invoicing",
    label: "Invoicing",
    icon: FileText,
    title: "Get paid faster with professional invoices",
    description: "Create, send, and track invoices in minutes. Accept online payments and automate reminders.",
    features: ["Customizable templates", "Online payments", "Auto reminders", "Multi-currency"],
    color: "from-primary to-primary/70",
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: CreditCard,
    title: "Track every dollar with smart expense management",
    description: "Snap receipts on the go, auto-categorize transactions, and keep your books organized.",
    features: ["Receipt scanning", "Auto-categorization", "Bank integration", "Approval workflows"],
    color: "from-accent to-accent/70",
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    title: "Make data-driven decisions with real-time insights",
    description: "Access powerful financial reports and dashboards for full business visibility.",
    features: ["P&L statements", "Cash flow forecasting", "Custom reports", "Scheduled delivery"],
    color: "from-chart-5 to-chart-5/70",
  },
  {
    id: "tax",
    label: "Tax",
    icon: Receipt,
    title: "Stay compliant without the complexity",
    description: "Automatically calculate taxes, generate compliant reports, and simplify filing.",
    features: ["VAT automation", "Tax-ready reports", "Direct filing", "Audit trail"],
    color: "from-chart-4 to-chart-4/70",
  },
]

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState("invoicing")
  const activeContent = tabs.find((t) => t.id === activeTab)
  const ActiveIcon = activeContent?.icon || FileText

  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">Product Tour</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground text-balance">
            See how Pryzo transforms your workflow
          </h2>
        </div>

        {/* Tabs - Colorful active state */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left - Text Content */}
          <div className="order-2 lg:order-1">
            <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-foreground mb-4">{activeContent?.title}</h3>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">{activeContent?.description}</p>

            <ul className="space-y-3 mb-8">
              {activeContent?.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${activeContent.color} flex items-center justify-center flex-shrink-0 shadow-sm`}
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-foreground font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <Button className="group bg-gradient-to-r from-primary to-chart-5 hover:opacity-90 shadow-lg shadow-primary/20">
              Learn more
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Right - Visual Preview */}
          <div className="order-1 lg:order-2">
            <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              <div className={`bg-gradient-to-r ${activeContent?.color} px-4 py-3 flex items-center gap-3`}>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                </div>
                <span className="text-white/80 text-xs font-medium">{activeContent?.label}</span>
              </div>
              <div className="p-8 min-h-[280px] flex items-center justify-center bg-gradient-to-br from-muted/50 to-background">
                <div className="text-center">
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${activeContent?.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl`}
                  >
                    <ActiveIcon className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-foreground font-semibold text-lg">{activeContent?.label}</p>
                  <p className="text-muted-foreground text-sm mt-1">Interactive preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
