"use client"

import { useState } from "react"
import { Check, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Starter",
    description: "Perfect for freelancers and solopreneurs",
    price: { monthly: 0, yearly: 0 },
    features: ["Up to 5 invoices/month", "Basic expense tracking", "1 user", "Email support", "Mobile app access"],
    cta: "Get started free",
    highlighted: false,
    color: "border-border",
  },
  {
    name: "Professional",
    description: "For growing businesses and small teams",
    price: { monthly: 99, yearly: 79 },
    features: [
      "Unlimited invoices",
      "Advanced expense tracking",
      "Up to 5 users",
      "Bank connections",
      "Custom reports",
      "Priority support",
      "Tax compliance tools",
    ],
    cta: "Start free trial",
    highlighted: true,
    color: "border-primary",
  },
  {
    name: "Enterprise",
    description: "For larger organizations with custom needs",
    price: { monthly: 299, yearly: 249 },
    features: [
      "Everything in Professional",
      "Unlimited users",
      "Multi-entity support",
      "Advanced automations",
      "Dedicated manager",
      "API access",
      "Custom integrations",
      "SSO & security",
    ],
    cta: "Contact sales",
    highlighted: false,
    color: "border-border",
  },
]

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly")

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">Pricing</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground text-balance">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your business. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Billing Toggle - Better styled toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span
            className={`text-sm font-medium ${billingPeriod === "monthly" ? "text-foreground" : "text-muted-foreground"}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
            className="relative w-14 h-8 bg-muted rounded-full p-1 transition-colors border border-border"
          >
            <div
              className={`w-6 h-6 bg-gradient-to-r from-primary to-chart-5 rounded-full transition-transform shadow-md ${
                billingPeriod === "yearly" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${billingPeriod === "yearly" ? "text-foreground" : "text-muted-foreground"}`}
          >
            Yearly
            <span className="ml-2 px-2 py-0.5 bg-accent/20 text-accent text-xs font-semibold rounded-full">-20%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-card rounded-2xl border-2 p-6 lg:p-8 transition-all duration-300 ${plan.color} ${
                plan.highlighted ? "shadow-2xl shadow-primary/20 lg:scale-105" : "hover:shadow-lg"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-primary to-chart-5 text-primary-foreground text-xs font-semibold rounded-full flex items-center gap-1 shadow-lg">
                  <Star className="w-3 h-3 fill-current" /> Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-bold text-foreground">AED {plan.price[billingPeriod]}</span>
                {plan.price[billingPeriod] > 0 && <span className="text-muted-foreground ml-1">/mo</span>}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.highlighted ? "bg-primary/20" : "bg-accent/20"}`}
                    >
                      <Check className={`w-3 h-3 ${plan.highlighted ? "text-primary" : "text-accent"}`} />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full font-semibold ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-primary to-chart-5 text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
