import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

const BEFORE_DATA = {
  income_tax: 7486,
  national_insurance: 4534,
  corporation_tax: 5750,
  dividend_tax: 1312,
  total: 19082,
  effective_rate: 38.2,
};

const AFTER_DATA = {
  income_tax: 0,
  national_insurance: 479,
  corporation_tax: 4636,
  dividend_tax: 2494,
  total: 7609,
  effective_rate: 15.2,
};

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

const TAX_LABELS = ["Income Tax", "NIC", "Corp Tax", "Dividend Tax"];

function toPieData(data: typeof BEFORE_DATA) {
  return [
    { name: "Income Tax", value: data.income_tax },
    { name: "NIC", value: data.national_insurance },
    { name: "Corp Tax", value: data.corporation_tax },
    { name: "Dividend Tax", value: data.dividend_tax },
  ].filter((d) => d.value > 0);
}

const barData = TAX_LABELS.map((label, i) => {
  const keys = ["income_tax", "national_insurance", "corporation_tax", "dividend_tax"] as const;
  return {
    name: label,
    Before: BEFORE_DATA[keys[i]],
    After: AFTER_DATA[keys[i]],
  };
});

const savings = BEFORE_DATA.total - AFTER_DATA.total;

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-ds-border-default bg-ds-bg-secondary px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-ds-text-primary mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-ds-text-secondary">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: {"\u00a3"}{entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export function TaxComparison() {
  const beforePie = toPieData(BEFORE_DATA);
  const afterPie = toPieData(AFTER_DATA);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card variant="glass" className="p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-ds-border-default">
          <TrendingDown className="h-4 w-4 text-ds-feedback-success" />
          <h2 className="text-sm font-semibold text-ds-text-primary">Tax Optimisation Impact</h2>
        </div>

        <div className="p-6 space-y-8">
          {/* Key Savings Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-ds-feedback-success/20 bg-ds-feedback-success/5 p-4 text-center">
              <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-1">Estimated Annual Savings</p>
              <p className="text-3xl font-bold text-ds-feedback-success">
                {"\u00a3"}{savings.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-ds-accent-primary/20 bg-ds-accent-primary/5 p-4 text-center">
              <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-1">Effective Tax Rate</p>
              <p className="text-2xl font-bold text-ds-text-primary">
                {BEFORE_DATA.effective_rate}%
                <ArrowRight className="inline h-5 w-5 mx-2 text-ds-text-muted" />
                <span className="text-ds-feedback-success">{AFTER_DATA.effective_rate}%</span>
              </p>
            </div>
          </div>

          {/* Pie Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-ds-text-secondary text-center mb-2">Before Optimisation</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={beforePie}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {beforePie.map((_entry, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<CustomTooltip />}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-sm font-semibold text-ds-text-primary">
                {"\u00a3"}{BEFORE_DATA.total.toLocaleString()} total tax
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-ds-text-secondary text-center mb-2">After AI Advice</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={afterPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {afterPie.map((_entry, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<CustomTooltip />}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-sm font-semibold text-ds-feedback-success">
                {"\u00a3"}{AFTER_DATA.total.toLocaleString()} total tax
              </p>
            </div>
          </div>

          {/* Bar Chart Comparison */}
          <div>
            <p className="text-xs font-medium text-ds-text-secondary text-center mb-4">Tax Category Comparison</p>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={4}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--ds-text-muted)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--ds-border-default)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--ds-text-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `\u00a3${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: "var(--ds-text-secondary)" }}
                  />
                  <Bar dataKey="Before" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="After" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
