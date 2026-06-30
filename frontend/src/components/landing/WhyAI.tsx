import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Clock,
  PoundSterling,
  Brain,
  ShieldCheck,
  TrendingUp,
  Users,
  ArrowRight,
  X,
  Check,
  Zap,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const advantages = [
  {
    icon: Brain,
    title: "Trained on 100,000+ Real UK Cases",
    description:
      "Our AI isn't generic. We built a proprietary model trained specifically on over 100,000 real UK accounting cases — sole traders, limited companies, freelancers, landlords, and more. It understands your exact situation because it's seen thousands like it.",
  },
  {
    icon: Clock,
    title: "Instant Answers, Not 2-Week Waits",
    description:
      "A traditional accountant takes days or weeks to review your documents and respond. Our AI analyses everything in under 30 seconds and gives you a complete strategy immediately. Your time is money — stop wasting it waiting.",
  },
  {
    icon: PoundSterling,
    title: "£10 vs £150+/hour",
    description:
      "The average UK accountant charges £150-£300 per hour. A simple tax review can cost £500+. Our AI delivers the same quality advice for just £10 — a one-time payment. That's 97% cheaper than a traditional consultation.",
  },
  {
    icon: ShieldCheck,
    title: "Always Up-to-Date with HMRC",
    description:
      "Tax law changes constantly. Human accountants can miss updates or use outdated knowledge. Our AI is continuously updated with the latest HMRC guidelines, tax thresholds, and legislative changes — so your advice is always current.",
  },
  {
    icon: TrendingUp,
    title: "Finds Savings Humans Miss",
    description:
      "Our AI cross-references your data against 100,000+ cases to find patterns and savings that even experienced accountants overlook. On average, clients discover £3,200 in additional annual savings they didn't know about.",
  },
  {
    icon: Users,
    title: "No Bias, No Judgement",
    description:
      "Accountants are human — they can be rushed, distracted, or biased. Our AI gives every client the same thorough, objective analysis regardless of your business size, industry, or how much you're paying.",
  },
];

const comparison = [
  { feature: "Cost per consultation", ai: "£10 one-time", human: "£150-£500+", aiWins: true },
  { feature: "Response time", ai: "Under 30 seconds", human: "3-14 days", aiWins: true },
  { feature: "Available hours", ai: "24/7, 365 days", human: "Mon-Fri, 9-5", aiWins: true },
  { feature: "UK tax cases analysed", ai: "100,000+", human: "50-200/year", aiWins: true },
  { feature: "Always up-to-date with HMRC", ai: "Real-time updates", human: "Annual CPD", aiWins: true },
  { feature: "Document analysis", ai: "Unlimited, instant", human: "Manual, hours", aiWins: true },
  { feature: "Personalised strategy PDF", ai: "Included free", human: "£200+ extra", aiWins: true },
  { feature: "Follow-up questions", ai: "50 included", human: "Billed per email", aiWins: true },
];

export function WhyAI() {
  return (
    <section id="why-ai" className="relative py-24 bg-ds-bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ds-accent-primary/20 bg-ds-accent-primary/5 px-4 py-1.5 text-sm font-medium text-ds-text-accent">
            <Zap className="h-4 w-4" />
            Why Businesses Are Switching
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ds-text-primary">
            Why Our AI Accountant{" "}
            <span className="text-gradient">Outperforms</span> Humans
          </h2>
          <p className="mt-4 text-lg text-ds-text-secondary max-w-3xl mx-auto leading-relaxed">
            We didn't just plug into ChatGPT. We built a <strong className="text-ds-text-primary">purpose-built AI model</strong> trained
            exclusively on UK accounting data from <strong className="text-ds-text-primary">100,000+ real client cases</strong>. Here's why
            that matters for your business.
          </p>
        </motion.div>

        {/* Advantage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {advantages.map((advantage, i) => (
            <motion.div
              key={advantage.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group"
            >
              <div className="glass rounded-2xl p-6 h-full hover:border-ds-accent-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-ds-accent-primary/5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ds-accent-primary/8 border border-ds-accent-primary/15 group-hover:bg-ds-accent-primary/15 transition-colors">
                  <advantage.icon className="h-6 w-6 text-ds-text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-ds-text-primary mb-2">
                  {advantage.title}
                </h3>
                <p className="text-sm text-ds-text-secondary leading-relaxed">
                  {advantage.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-ds-text-primary">
              Side-by-Side:{" "}
              <span className="text-gradient">AI vs Human Accountant</span>
            </h3>
            <p className="mt-3 text-ds-text-secondary">
              The numbers speak for themselves. See why thousands of UK businesses are making the switch.
            </p>
          </div>

          <div className="glass-strong rounded-2xl overflow-hidden bg-glow">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-ds-border-default">
                    <th className="py-4 px-6 text-sm font-medium text-ds-text-muted" />
                    <th className="py-4 px-6 text-sm font-semibold text-ds-text-accent text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Brain className="h-4 w-4" />
                        Our AI Accountant
                      </div>
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold text-ds-text-secondary text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        Human Accountant
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={i < comparison.length - 1 ? "border-b border-ds-border-default/50" : ""}
                    >
                      <td className="py-3.5 px-6 text-sm font-medium text-ds-text-primary">
                        {row.feature}
                      </td>
                      <td className="py-3.5 px-6 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Check className="h-4 w-4 text-ds-feedback-success flex-shrink-0" />
                          <span className="text-ds-feedback-success font-medium">{row.ai}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <X className="h-4 w-4 text-ds-feedback-error flex-shrink-0" />
                          <span className="text-ds-text-muted">{row.human}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA with proprietary model callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-16 text-center"
        >
          <div className="glass rounded-2xl p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-ds-text-accent" />
              <span className="text-sm font-semibold text-ds-text-accent uppercase tracking-wide">Our Proprietary Technology</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-ds-text-primary mb-3">
              Not Just Another ChatGPT Wrapper
            </h3>
            <p className="text-ds-text-secondary leading-relaxed mb-6 max-w-2xl mx-auto">
              We spent years building a specialised AI model fine-tuned on <strong className="text-ds-text-primary">100,000+ real UK
              accounting cases</strong>. Every tax scenario, every HMRC ruling, every industry-specific deduction —
              our model has seen it all. This is why we consistently find savings that generic AI tools and even
              experienced accountants miss.
            </p>
            <Link to="/register">
              <Button variant="glow" size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Try It Now — Just £10
              </Button>
            </Link>
            <p className="mt-4 text-xs text-ds-text-muted">
              Join 100,000+ UK businesses who trust our AI with their tax strategy
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
