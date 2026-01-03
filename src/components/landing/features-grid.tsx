import { FileText, PieChart, CreditCard, Users, Shield, Zap, Globe, BarChart3 } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Smart Invoicing",
    description: "Create professional invoices in seconds. Automate reminders and get paid faster.",
    color: "from-primary/20 to-primary/5 border-primary/20",
    iconColor: "text-primary",
  },
  {
    icon: PieChart,
    title: "Expense Tracking",
    description: "Snap receipts, categorize expenses automatically, and track all spending.",
    color: "from-accent/20 to-accent/5 border-accent/20",
    iconColor: "text-accent",
  },
  {
    icon: BarChart3,
    title: "Real-time Reports",
    description: "Get instant insights on cash flow, profit margins, and financial health.",
    color: "from-chart-5/20 to-chart-5/5 border-chart-5/20",
    iconColor: "text-chart-5",
  },
  {
    icon: Shield,
    title: "Tax Compliance",
    description: "Stay VAT and tax ready. Generate compliant reports and file returns.",
    color: "from-chart-4/20 to-chart-4/5 border-chart-4/20",
    iconColor: "text-chart-4",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite your accountant, assign roles, and work together securely.",
    color: "from-primary/20 to-primary/5 border-primary/20",
    iconColor: "text-primary",
  },
  {
    icon: CreditCard,
    title: "Bank Connections",
    description: "Connect accounts for automatic imports. Match transactions easily.",
    color: "from-accent/20 to-accent/5 border-accent/20",
    iconColor: "text-accent",
  },
  {
    icon: Globe,
    title: "Multi-Currency",
    description: "Handle international transactions with automatic exchange rates.",
    color: "from-chart-5/20 to-chart-5/5 border-chart-5/20",
    iconColor: "text-chart-5",
  },
  {
    icon: Zap,
    title: "Automation",
    description: "Set up recurring invoices and smart workflows to save hours.",
    color: "from-chart-4/20 to-chart-4/5 border-chart-4/20",
    iconColor: "text-chart-4",
  },
]

export function FeaturesGrid() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">Powerful Features</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground text-balance">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-primary via-chart-5 to-accent bg-clip-text text-transparent">
              master your finances
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From invoicing to reporting, we've built the tools that growing businesses actually need.
          </p>
        </div>

        {/* Features Grid - Colorful gradient cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group bg-gradient-to-br ${feature.color} border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
            >
              <div className={`w-12 h-12 bg-card rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
