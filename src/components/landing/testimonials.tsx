import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    quote:
      "Pryzo has completely transformed how we manage our finances. The interface is intuitive, and the automation saves us hours every week.",
    author: "Sarah Mitchell",
    role: "CEO, TechStart Inc.",
    rating: 5,
    color: "from-primary to-primary/70",
  },
  {
    quote:
      "Finally, accounting software that doesn't feel like a chore. The reports are beautiful, and tax time is no longer stressful.",
    author: "James Chen",
    role: "Founder, DesignLab",
    rating: 5,
    color: "from-accent to-accent/70",
  },
  {
    quote:
      "We switched from traditional software and never looked back. The collaboration features make working with our accountant seamless.",
    author: "Maria Rodriguez",
    role: "CFO, GrowthCo",
    rating: 5,
    color: "from-chart-5 to-chart-5/70",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">Customer Stories</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground text-balance">
            Loved by{" "}
            <span className="bg-gradient-to-r from-primary via-chart-5 to-accent bg-clip-text text-transparent">
              finance teams
            </span>{" "}
            everywhere
          </h2>
        </div>

        {/* Testimonials Grid - Colorful cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="relative bg-card border border-border rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Decorative quote icon */}
              <div className="absolute top-6 right-6 opacity-10">
                <Quote className="w-12 h-12 text-primary" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, j) => (
                  <Star key={j} className="w-5 h-5 fill-chart-4 text-chart-4" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-foreground text-lg leading-relaxed mb-8 relative z-10">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${testimonial.color} rounded-full flex items-center justify-center shadow-md`}
                >
                  <span className="text-lg font-bold text-white">{testimonial.author.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
