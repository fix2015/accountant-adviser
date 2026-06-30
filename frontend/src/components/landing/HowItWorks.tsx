import { motion } from "framer-motion";
import { CreditCard, Upload, Brain, FileDown, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: CreditCard,
    title: "Pay £10",
    description: "One-time payment for your complete AI consultation. No hidden fees, no subscriptions.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Upload,
    title: "Upload Documents",
    description: "Upload your financial documents. We support PDF, DOC, TXT, and spreadsheet formats.",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    icon: Brain,
    title: "AI Analyses Everything",
    description: "Our proprietary AI — trained on 100,000+ UK cases — analyses your data to find hidden savings.",
    color: "from-violet-500 to-violet-600",
  },
  {
    icon: FileDown,
    title: "Get Your Strategy",
    description: "Receive a downloadable tax optimisation strategy with 50 follow-up questions included.",
    color: "from-emerald-500 to-emerald-600",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-ds-text-primary">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-ds-text-secondary max-w-2xl mx-auto">
            Four simple steps to optimised taxes. The whole process takes less than 30 minutes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative group"
            >
              <div className="glass rounded-2xl p-6 h-full hover:border-ds-border-strong transition-all duration-300 hover:-translate-y-1">
                {/* Step number */}
                <div className="absolute -top-3 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-ds-border-strong text-xs font-bold text-ds-text-accent shadow-sm">
                  {i + 1}
                </div>

                {/* Icon */}
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-lg`}>
                  <step.icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="text-lg font-semibold text-ds-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-ds-text-secondary leading-relaxed">{step.description}</p>
              </div>

              {/* Arrow connector (not on last item) */}
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 z-10 -translate-y-1/2">
                  <ArrowRight className="h-5 w-5 text-ds-text-muted" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
