import { useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, CheckCircle, Clock, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createReviewCheckout } from "@/api/payments";
import { useToast } from "@/components/ui/Toast";

export function AccountantReview() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBookReview = async () => {
    setIsLoading(true);
    try {
      const checkoutUrl = await createReviewCheckout();
      window.location.href = checkoutUrl;
    } catch {
      toast("error", "Failed to create checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Clock, text: "30-minute review by a qualified chartered accountant" },
    { icon: FileText, text: "Written feedback on your AI-generated strategies" },
    { icon: CheckCircle, text: "Implementation guidance with priority action items" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card variant="glow" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-ds-accent-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 shrink-0">
              <UserCheck className="h-7 w-7 text-amber-400" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-ds-text-primary">
                  Get a Professional Accountant Review
                </h2>
                <span className="text-xs font-medium text-amber-400 bg-amber-500/15 border border-amber-500/20 rounded-full px-2 py-0.5">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-ds-text-secondary leading-relaxed max-w-xl">
                Get a qualified chartered accountant to review your AI-generated tax strategy.
                They will verify calculations, flag any risks, and provide personalised implementation guidance.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 rounded-lg bg-ds-bg-surface/50 border border-ds-border-default p-3">
                <Icon className="h-4 w-4 text-ds-feedback-success shrink-0 mt-0.5" />
                <span className="text-xs text-ds-text-secondary leading-relaxed">{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-ds-text-primary">£50</span>
                <span className="text-sm text-ds-text-muted">one-time</span>
              </div>
              <p className="text-xs text-ds-text-muted mt-0.5">
                Includes full written report within 48 hours
              </p>
            </div>

            <Button
              variant="glow"
              size="lg"
              onClick={handleBookReview}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Book Professional Review
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-6 pt-4 border-t border-ds-border-default">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["bg-blue-500", "bg-green-500", "bg-purple-500"].map((bg, i) => (
                  <div key={i} className={`h-6 w-6 rounded-full ${bg} border-2 border-ds-bg-tertiary flex items-center justify-center`}>
                    <span className="text-[9px] font-bold text-white">{["JM", "AS", "KL"][i]}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-ds-text-muted italic">
                "The accountant spotted two deductions I had missed -- saved me over £3,000 in tax."
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
