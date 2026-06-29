import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { getPlanner } from "@/api/chat";
import type { PlannerMonth, PlannerAction } from "@/types";

const priorityConfig = {
  high: {
    color: "bg-ds-feedback-error/15 text-ds-feedback-error border-ds-feedback-error/30",
    icon: AlertTriangle,
    label: "High",
  },
  medium: {
    color: "bg-ds-feedback-warning/15 text-ds-feedback-warning border-ds-feedback-warning/30",
    icon: Clock,
    label: "Medium",
  },
  low: {
    color: "bg-ds-feedback-success/15 text-ds-feedback-success border-ds-feedback-success/30",
    icon: CheckCircle2,
    label: "Low",
  },
};

function ActionCard({ action, index }: { action: PlannerAction; index: number }) {
  const config = priorityConfig[action.priority] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:border-ds-border-strong transition-colors">
        <div className="flex items-start gap-3">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.priority === "high" ? "bg-ds-feedback-error/10" : action.priority === "low" ? "bg-ds-feedback-success/10" : "bg-ds-feedback-warning/10"}`}>
            <Icon className={`h-4 w-4 ${action.priority === "high" ? "text-ds-feedback-error" : action.priority === "low" ? "text-ds-feedback-success" : "text-ds-feedback-warning"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-ds-text-primary truncate">
                {action.title}
              </h4>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${config.color}`}>
                {config.label}
              </span>
            </div>
            <p className="text-xs text-ds-text-secondary leading-relaxed">
              {action.description}
            </p>
            {action.deadline && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-ds-text-muted">
                <Calendar className="h-3 w-3" />
                <span>Deadline: {action.deadline}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function PlannerPage() {
  const [months, setMonths] = useState<PlannerMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPlanner();
        setMonths(data.months);
      } catch (err: any) {
        setError(
          err?.response?.data?.detail || "Failed to generate tax planner"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-ds-text-secondary animate-pulse">
          Generating your personalised tax plan...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md text-center">
          <Info className="h-10 w-10 text-ds-text-accent mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-ds-text-primary mb-2">
            Upload documents for a personalised plan
          </h2>
          <p className="text-sm text-ds-text-secondary">
            {error}
          </p>
        </Card>
      </div>
    );
  }

  if (months.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md text-center">
          <Calendar className="h-10 w-10 text-ds-text-accent mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-ds-text-primary mb-2">
            Upload documents for a personalised plan
          </h2>
          <p className="text-sm text-ds-text-secondary">
            Once you upload your financial documents, we will generate a
            month-by-month tax action plan tailored to your business.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20">
              <Calendar className="h-5 w-5 text-ds-text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ds-text-primary">
                Tax Year Planner
              </h1>
              <p className="text-sm text-ds-text-secondary">
                Your personalised 12-month tax action plan
              </p>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-ds-border-default" />

          <div className="space-y-8">
            {months.map((month, monthIndex) => (
              <motion.div
                key={month.month}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: monthIndex * 0.08 }}
                className="relative pl-12"
              >
                {/* Timeline dot */}
                <div className="absolute left-2 top-1 w-4 h-4 rounded-full bg-ds-accent-primary/20 border-2 border-ds-accent-primary" />

                {/* Month heading */}
                <h3 className="text-base font-semibold text-ds-text-primary mb-3">
                  {month.month}
                </h3>

                {/* Action cards */}
                <div className="space-y-3">
                  {month.actions.map((action, actionIndex) => (
                    <ActionCard
                      key={`${month.month}-${actionIndex}`}
                      action={action}
                      index={actionIndex}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
