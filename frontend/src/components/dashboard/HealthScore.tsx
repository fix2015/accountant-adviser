import { useState, useEffect, useCallback } from "react";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw, TrendingUp, ShieldCheck, Receipt, Lightbulb } from "lucide-react";
import { cn } from "@/utils/cn";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getHealthScore } from "@/api/chat";
import type { HealthScoreResponse } from "@/types";

function getScoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "Looking Good";
  if (score >= 40) return "Room to Improve";
  return "Needs Attention";
}

function getScoreGradient(score: number): [string, string] {
  if (score >= 70) return ["#22c55e", "#10b981"];
  if (score >= 40) return ["#f59e0b", "#d97706"];
  return ["#ef4444", "#dc2626"];
}

function getScoreBgClass(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

/** Animated number counter */
function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration,
      ease: "easeOut",
    });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, duration, motionVal, rounded]);

  return <>{display}</>;
}

/** SVG circular gauge */
function CircularGauge({ score }: { score: number }) {
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [gradient1, gradient2] = getScoreGradient(score);
  const gradientId = "health-gauge-gradient";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient1} />
            <stop offset="100%" stopColor={gradient2} />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-white/5"
          strokeWidth={strokeWidth}
        />
        {/* Animated progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-ds-text-primary leading-none">
          <AnimatedNumber value={score} duration={1.4} />
        </span>
        <span className={cn("text-xs font-semibold mt-1.5", getScoreBgClass(score))}>
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

/** Horizontal metric bar */
function MetricBar({
  label,
  value,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  delay?: number;
}) {
  const color = getScoreColor(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-ds-text-muted" />
          <span className="text-xs font-medium text-ds-text-secondary">{label}</span>
        </div>
        <span className="text-xs font-bold text-ds-text-primary">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut", delay }}
        />
      </div>
    </div>
  );
}

/** Skeleton placeholder during loading */
function HealthScoreSkeleton() {
  return (
    <Card variant="glass" className="relative overflow-hidden">
      <div className="animate-pulse space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 rounded bg-white/5" />
          <div className="h-8 w-28 rounded-lg bg-white/5" />
        </div>

        {/* Gauge placeholder */}
        <div className="flex justify-center">
          <div className="h-[180px] w-[180px] rounded-full border-[12px] border-white/5" />
        </div>

        {/* Bars */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-28 rounded bg-white/5" />
                <div className="h-3 w-8 rounded bg-white/5" />
              </div>
              <div className="h-2 w-full rounded-full bg-white/5" />
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 rounded bg-white/5" style={{ width: `${90 - i * 10}%` }} />
          ))}
        </div>
      </div>

      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
    </Card>
  );
}

export function HealthScore() {
  const [data, setData] = useState<HealthScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await getHealthScore();
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load health score";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  if (loading) return <HealthScoreSkeleton />;

  if (error) {
    return (
      <Card className="text-center py-8">
        <p className="text-sm text-ds-text-secondary mb-3">Could not load health score</p>
        <Button variant="ghost" size="sm" onClick={() => fetchScore()}>
          Try Again
        </Button>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card variant="glass" className="relative overflow-hidden">
        {/* Subtle gradient background glow */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${getScoreColor(data.overall)}, transparent)` }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-ds-text-primary">Business Health Score</h3>
            <p className="text-[11px] text-ds-text-muted mt-0.5">AI-powered financial analysis</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchScore(true)}
            disabled={refreshing}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Main content: gauge + metrics */}
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Circular gauge */}
          <div className="shrink-0">
            <CircularGauge score={data.overall} />
          </div>

          {/* Metric bars */}
          <div className="flex-1 w-full space-y-5">
            <MetricBar label="Tax Efficiency" value={data.tax_efficiency} icon={TrendingUp} delay={0.2} />
            <MetricBar label="Expense Optimization" value={data.expense_optimization} icon={Receipt} delay={0.4} />
            <MetricBar label="Compliance Risk" value={data.compliance_risk} icon={ShieldCheck} delay={0.6} />
          </div>
        </div>

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="mt-6 pt-5 border-t border-ds-border-default">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-3.5 w-3.5 text-ds-accent-secondary" />
              <span className="text-xs font-semibold text-ds-text-secondary uppercase tracking-wider">
                AI Recommendations
              </span>
            </div>
            <ul className="space-y-2">
              {data.recommendations.map((rec, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.15 }}
                  className="flex items-start gap-2.5 text-xs text-ds-text-secondary leading-relaxed"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ds-accent-primary/10 text-[10px] font-bold text-ds-text-accent">
                    {i + 1}
                  </span>
                  {rec}
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
