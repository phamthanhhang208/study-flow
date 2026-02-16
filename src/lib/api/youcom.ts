import type {
  SearchResponse,
  SearchWebResult,
  AgentRunRequest,
  AgentEvent,
  AgentRunResponse,
  AgentTool,
  ContentResponse,
} from "./types";
import {
  YouComApiError,
  YouComRateLimitError,
  YouComTimeoutError,
} from "./errors";
import { detectVideo } from "../utils/video";

const isDev = import.meta.env.DEV;
const SEARCH_BASE = isDev ? "/api/search" : "https://ydc-index.io/v1";
const AGENT_BASE = isDev ? "/api/agent" : "https://api.you.com/v1";

const DEFAULT_TIMEOUT = 30_000;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

interface FetchWithRetryOptions {
  url: string;
  init: RequestInit;
  endpoint: string;
  timeoutMs?: number;
}

async function fetchWithRetry({
  url,
  init,
  endpoint,
  timeoutMs = DEFAULT_TIMEOUT,
}: FetchWithRetryOptions): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const error = new YouComRateLimitError(
          endpoint,
          retryAfter ?? undefined,
        );
        if (attempt < MAX_RETRIES - 1) {
          await sleep(error.retryAfterMs);
          continue;
        }
        throw error;
      }

      if (response.status >= 500 && attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }

      if (!response.ok) {
        throw new YouComApiError(
          `${endpoint}: ${response.status} ${response.statusText}`,
          response.status,
          endpoint,
        );
      }

      return response;
    } catch (err) {
      if (err instanceof YouComApiError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new YouComTimeoutError(endpoint, timeoutMs);
      }
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error(`Failed after ${MAX_RETRIES} retries`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class YouComClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey ?? import.meta.env.VITE_YOUCOM_API_KEY;
    if (!key)
      throw new Error("You.com API key is required. Set VITE_YOUCOM_API_KEY.");
    this.apiKey = key;
  }

  // ── Search API ──

  async search(
    query: string,
    options?: { count?: number; country?: string },
  ): Promise<SearchResponse> {
    const params = new URLSearchParams({ query });
    if (options?.count) params.set("count", String(options.count));
    if (options?.country) params.set("country", options.country);

    const response = await fetchWithRetry({
      url: `${SEARCH_BASE}/search?${params}`,
      init: {
        headers: { "X-API-Key": this.apiKey },
      },
      endpoint: "search",
    });

    const data: SearchResponse = await response.json();

    // Enrich results with video metadata
    data.results.web = data.results.web.map(enrichWithVideo);

    return data;
  }

  // ── Agent API (non-streaming) ──

  async runAgent(
    input: string,
    agent: AgentRunRequest["agent"] = "express",
    tools?: AgentTool[],
  ): Promise<AgentRunResponse> {
    const body: AgentRunRequest = {
      agent,
      input,
      stream: false,
      ...(tools && { tools }),
    };

    const response = await fetchWithRetry({
      url: `${AGENT_BASE}/agents/runs`,
      init: {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      endpoint: "agent",
      timeoutMs: 60_000,
    });

    return response.json();
  }

  // ── Agent API (streaming via SSE) ──

  async *streamAgent(
    input: string,
    agent: AgentRunRequest["agent"] = "express",
    tools?: AgentTool[],
  ): AsyncGenerator<AgentEvent> {
    const body: AgentRunRequest = {
      agent,
      input,
      stream: true,
      ...(tools && { tools }),
    };

    const response = await fetchWithRetry({
      url: `${AGENT_BASE}/agents/runs`,
      init: {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      endpoint: "agent-stream",
      timeoutMs: 120_000,
    });

    if (!response.body) {
      throw new YouComApiError(
        "No response body for streaming",
        0,
        "agent-stream",
      );
    }

    yield* parseSSEStream(response.body);
  }

  // ── Contents API ──

  async getContent(
    urls: string[],
    formats: ("html" | "markdown" | "metadata")[] = ["markdown", "metadata"],
  ): Promise<ContentResponse[]> {
    const response = await fetchWithRetry({
      url: `${SEARCH_BASE}/contents`,
      init: {
        method: "POST",
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls, formats }),
      },
      endpoint: "contents",
    });

    return response.json();
  }
}

// ── SSE parser ──

async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<AgentEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") return;

        try {
          const event = JSON.parse(payload) as AgentEvent;
          yield event;
        } catch {
          // skip malformed JSON lines
        }
      }
    }

    // process any remaining buffer
    if (buffer.startsWith("data: ")) {
      const payload = buffer.slice(6).trim();
      if (payload && payload !== "[DONE]") {
        try {
          yield JSON.parse(payload) as AgentEvent;
        } catch {
          // skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ── Video enrichment ──

function enrichWithVideo(result: SearchWebResult): SearchWebResult {
  const video = detectVideo(result.url);
  if (video) {
    return { ...result, video };
  }
  return result;
}

// ── Client factory ──

let cachedClient: YouComClient | null = null;
let cachedKey: string = "";

export function getYouComClient(apiKey?: string): YouComClient {
  const effectiveKey = apiKey || import.meta.env.VITE_YOUCOM_API_KEY || "";

  if (!cachedClient || effectiveKey !== cachedKey) {
    cachedClient = new YouComClient(effectiveKey || undefined);
    cachedKey = effectiveKey;
  }
  return cachedClient;
}
