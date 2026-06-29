import { useState } from "react";
import { FileUpload } from "@/components/documents/FileUpload";
import { DocumentList } from "@/components/documents/DocumentList";
import { useDocuments } from "@/hooks/useDocuments";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createCheckout } from "@/api/payments";
import { Sparkles, Zap, FileText, MessageSquare, Download } from "lucide-react";

export function DocumentsPage() {
  const { documents, isLoading, upload, isUploading, remove, isDeleting } = useDocuments();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const url = await createCheckout("consultation");
      window.location.href = url;
    } catch {
      toast("error", "Failed to start checkout. Please try again.");
      setIsUpgrading(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      await upload(file);
      toast("success", `${file.name} uploaded successfully`);
    } catch (err: unknown) {
      // Check if it's a trial limit error (403)
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
        if (axiosErr.response?.status === 403) {
          setShowUpgradeModal(true);
          return;
        }
      }
      toast("error", `Failed to upload ${file.name}`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await remove(id);
      toast("success", "Document deleted");
    } catch {
      toast("error", "Failed to delete document");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 h-full overflow-auto">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">Documents</h1>
        <p className="text-sm text-ds-text-secondary mt-1">
          Upload your financial documents for AI analysis
        </p>
      </div>

      <FileUpload onUpload={handleUpload} isUploading={isUploading} />

      <div>
        <h2 className="text-lg font-semibold text-ds-text-primary mb-4">
          Uploaded Documents ({documents.length})
        </h2>
        <DocumentList
          documents={documents}
          isLoading={isLoading}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      </div>

      {/* Upgrade Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        size="md"
      >
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-6">
            <Sparkles className="h-8 w-8 text-ds-text-accent" />
          </div>

          <h2 className="text-xl font-bold text-ds-text-primary mb-2">
            Upgrade to Full Consultation
          </h2>
          <p className="text-sm text-ds-text-secondary mb-6 leading-relaxed">
            Your free trial includes 1 document upload. Upgrade to unlock
            unlimited document uploads and get the full power of your AI tax adviser.
          </p>

          <div className="rounded-xl border border-ds-border-default bg-ds-bg-secondary p-5 mb-6 text-left">
            <div className="flex items-baseline justify-between mb-4">
              <span className="text-sm font-medium text-ds-text-primary">Full Consultation</span>
              <div>
                <span className="text-2xl font-bold text-ds-text-primary">£10</span>
                <span className="text-xs text-ds-text-muted ml-1">one-time</span>
              </div>
            </div>
            <ul className="space-y-2.5">
              {[
                { icon: FileText, text: "Unlimited document uploads" },
                { icon: MessageSquare, text: "50 AI consultation questions" },
                { icon: Download, text: "Downloadable PDF strategy report" },
                { icon: Zap, text: "Full knowledge graph analysis" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-2.5 text-sm text-ds-text-secondary">
                  <item.icon className="h-4 w-4 text-ds-feedback-success shrink-0" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="lg"
              className="flex-1"
              onClick={() => setShowUpgradeModal(false)}
            >
              Maybe Later
            </Button>
            <Button
              variant="glow"
              size="lg"
              className="flex-1"
              onClick={handleUpgrade}
              isLoading={isUpgrading}
            >
              Upgrade for £10
            </Button>
          </div>

          <p className="mt-4 text-xs text-ds-text-muted">
            Secure payment via Stripe. Instant access after payment.
          </p>
        </div>
      </Modal>
    </div>
  );
}
