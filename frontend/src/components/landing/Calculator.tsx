import { useState, useMemo, useEffect, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Calculator as CalcIcon, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPounds } from "@/utils/format";

// ---------------------------------------------------------------------------
// UK 2025/26 tax calculation helpers
// ---------------------------------------------------------------------------

interface TaxBreakdown {
  incomeTax: number;
  nationalInsurance: number;
  corporationTax: number;
  totalTax: number;
  takeHome: number;
}

function calcSoleTrader(revenue: number, expenses: number): TaxBreakdown {
  const profit = Math.max(revenue - expenses, 0);

  // Income tax
  const personalAllowance = 12_570;
  const basicLimit = 50_270;
  const higherLimit = 125_140;

  let incomeTax = 0;
  if (profit > personalAllowance) {
    const basicBand = Math.min(profit, basicLimit) - personalAllowance;
    incomeTax += Math.max(basicBand, 0) * 0.2;
  }
  if (profit > basicLimit) {
    const higherBand = Math.min(profit, higherLimit) - basicLimit;
    incomeTax += Math.max(higherBand, 0) * 0.4;
  }
  if (profit > higherLimit) {
    incomeTax += (profit - higherLimit) * 0.45;
  }

  // NICs
  let nic = 0;
  if (profit > personalAllowance) {
    // Class 2
    nic += 179.4;
    // Class 4: 6% on 12,570-50,270
    const class4Basic = Math.min(profit, basicLimit) - personalAllowance;
    nic += Math.max(class4Basic, 0) * 0.06;
    // Class 4: 2% above 50,270
    if (profit > basicLimit) {
      nic += (profit - basicLimit) * 0.02;
    }
  }

  const totalTax = incomeTax + nic;
  return {
    incomeTax,
    nationalInsurance: nic,
    corporationTax: 0,
    totalTax,
    takeHome: profit - totalTax,
  };
}

function calcLimitedCompany(revenue: number, expenses: number): TaxBreakdown {
  const grossProfit = Math.max(revenue - expenses, 0);

  // Optimal salary at personal allowance
  const salary = 12_570;
  // Employer NIC: 15% above secondary threshold (£9,100)
  const employerNIC = Math.max(salary - 9_100, 0) * 0.15;

  const profitAfterSalary = Math.max(grossProfit - salary - employerNIC, 0);

  // Corporation tax
  let corpTaxRate: number;
  if (profitAfterSalary <= 50_000) {
    corpTaxRate = 0.19;
  } else if (profitAfterSalary >= 250_000) {
    corpTaxRate = 0.25;
  } else {
    // Marginal relief band
    corpTaxRate = 0.19 + ((profitAfterSalary - 50_000) / 200_000) * 0.06;
  }
  const corpTax = profitAfterSalary * corpTaxRate;

  const profitAfterCorpTax = profitAfterSalary - corpTax;

  // Dividends (all profit after corp tax, minus salary already paid)
  const dividends = Math.max(profitAfterCorpTax, 0);

  // Dividend tax
  const dividendAllowance = 500;
  const taxableDividends = Math.max(dividends - dividendAllowance, 0);

  // The director already used personal allowance on salary
  // Basic rate band remaining: 50,270 - 12,570 = 37,700
  const basicBandRemaining = 37_700;

  let dividendTax = 0;
  if (taxableDividends > 0) {
    const basicDividends = Math.min(taxableDividends, basicBandRemaining);
    dividendTax += basicDividends * 0.0875;
    if (taxableDividends > basicBandRemaining) {
      dividendTax += (taxableDividends - basicBandRemaining) * 0.3375;
    }
  }

  const totalTax = corpTax + dividendTax + employerNIC;
  const takeHome = salary + dividends - dividendTax;

  return {
    incomeTax: dividendTax,
    nationalInsurance: employerNIC,
    corporationTax: corpTax,
    totalTax,
    takeHome,
  };
}

// ---------------------------------------------------------------------------
// Animated number component
// ---------------------------------------------------------------------------

