"use client"

import { motion } from "framer-motion"

const companies = [
  { name: "Acme Corp", initial: "A", color: "from-primary to-primary/70" },
  { name: "Quantum", initial: "Q", color: "from-accent to-accent/70" },
  { name: "Horizon", initial: "H", color: "from-chart-5 to-chart-5/70" },
  { name: "Nexus", initial: "N", color: "from-chart-4 to-chart-4/70" },
  { name: "Vertex", initial: "V", color: "from-primary to-primary/70" },
  { name: "Apex", initial: "X", color: "from-accent to-accent/70" },
]

export function TrustedBy() {
  return (
    <section className="py-12 border-y border-border/50 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Trusted by <span className="font-semibold text-foreground">50,000+</span> businesses worldwide
        </p>

        <div className="flex flex-wrap justify-center items-center gap-6 lg:gap-12">
          {companies.map((company) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${company.color} flex items-center justify-center shadow-sm`}
              >
                <span className="font-bold text-sm text-white">{company.initial}</span>
              </div>
              <span className="font-semibold text-sm hidden sm:block">{company.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
