import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full mb-6 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI-powered insights
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] tracking-tight text-foreground text-balance">
              Financial clarity{" "}
              <span className="bg-gradient-to-r from-primary via-chart-2 to-accent bg-clip-text text-transparent">
                made simple
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Manage invoices, track expenses, and generate reports with accounting software designed for modern
              businesses. Tax-ready. Always.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="text-base px-8 bg-gradient-to-r from-primary via-chart-2 to-accent text-white hover:opacity-90 shadow-lg shadow-primary/25"
              >
                Start free trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 group bg-transparent border-primary/30 hover:border-primary/50"
              >
                <Play className="mr-2 w-4 h-4 group-hover:text-accent transition-colors" />
                Watch demo
              </Button>
            </div>

            {/* Social Proof */}
            <p className="mt-8 text-sm text-muted-foreground">Free 14-day trial • No credit card required</p>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            <div className="relative bg-card rounded-2xl shadow-2xl shadow-primary/10 border border-primary/20 overflow-hidden">
              {/* Dashboard Header */}
              <div className="bg-gradient-to-r from-primary/5 via-chart-2/5 to-accent/5 px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <div className="w-3 h-3 rounded-full bg-chart-2" />
                  <div className="w-3 h-3 rounded-full bg-accent" />
                </div>
                <span className="text-xs text-muted-foreground font-mono hidden sm:block">dashboard</span>
              </div>

              {/* Dashboard Content */}
              <div className="p-4 sm:p-6">
                <div className="flex flex-col gap-3 mb-6">
                  <div className="bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl p-4 border border-primary/20">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Revenue</p>
                    <p className="text-2xl font-bold text-foreground mt-1">AED 84,230</p>
                    <p className="text-xs text-primary font-medium mt-1">+12.5%</p>
                  </div>
                  <div className="bg-gradient-to-br from-chart-2/15 to-chart-2/5 rounded-xl p-4 border border-chart-2/20">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Expenses</p>
                    <p className="text-2xl font-bold text-foreground mt-1">AED 23,140</p>
                    <p className="text-xs text-destructive font-medium mt-1">-3.2%</p>
                  </div>
                  <div className="bg-gradient-to-br from-accent/15 to-accent/5 rounded-xl p-4 border border-accent/20">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Profit</p>
                    <p className="text-2xl font-bold text-foreground mt-1">AED 61,090</p>
                    <p className="text-xs text-primary font-medium mt-1">+18.7%</p>
                  </div>
                </div>

                {/* Chart - Colorful bars with Pryzo colors */}
                <div className="bg-muted/30 rounded-xl p-4 h-32 flex items-end gap-1.5">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm transition-colors"
                      style={{
                        height: `${height}%`,
                        background: i % 3 === 0 ? "var(--primary)" : i % 3 === 1 ? "var(--chart-2)" : "var(--accent)",
                        opacity: 0.7 + (height / 100) * 0.3,
                      }}
                    />
                  ))}
                </div>

                {/* Recent Transactions */}
                <div className="mt-6 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Recent Transactions</p>
                  {[
                    { name: "Client Payment", amount: "+AED 4,500", type: "income" },
                    { name: "Software License", amount: "-AED 299", type: "expense" },
                    { name: "Consulting Fee", amount: "+AED 2,100", type: "income" },
                  ].map((tx, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">{tx.name}</span>
                      <span
                        className={`text-sm font-semibold ${tx.type === "income" ? "text-primary" : "text-destructive"}`}
                      >
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-xl border border-accent/20 p-4 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Invoice Paid</p>
                  <p className="text-xs text-muted-foreground">AED 2,450.00 received</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