function AnimatedPounds({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const controls = animate(prevValue.current, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate(v) {
        node.textContent = formatPounds(v);
      },
    });

    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  return <span ref={ref} className={className}>{formatPounds(value)}</span>;
}

// ---------------------------------------------------------------------------
// Calculator component
// ---------------------------------------------------------------------------

type BusinessType = "sole-trader" | "limited-company";

export function Calculator() {
  const [revenue, setRevenue] = useState(50_000);
  const [expenses, setExpenses] = useState(15_000);
  const [businessType, setBusinessType] = useState<BusinessType>("sole-trader");

  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  // Clamp expenses to never exceed revenue
  const clampedExpenses = Math.min(expenses, revenue);

  const sole = useMemo(() => calcSoleTrader(revenue, clampedExpenses), [revenue, clampedExpenses]);
  const ltd = useMemo(() => calcLimitedCompany(revenue, clampedExpenses), [revenue, clampedExpenses]);

  const savings = Math.abs(sole.totalTax - ltd.totalTax);
  const bestOption: BusinessType = sole.totalTax > ltd.totalTax ? "limited-company" : "sole-trader";

  // When revenue changes, ensure expenses don't exceed it
  useEffect(() => {
    if (expenses > revenue) setExpenses(revenue);
  }, [revenue, expenses]);

  return (
    <section ref={sectionRef} id="calculator" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-ds-text-primary">
            Calculate Your{" "}
            <span className="text-gradient">Tax Savings</span>
          </h2>
          <p className="mt-4 text-lg text-ds-text-secondary max-w-2xl mx-auto">
            See how much you could save with the right business structure. Adjust the
            sliders and compare instantly.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="glass-strong rounded-2xl p-6 sm:p-10 bg-glow"
        >
          {/* ---------- Inputs ---------- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Revenue */}
            <div>
              <label className="block text-sm font-medium text-ds-text-secondary mb-2">
                Annual Revenue
              </label>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-ds-text-primary">
                  {formatPounds(revenue)}
                </span>
              </div>
              <input
                type="range"
                min={10_000}
                max={500_000}
                step={1_000}
                value={revenue}
                onChange={(e) => setRevenue(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-ds-bg-surface accent-[var(--ds-accent-primary)]"
              />
              <div className="flex justify-between text-xs text-ds-text-muted mt-1">
                <span>£10,000</span>
                <span>£500,000</span>
              </div>
            </div>

            {/* Expenses */}
            <div>
              <label className="block text-sm font-medium text-ds-text-secondary mb-2">
                Annual Expenses
              </label>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-ds-text-primary">
                  {formatPounds(clampedExpenses)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={revenue}
                step={1_000}
                value={clampedExpenses}
                onChange={(e) => setExpenses(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-ds-bg-surface accent-[var(--ds-accent-primary)]"
              />
              <div className="flex justify-between text-xs text-ds-text-muted mt-1">
                <span>£0</span>
                <span>{formatPounds(revenue)}</span>
              </div>
            </div>

            {/* Business type toggle */}
            <div>
              <label className="block text-sm font-medium text-ds-text-secondary mb-2">
                Currently Operating As
              </label>
              <div className="flex rounded-xl overflow-hidden border border-ds-border-default mt-1">
                <button
                  onClick={() => setBusinessType("sole-trader")}
                  className={`flex-1 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
                    businessType === "sole-trader"
                      ? "bg-gradient-to-r from-ds-accent-primary to-ds-accent-secondary text-white"
                      : "bg-ds-bg-surface text-ds-text-secondary hover:text-ds-text-primary"
                  }`}
                >
                  Sole Trader
                </button>
                <button
                  onClick={() => setBusinessType("limited-company")}
                  className={`flex-1 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
                    businessType === "limited-company"
                      ? "bg-gradient-to-r from-ds-accent-primary to-ds-accent-secondary text-white"
                      : "bg-ds-bg-surface text-ds-text-secondary hover:text-ds-text-primary"
                  }`}
                >
                  Limited Company
                </button>
              </div>
              <p className="text-xs text-ds-text-muted mt-2">
                We will show you which is better
              </p>
            </div>
          </div>

          {/* ---------- Savings headline ---------- */}
          {savings > 0 && (
            <motion.div
              key={`${revenue}-${clampedExpenses}`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center mb-10"
            >
              <div className="inline-flex items-center gap-3 glass rounded-2xl px-8 py-5 border-glow">
                <TrendingDown className="h-7 w-7 text-ds-feedback-success" />
                <div className="text-left">
                  <p className="text-sm text-ds-text-secondary">You could save approximately</p>
                  <p className="text-3xl sm:text-4xl font-bold text-ds-feedback-success">
                    ~<AnimatedPounds value={savings} />/year
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------- Comparison table ---------- */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ds-border-default">
                  <th className="py-3 pr-4 text-sm font-medium text-ds-text-muted" />
                  <th className="py-3 px-4 text-sm font-medium text-ds-text-secondary text-right">
                    Sole Trader
                    {bestOption === "sole-trader" && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-ds-feedback-success/10 border border-ds-feedback-success/30 px-2 py-0.5 text-xs text-ds-feedback-success">
                        Best
                      </span>
                    )}
                  </th>
                  <th className="py-3 pl-4 text-sm font-medium text-ds-text-secondary text-right">
                    Limited Company
                    {bestOption === "limited-company" && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-ds-feedback-success/10 border border-ds-feedback-success/30 px-2 py-0.5 text-xs text-ds-feedback-success">
                        Best
                      </span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <Row label="Income Tax" sole={sole.incomeTax} ltd={ltd.incomeTax} />
                <Row label="National Insurance" sole={sole.nationalInsurance} ltd={ltd.nationalInsurance} />
                <Row label="Corporation Tax" sole={sole.corporationTax} ltd={ltd.corporationTax} isCorp />
                <tr className="border-t border-ds-border-strong">
                  <td className="py-3 pr-4 font-semibold text-ds-text-primary">Total Tax</td>
                  <td className="py-3 px-4 font-semibold text-ds-text-primary text-right">
                    <AnimatedPounds value={sole.totalTax} />
                  </td>
                  <td className="py-3 pl-4 font-semibold text-ds-text-primary text-right">
                    <AnimatedPounds value={ltd.totalTax} />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-ds-feedback-success">Take Home</td>
                  <td className="py-3 px-4 font-semibold text-ds-feedback-success text-right">
                    <AnimatedPounds value={sole.takeHome} />
                  </td>
                  <td className="py-3 pl-4 font-semibold text-ds-feedback-success text-right">
                    <AnimatedPounds value={ltd.takeHome} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ---------- Best option badge + CTA ---------- */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CalcIcon className="h-5 w-5 text-ds-text-accent" />
              <span className="text-sm text-ds-text-secondary">
                Best option for you:{" "}
                <span className="font-semibold text-ds-text-primary">
                  {bestOption === "limited-company" ? "Limited Company" : "Sole Trader"}
                </span>
              </span>
            </div>
            <Link to="/register">
              <Button variant="glow" size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Get Your Full Strategy for £10
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-ds-text-muted text-center">
            Estimates based on UK 2025/26 tax rates. For illustrative purposes only — your full AI
            consultation provides a personalised strategy.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Table row helper
// ---------------------------------------------------------------------------

function Row({
  label,
  sole,
  ltd,
  isCorp,
}: {
  label: string;
  sole: number;
  ltd: number;
  isCorp?: boolean;
}) {
  return (
    <tr className="border-b border-ds-border-default/50">
      <td className="py-3 pr-4 text-ds-text-secondary">{label}</td>
      <td className="py-3 px-4 text-ds-text-primary text-right">
        {isCorp && sole === 0 ? (
          <span className="text-ds-text-muted">-</span>
        ) : (
          <AnimatedPounds value={sole} />
        )}
      </td>
      <td className="py-3 pl-4 text-ds-text-primary text-right">
        <AnimatedPounds value={ltd} />
      </td>
    </tr>
  );
}
