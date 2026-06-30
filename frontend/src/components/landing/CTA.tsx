import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CTA() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-cyan-100/40 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ds-accent-primary/20 bg-ds-accent-primary/5 px-4 py-1.5 text-sm font-medium text-ds-text-accent">
            <Brain className="h-4 w-4" />
            Trained on 100,000+ UK Cases
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ds-text-primary">
            Stop Overpaying{" "}
            <span className="text-gradient">Your Accountant</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ds-text-secondary leading-relaxed">
            Our AI has analysed more UK tax cases than any single accountant could see in a lifetime.
            Get the same quality advice for <strong className="text-ds-text-primary">97% less</strong>. Start today for just £10.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button variant="glow" size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Get Your Tax Strategy — £10
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-ds-text-muted">
            <Shield className="h-4 w-4" />
            Secure payment via Stripe. Your data is encrypted and stored safely.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
