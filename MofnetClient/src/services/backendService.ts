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
  sources: BackendSource[];
}

const REQUEST_TIMEOUT_MS = 60000;

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

async function postJson<T>(
  url: string,
  body: unknown,
): Promise<T | null> {
  try {
    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
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
  const online = await getJson<{ status?: string }>(`${getApiBaseUrl()}/health`);
  if (online?.status === "healthy") return true;

  const offline = await getJson<{ status?: string }>(`${getFallbackApiUrl()}/health`);
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

  const online = await postJson<AskResponse>(`${getApiBaseUrl()}/ask`, body);
  if (online) {
    const { source, confidence } = mapSource(online.sources ?? []);
    return { content: online.answer, source, confidence };
  }

  const offline = await postJson<AskResponse>(`${getFallbackApiUrl()}/ask`, body);
  if (offline) {
    const { source, confidence } = mapSource(offline.sources ?? []);
    return { content: offline.answer, source, confidence };
  }

  return null;
}
