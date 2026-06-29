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
      "AI analyses your financial data and identifies tax-saving opportunities specific to your business structure and industry.",
  },
  {
    icon: FileSearch,
    title: "Document Analysis",
    description:
      "Upload PDF, DOC, TXT, and spreadsheet files. Our AI extracts and understands your financial data automatically.",
  },
  {
    icon: GitBranch,
    title: "Knowledge Graph Visualisation",
    description:
      "See how your financial data connects in an interactive Obsidian-style knowledge graph with real-time updates.",
  },
  {
    icon: FileDown,
    title: "Downloadable Strategy PDF",
    description:
      "Get a comprehensive, personalised tax strategy document you can share with your accountant.",
  },
  {
    icon: MessageSquare,
    title: "50 Follow-up Questions",
    description:
      "Ask up to 50 detailed questions about your tax strategy. Get specific, actionable answers instantly.",
  },
  {
    icon: Scale,
    title: "UK Tax Law Expertise",
    description:
      "Trained on current UK tax legislation, HMRC guidelines, and real-world company filings for accurate advice.",
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
            Powerful AI tools designed to help UK businesses optimise their tax position
            and save money.
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
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-ds-accent-primary/10 border border-ds-accent-primary/20 group-hover:bg-ds-accent-primary/20 transition-colors">
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
