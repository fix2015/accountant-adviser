import { motion } from "framer-motion";
import {
  TrendingUp,
  FileSearch,
  GitBranch,
  FileDown,
  MessageSquare,
  Scale,
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Tax Optimisation Strategies",
    description:
      "Our proprietary AI analyses your financial data against 100,000+ UK cases to find tax-saving opportunities that generic tools and human accountants consistently miss.",
  },
  {
    icon: FileSearch,
    title: "Instant Document Analysis",
    description:
      "Upload PDF, DOC, TXT, and spreadsheets. Our AI extracts, understands, and cross-references your financial data in seconds — not days like a traditional accountant.",
  },
  {
    icon: GitBranch,
    title: "Knowledge Graph Visualisation",
    description:
      "See exactly how your finances connect in an interactive knowledge graph. Understand relationships between income, expenses, tax, and savings at a glance.",
  },
  {
    icon: FileDown,
    title: "Professional Strategy PDF",
    description:
      "Receive a comprehensive, personalised tax strategy document — the same quality you'd get from a £500 accountant consultation, generated in 30 seconds.",
  },
  {
    icon: MessageSquare,
    title: "50 Expert Follow-up Questions",
    description:
      "Ask detailed questions about your tax strategy and get specific, actionable answers drawn from our database of 100,000+ real UK accounting scenarios.",
  },
  {
    icon: Scale,
    title: "Deep UK Tax Expertise",
    description:
      "Trained on current UK tax legislation, HMRC guidelines, and real company filings. Our model specialises in UK accounting — it's not a generic global AI.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 bg-ds-bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-ds-text-primary">
            Everything You Need for{" "}
            <span className="text-gradient">Smarter Taxes</span>
          </h2>
          <p className="mt-4 text-lg text-ds-text-secondary max-w-2xl mx-auto">
            Powerful AI tools built specifically for UK businesses. Trained on real data, not generic knowledge.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group"
            >
              <div className="glass rounded-2xl p-6 h-full hover:border-ds-accent-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-ds-accent-primary/5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-ds-accent-primary/8 border border-ds-accent-primary/15 group-hover:bg-ds-accent-primary/15 transition-colors">
                  <feature.icon className="h-5 w-5 text-ds-text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-ds-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-ds-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
