import client from "./client";
import type { ChatMessage, ChatSession, HealthScoreResponse } from "@/types";

export async function getChatSession(): Promise<ChatSession> {
  const response = await client.get<ChatSession>("/chat/session");
  return response.data;
}

export async function getChatSuggestions(): Promise<string[]> {
  const response = await client.get<{ suggestions: string[] }>("/chat/suggestions");
  return response.data.suggestions;
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  const response = await client.get<{ messages: ChatMessage[]; total: number }>("/chat/history/");
  return response.data.messages;
}

export async function sendMessage(content: string): Promise<ChatMessage> {
  const response = await client.post<ChatMessage>("/chat/send", { message: content });
  return response.data;
}

export async function getHealthScore(): Promise<HealthScoreResponse> {
  const response = await client.get("/chat/health-score");
  return response.data;
}

export function streamMessage(
  content: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): () => void {
  const token = localStorage.getItem("access_token");
  const controller = new AbortController();

  fetch("/api/v1/chat/send/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message: content }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        onError(errorData.detail || "Failed to send message");
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError("No response body");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onDone();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onDone();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch {
              onChunk(data);
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError(err.message || "Stream error");
      }
    });

  return () => controller.abort();
}
