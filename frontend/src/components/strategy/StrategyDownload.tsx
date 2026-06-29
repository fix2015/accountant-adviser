import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Download, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import client from "@/api/client";
import type { Strategy } from "@/types";

async function getStrategies(): Promise<Strategy[]> {
  const response = await client.get<Strategy[]>("/strategy");
  return response.data;
}

export function StrategyDownload() {
  const { data: strategies, isLoading } = useQuery({
    queryKey: ["strategies"],
    queryFn: getStrategies,
  });

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await client.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      // Toast error handling done elsewhere
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-ds-text-accent" />
      </div>
    );
  }

  if (!strategies || strategies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ds-bg-surface border border-ds-border-default mb-4">
          <FileDown className="h-7 w-7 text-ds-text-muted" />
        </div>
        <h3 className="text-lg font-medium text-ds-text-primary mb-1">No strategies yet</h3>
        <p className="text-sm text-ds-text-secondary max-w-sm">
          Upload your documents and chat with the AI to generate your personalised tax strategy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {strategies.map((strategy, i) => (
        <motion.div
          key={strategy.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-xl border border-ds-border-default bg-ds-bg-tertiary p-6 hover:border-ds-border-strong transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-ds-text-primary">{strategy.title}</h3>
              <p className="mt-2 text-sm text-ds-text-secondary leading-relaxed">{strategy.summary}</p>
              <p className="mt-3 text-xs text-ds-text-muted">
                Generated {new Date(strategy.created_at).toLocaleDateString("en-GB")}
              </p>
            </div>
            <Button
              variant="outline"
              size="md"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => handleDownload(strategy.download_url, `${strategy.title}.pdf`)}
            >
              Download PDF
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
