import client from "./client";
import type { Document } from "@/types";

export async function uploadDocument(file: File): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await client.post<Document>("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function getDocuments(): Promise<Document[]> {
  const response = await client.get<Document[]>("/documents");
  return response.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await client.delete(`/documents/${id}`);
}

export async function getDocumentSummary(id: string): Promise<{ summary: string }> {
  const response = await client.get(`/documents/${id}/summary`);
  return response.data;
}
