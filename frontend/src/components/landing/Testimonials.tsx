import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Freelance Graphic Designer",
    content:
      "I was spending hundreds on my accountant just for basic advice. The AI found tax deductions I never knew existed. Saved me over £4,000 this year alone.",
    stars: 5,
    initials: "SM",
  },
  {
    name: "James Chen",
    role: "E-commerce Business Owner",
    content:
      "The knowledge graph is incredible. I could see exactly how my expenses connected to potential savings. Worth every penny of the £10.",
    stars: 5,
    initials: "JC",
  },
  {
    name: "Rebecca Thompson",
    role: "IT Contractor",
    content:
      "As a contractor, IR35 rules are confusing. The AI explained everything clearly and gave me a strategy my accountant confirmed was spot-on.",
    stars: 5,
    initials: "RT",
  },
  {
    name: "David Okafor",
    role: "Small Business Owner",
    content:
      "I uploaded my last 3 years of accounts and the AI identified patterns I completely missed. The strategy PDF was professional enough to share with my bank.",
    stars: 5,
    initials: "DO",
  },
  {
    name: "Emma Williams",
    role: "Property Investor",
    content:
      "Managing rental income tax was a nightmare. The AI consultation gave me a clear action plan that my accountant says will save me £2,800 annually.",
    stars: 5,
    initials: "EW",
  },
  {
    name: "Michael Fraser",
    role: "Startup Founder",
    content:
      "Running a startup, every penny counts. For £10 I got advice that would have cost me £500+ from a traditional accountant. The future of tax advice is here.",
    stars: 5,
    initials: "MF",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 bg-ds-bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-ds-text-primary">
            Trusted by UK Businesses
          </h2>
          <p className="mt-4 text-lg text-ds-text-secondary max-w-xl mx-auto">
            See what our clients are saying about their AI tax consultation experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="glass rounded-2xl p-6 h-full hover:-translate-y-1 transition-transform duration-300">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-ds-feedback-warning text-ds-feedback-warning" />
                  ))}
                </div>

                <p className="text-sm text-ds-text-secondary leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary text-sm font-bold text-white">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ds-text-primary">{testimonial.name}</p>
                    <p className="text-xs text-ds-text-muted">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
