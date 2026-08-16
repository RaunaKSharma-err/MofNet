import { getApiBaseUrl, getFallbackApiUrl } from "@/src/config/api";
import type { ChatSource, Language } from "@/src/types";

export { getApiBaseUrl, getFallbackApiUrl };

export interface AskRequest {
  question: string;
  grade?: number;
  subject?: string;
  language?: Language;
}

export interface BackendSource {
  title: string;
  chapter: string;
  subject: string;
  grade: number | null;
  score: number;
  text: string;
}

export interface AskResponse {
  answer: string;
  latency_ms: number;
  cached: boolean;
  sources: BackendSource[];
  mode?: string;
  model?: string;
  top_score?: number;
}

export interface StreamChunk {
  chunk: string;
  done: boolean;
  answer?: string;
  latency_ms?: number;
  error?: string;
  mode?: string;
  model?: string;
}

const REQUEST_TIMEOUT_MS = 120000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    console.log("================================");
    console.log("URL:", url);
    console.log("ERROR:", error);
    console.log("================================");
    return null;
  }
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetchWithTimeout(url, { method: "GET" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  const online = await getJson<{ status?: string }>(
    `${getApiBaseUrl()}/health`,
  );
  if (online?.status === "healthy") return true;

  const offline = await getJson<{ status?: string }>(
    `${getFallbackApiUrl()}/health`,
  );
  return offline?.status === "healthy";
}

function mapSource(sources: BackendSource[]): {
  source: ChatSource;
  confidence: number;
} {
  const top = sources[0];
  if (!top) {
    return {
      source: {
        grade: "General",
        subject: "Curriculum",
        chapter: "Knowledge Base",
        chapterNumber: 0,
      },
      confidence: 75,
    };
  }

  return {
    source: {
      grade: top.grade != null ? `Grade ${top.grade}` : "General",
      subject: top.subject || "General",
      chapter: top.chapter || top.title || "Curriculum",
      chapterNumber: 0,
    },
    confidence: Math.min(99, Math.round((top.score ?? 0.7) * 100)),
  };
}

export async function askBackend(
  request: AskRequest,
): Promise<{ content: string; source: ChatSource; confidence: number } | null> {
  const body = {
    question: request.question,
    grade: request.grade ?? null,
    subject: request.subject ?? null,
    language: request.language ?? "en",
  };

  const online = await postJson<AskResponse>(`${getApiBaseUrl()}/ask?stream=false`, body);
  if (online) {
    const { source, confidence } = mapSource(online.sources ?? []);
    return { content: online.answer, source, confidence };
  }

  const offline = await postJson<AskResponse>(
    `${getFallbackApiUrl()}/ask?stream=false`,
    body,
  );
  if (offline) {
    const { source, confidence } = mapSource(offline.sources ?? []);
    return { content: offline.answer, source, confidence };
  }

  return null;
}

export async function streamAskBackend(
  request: AskRequest,
  onChunk: (chunk: string) => void,
  onComplete?: (content: string, latencyMs: number) => void,
  onError?: (error: string) => void,
): Promise<string | null> {
  const body = {
    question: request.question,
    grade: request.grade ?? null,
    subject: request.subject ?? null,
    language: request.language ?? "en",
  };

  const urls = [getApiBaseUrl()];
  let lastError = "";

  for (const baseUrl of urls) {
    try {
      const url = `${baseUrl}/ask?stream=true`;
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        120000,
      );

      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        continue;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        lastError = "No readable stream";
        break;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const jsonStr = trimmed.slice(6);
            try {
              const parsed: StreamChunk = JSON.parse(jsonStr);
              if (parsed.error) {
                if (onError) onError(parsed.error);
                return null;
              }
              if (parsed.chunk) {
                fullContent += parsed.chunk;
                onChunk(parsed.chunk);
              }
              if (parsed.done) {
                if (onComplete) {
                  onComplete(parsed.answer ?? fullContent, parsed.latency_ms ?? 0);
                }
                return fullContent;
              }
            } catch {
              continue;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (fullContent) {
        return fullContent;
      }
      return null;
    } catch (err) {
      const msg = String(err);
      if (msg.includes("AbortError") || msg.includes("Aborted")) {
        lastError = msg;
        continue;
      }
      lastError = msg;
      continue;
    }
  }

  if (onError) {
    onError(lastError || "Stream request failed");
  }
  return null;
}
