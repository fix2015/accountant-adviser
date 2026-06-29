import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, MessageSquare, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import client from "@/api/client";

export function StrategyDownload() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    try {
      const response = await client.post(
        "/chat/report",
        { title: `Tax Optimisation Strategy — ${user?.full_name || "Client"}` },
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Tax_Strategy_Report.pdf";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number; data?: Blob } };
        if (axiosErr.response?.status === 403) {
          setError("PDF reports are not available on the free trial. Upgrade to full consultation for £10.");
        } else {
          setError("Failed to generate report. Make sure you have chat history first.");
        }
      } else {
        setError("Failed to generate report.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-6">
            <FileText className="h-8 w-8 text-ds-text-accent" />
          </div>

          <h2 className="text-xl font-bold text-ds-text-primary mb-2">
            Generate Your Tax Strategy Report
          </h2>
          <p className="text-sm text-ds-text-secondary max-w-md mx-auto mb-6 leading-relaxed">
            Download a professional PDF report containing all tax optimisation strategies
            discussed in your consultation, your financial overview, and recommended actions.
          </p>

          {error && (
            <div className="mb-6 rounded-xl border border-ds-feedback-error/30 bg-ds-feedback-error/10 px-4 py-3 text-sm text-ds-feedback-error max-w-md mx-auto">
              {error}
            </div>
          )}

          <Button
            variant="glow"
            size="lg"
            leftIcon={<Download className="h-5 w-5" />}
            onClick={handleGenerate}
            isLoading={isGenerating}
          >
            {isGenerating ? "Generating PDF..." : "Download Strategy PDF"}
          </Button>

          <p className="mt-4 text-xs text-ds-text-muted">
            Report includes all AI advice from your chat sessions
          </p>
        </Card>
      </motion.div>

      {/* Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:border-ds-border-strong transition-colors">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-ds-feedback-success shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-ds-text-primary mb-1">Chat first for better reports</h3>
              <p className="text-xs text-ds-text-muted leading-relaxed">
                The more questions you ask in the AI chat, the more detailed and personalised your strategy report will be.
              </p>
              <Link to="/dashboard/chat" className="text-xs text-ds-text-accent hover:underline mt-2 inline-block">
                Go to Chat →
              </Link>
            </div>
          </div>
        </Card>
        <Card className="hover:border-ds-border-strong transition-colors">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-ds-text-accent shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-ds-text-primary mb-1">Share with your accountant</h3>
              <p className="text-xs text-ds-text-muted leading-relaxed">
                The PDF report is designed to be shared with a real chartered accountant who can verify and implement the strategies.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
