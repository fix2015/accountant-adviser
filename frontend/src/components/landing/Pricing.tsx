import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Zap, Star, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

const freeFeatures = [
  "3 AI tax questions",
  "Upload 1 document",
  "Basic tax insights",
  "No credit card required",
];

const mainFeatures = [
  "Full AI tax consultation",
  "Upload unlimited documents",
  "Interactive knowledge graph",
  "50 follow-up questions",
  "Downloadable strategy PDF",
  "UK tax law expertise",
  "Data encrypted & secure",
];

const subscriptionFeatures = [
  "20 questions per month",
  "Ongoing AI access",
  "Upload unlimited documents",
  "Monthly strategy updates",
  "Knowledge graph access",
  "Cancel anytime",
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-ds-text-primary">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-ds-text-secondary max-w-xl mx-auto">
            97% cheaper than a human accountant. Same quality advice, powered by 100,000+ UK cases.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Trial */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="glass rounded-2xl p-8 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-ds-accent-secondary" />
                <span className="text-sm font-medium text-ds-accent-secondary">Try Free</span>
              </div>
              <h3 className="text-2xl font-bold text-ds-text-primary">Free Trial</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-ds-text-primary">£0</span>
                <span className="text-ds-text-muted">forever</span>
              </div>
              <p className="mt-3 text-sm text-ds-text-secondary">
                Try the AI adviser with no commitment. See how it works.
              </p>

              <ul className="mt-8 space-y-3">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-ds-text-secondary">
                    <Check className="h-4 w-4 text-ds-accent-secondary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link to="/register" className="block mt-8">
                <Button variant="secondary" size="lg" className="w-full">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Full Consultation — Most Popular */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-ds-accent-primary/50 to-ds-accent-secondary/50 opacity-70" />
            <div className="relative rounded-2xl bg-ds-bg-tertiary p-8 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-ds-text-accent" />
                <span className="text-sm font-medium text-ds-text-accent">Most Popular</span>
              </div>
              <h3 className="text-2xl font-bold text-ds-text-primary">Full Consultation</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-gradient">£10</span>
                <span className="text-ds-text-muted">one-time</span>
              </div>
              <p className="mt-3 text-sm text-ds-text-secondary">
                Our proprietary AI analyses your data against 100,000+ real UK cases.
              </p>

              <ul className="mt-8 space-y-3">
                {mainFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-ds-text-secondary">
                    <Check className="h-4 w-4 text-ds-feedback-success flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link to="/register" className="block mt-8">
                <Button variant="glow" size="lg" className="w-full">
                  Get Started Now
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="glass rounded-2xl p-8 h-full">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="h-5 w-5 text-ds-accent-secondary" />
                <span className="text-sm font-medium text-ds-accent-secondary">Recurring</span>
              </div>
              <h3 className="text-2xl font-bold text-ds-text-primary">Monthly Plan</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-ds-text-primary">£5</span>
                <span className="text-ds-text-muted">/month</span>
              </div>
              <p className="mt-3 text-sm text-ds-text-secondary">
                Ongoing access with 20 questions per month for continuous advice.
              </p>

              <ul className="mt-8 space-y-3">
                {subscriptionFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-ds-text-secondary">
                    <Check className="h-4 w-4 text-ds-accent-secondary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link to="/register" className="block mt-8">
                <Button variant="secondary" size="lg" className="w-full">
                  Subscribe Monthly
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
