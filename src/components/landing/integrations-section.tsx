"use client"

import { motion } from "framer-motion"

const integrations = [
  { name: "Stripe", category: "Payments" },
  { name: "PayPal", category: "Payments" },
  { name: "Shopify", category: "E-commerce" },
  { name: "Square", category: "POS" },
  { name: "Slack", category: "Communication" },
  { name: "Zapier", category: "Automation" },
  { name: "Xero", category: "Migration" },
  { name: "Google Drive", category: "Storage" },
  { name: "Dropbox", category: "Storage" },
  { name: "HubSpot", category: "CRM" },
  { name: "Salesforce", category: "CRM" },
  { name: "Gusto", category: "Payroll" },
]

export function IntegrationsSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm uppercase tracking-wider text-accent font-medium mb-4"
          >
            Integrations
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground text-balance"
          >
            Connects with tools you already use
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Seamlessly integrate with 200+ apps to streamline your workflow.
          </motion.p>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {integrations.map((integration, i) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md hover:border-accent/30 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 bg-secondary rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                <span className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
                  {integration.name.charAt(0)}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">{integration.name}</p>
              <p className="text-xs text-muted-foreground">{integration.category}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <a href="#" className="text-accent hover:underline text-sm font-medium">
            View all 200+ integrations →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
