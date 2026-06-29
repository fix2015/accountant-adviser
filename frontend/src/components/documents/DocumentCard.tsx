import { motion } from "framer-motion";
import { FileText, Trash2, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatFileSize, formatRelative } from "@/utils/format";
import type { Document } from "@/types";

interface DocumentCardProps {
  document: Document;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string; animate?: boolean }> = {
  processed: { icon: CheckCircle, color: "text-ds-feedback-success", label: "Processed" },
  processing: { icon: Loader2, color: "text-ds-feedback-warning", label: "Processing", animate: true },
  error: { icon: AlertCircle, color: "text-ds-feedback-error", label: "Error" },
};

const fileTypeIcons: Record<string, string> = {
  pdf: "bg-red-500/15 text-red-400",
  doc: "bg-blue-500/15 text-blue-400",
  docx: "bg-blue-500/15 text-blue-400",
  txt: "bg-gray-500/15 text-gray-400",
  csv: "bg-green-500/15 text-green-400",
  xlsx: "bg-green-500/15 text-green-400",
  xls: "bg-green-500/15 text-green-400",
};

export function DocumentCard({ document, onDelete, isDeleting }: DocumentCardProps) {
  const ext = document.filename.split(".").pop()?.toLowerCase() || "";
  const status = statusConfig[document.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-4 rounded-xl border border-ds-border-default bg-ds-bg-tertiary p-4 hover:border-ds-border-strong transition-colors group"
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0", fileTypeIcons[ext] || "bg-ds-bg-surface text-ds-text-muted")}>
        <FileText className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ds-text-primary truncate">{document.filename}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-ds-text-muted">{formatFileSize(document.file_size)}</span>
          <span className="text-xs text-ds-text-muted">{formatRelative(document.uploaded_at)}</span>
          <span className={cn("flex items-center gap-1 text-xs", status.color)}>
            <StatusIcon className={cn("h-3 w-3", status.animate && "animate-spin")} />
            {status.label}
          </span>
        </div>
      </div>

      <button
        onClick={() => onDelete(document.id)}
        disabled={isDeleting}
        className="opacity-0 group-hover:opacity-100 rounded-lg p-2 text-ds-text-muted hover:text-ds-feedback-error hover:bg-ds-feedback-error/10 transition-all"
        title="Delete document"
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </motion.div>
  );
}
