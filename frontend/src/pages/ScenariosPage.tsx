import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Lightbulb, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { calculateScenario } from "@/api/chat";
import type { ScenarioRequest, ScenarioResponse } from "@/types";

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1000,
  prefix = "\u00a3",
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ds-text-primary">{label}</label>
        <div className="flex items-center gap-1">
          {prefix && <span className="text-xs text-ds-text-muted">{prefix}</span>}
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const v = parseInt(e.target.value) || 0;
              onChange(Math.max(min, Math.min(max, v)));
            }}
            className="w-24 rounded-lg border border-ds-border-default bg-ds-bg-secondary px-2 py-1 text-right text-sm text-ds-text-primary focus:border-ds-accent-primary focus:outline-none"
          />
          {suffix && <span className="text-xs text-ds-text-muted">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-[var(--ds-accent-primary)] h-1.5 rounded-full appearance-none bg-ds-bg-surface cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--ds-accent-primary)]"
      />
      <div className="flex justify-between text-[10px] text-ds-text-muted">
        <span>{prefix}{min.toLocaleString()}{suffix}</span>
        <span>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );
}

function TaxBar({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const pct = total > 0 ? Math.max(1, (amount / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ds-text-secondary">{label}</span>
        <span className="font-medium text-ds-text-primary">{"\u00a3"}{amount.toLocaleString()}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-ds-bg-surface overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function ScenariosPage() {
  const [scenario, setScenario] = useState<ScenarioRequest>({
    revenue: 50000,
    expenses: 15000,
    employees: 0,
    salary: 12570,
    dividends: 0,
    pension_contribution: 0,
  });

  const [result, setResult] = useState<ScenarioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await calculateScenario(scenario);
      setResult(res);
    } catch {
      setError("Failed to calculate scenario. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const update = (key: keyof ScenarioRequest) => (value: number) => {
    setScenario((prev) => ({ ...prev, [key]: value }));
  };

  const maxTaxComponent = result
    ? Math.max(result.income_tax, result.national_insurance, result.corporation_tax, result.dividend_tax, 1)
    : 1;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 h-full overflow-auto">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary flex items-center gap-2">
          <Calculator className="h-6 w-6 text-ds-text-accent" />
          What If Scenario Calculator
        </h1>
        <p className="text-sm text-ds-text-secondary mt-1">
          Adjust the sliders to model different business scenarios and see your estimated tax position for UK 2025/26.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card variant="glass">
          <h2 className="text-lg font-semibold text-ds-text-primary mb-6">Business Scenario</h2>
          <div className="space-y-6">
            <SliderInput
              label="Revenue"
              value={scenario.revenue}
              onChange={update("revenue")}
              min={0}
              max={500000}
              step={5000}
            />
            <SliderInput
              label="Expenses"
              value={scenario.expenses}
              onChange={update("expenses")}
              min={0}
              max={scenario.revenue}
              step={1000}
            />
            <SliderInput
              label="Employees"
              value={scenario.employees}
              onChange={update("employees")}
              min={0}
              max={50}
              step={1}
              prefix=""
            />
            <SliderInput
              label="Director Salary"
              value={scenario.salary}
              onChange={update("salary")}
              min={0}
              max={150000}
              step={1000}
            />
            <SliderInput
              label="Dividends"
              value={scenario.dividends}
              onChange={update("dividends")}
              min={0}
              max={200000}
              step={1000}
            />
            <SliderInput
              label="Pension Contribution"
              value={scenario.pension_contribution}
              onChange={update("pension_contribution")}
              min={0}
              max={60000}
              step={1000}
            />
          </div>

          <Button
            variant="glow"
            size="lg"
            className="w-full mt-8"
            onClick={handleCalculate}
            isLoading={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Calculating...
              </>
            ) : (
              "Calculate Tax Position"
            )}
          </Button>
        </Card>

        {/* Results Panel */}
        <div className="space-y-6">
          {error && (
            <Card>
              <p className="text-sm text-ds-feedback-error">{error}</p>
            </Card>
          )}

          {!result && !isLoading && !error && (
            <Card variant="glass" className="flex flex-col items-center justify-center min-h-[300px] text-center">
              <Calculator className="h-12 w-12 text-ds-text-muted mb-4" />
              <p className="text-sm text-ds-text-secondary">
                Adjust the sliders and click "Calculate" to see your estimated tax breakdown.
              </p>
            </Card>
          )}

          {isLoading && (
            <Card variant="glass" className="flex flex-col items-center justify-center min-h-[300px] text-center">
              <Loader2 className="h-10 w-10 text-ds-text-accent animate-spin mb-4" />
              <p className="text-sm text-ds-text-secondary">Calculating your tax position...</p>
            </Card>
          )}

          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="text-center">
                  <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-1">Total Tax</p>
                  <p className="text-3xl font-bold text-ds-feedback-error">
                    {"\u00a3"}{result.total_tax.toLocaleString()}
                  </p>
                </Card>
                <Card className="text-center">
                  <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-1">Take Home</p>
                  <p className="text-3xl font-bold text-ds-feedback-success">
                    {"\u00a3"}{result.take_home.toLocaleString()}
                  </p>
                </Card>
              </div>

              {/* Effective Rate */}
              <Card className="text-center">
                <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-1">Effective Tax Rate</p>
                <p className="text-4xl font-bold text-ds-text-accent">{result.effective_rate.toFixed(1)}%</p>
              </Card>

              {/* Tax Breakdown Bars */}
              <Card>
                <h3 className="text-sm font-semibold text-ds-text-primary mb-4">Tax Breakdown</h3>
                <div className="space-y-4">
                  <TaxBar label="Income Tax" amount={result.income_tax} total={maxTaxComponent} color="#3b82f6" />
                  <TaxBar label="National Insurance" amount={result.national_insurance} total={maxTaxComponent} color="#8b5cf6" />
                  <TaxBar label="Corporation Tax" amount={result.corporation_tax} total={maxTaxComponent} color="#f59e0b" />
                  <TaxBar label="Dividend Tax" amount={result.dividend_tax} total={maxTaxComponent} color="#10b981" />
                </div>
              </Card>

              {/* AI Suggestions */}
              {result.suggestions.length > 0 && (
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-4 w-4 text-ds-accent-secondary" />
                    <h3 className="text-sm font-semibold text-ds-text-primary">AI Suggestions</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ds-accent-secondary/15 text-[10px] font-bold text-ds-accent-secondary mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-ds-text-secondary leading-relaxed">{suggestion}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
