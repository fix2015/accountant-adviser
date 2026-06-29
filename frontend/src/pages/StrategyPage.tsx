import { StrategyDownload } from "@/components/strategy/StrategyDownload";

export function StrategyPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">Tax Strategy</h1>
        <p className="text-sm text-ds-text-secondary mt-1">
          View and download your personalised tax optimisation strategies
        </p>
      </div>

      <StrategyDownload />
    </div>
  );
}
