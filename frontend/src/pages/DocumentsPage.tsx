import { FileUpload } from "@/components/documents/FileUpload";
import { DocumentList } from "@/components/documents/DocumentList";
import { useDocuments } from "@/hooks/useDocuments";
import { useToast } from "@/components/ui/Toast";

export function DocumentsPage() {
  const { documents, isLoading, upload, isUploading, remove, isDeleting } = useDocuments();
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    try {
      await upload(file);
      toast("success", `${file.name} uploaded successfully`);
    } catch {
      toast("error", `Failed to upload ${file.name}`);
    }
  };

  const handleDelete = async (id: string) => {
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
    </div>
  );
}
