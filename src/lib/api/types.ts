// ── Video metadata ──

export type VideoProvider = "youtube" | "vimeo"

export interface VideoMetadata {
  provider: VideoProvider
  videoId: string
  thumbnailUrl?: string
  embedUrl: string
}

// ── Search API types ──

export interface SearchWebResult {
  url: string
  title: string
  description: string
  snippets: string[]
  thumbnail_url?: string
  page_age?: string
  contents?: { html?: string; markdown?: string }
  authors?: string[]
  favicon_url?: string
  // enriched client-side
  video?: VideoMetadata
}

export interface SearchNewsResult {
  title: string
  description: string
  url: string
  thumbnail_url?: string
  page_age?: string
  contents?: { html?: string; markdown?: string }
}

export interface SearchResponse {
  results: {
    web: SearchWebResult[]
    news?: SearchNewsResult[]
  }
  metadata: {
    search_uuid: string
    query: string
    latency: number
  }
}

// ── Agent API types ──

export interface AgentRunRequest {
  agent: "express" | "advanced" | string
  input: string
  stream: boolean
  tools?: AgentTool[]
  verbosity?: "medium" | "high"
  workflow_config?: { max_workflow_steps: number }
}

export type AgentTool =
  | { type: "web_search" }
  | { type: "compute" }
  | { type: "research"; search_effort?: "auto" | "low" | "medium" | "high"; report_verbosity?: "medium" | "high" }

export interface AgentOutputAnswer {
  type: "message.answer"
  text: string
}

export interface AgentOutputCitation {
  type: "web_search.results"
  content: Citation[]
}

export type AgentOutput = AgentOutputAnswer | AgentOutputCitation

export interface AgentRunResponse {
  agent: string
  input: { role: string; content: string }[]
  output: AgentOutput[]
}

// ── Agent SSE event types ──

export interface AgentEventCreated {
  type: "response.created"
  seq_id: number
}

export interface AgentEventStarting {
  type: "response.starting"
  seq_id: number
}

export interface AgentEventOutputAdded {
  type: "response.output_item.added"
  seq_id: number
  response: { output_index: number; type: string }
}

export interface AgentEventTextDelta {
  type: "response.output_text.delta"
  seq_id: number
  response: {
    output_index: number
    type: string
    delta: string
  }
}

export interface AgentEventOutputDone {
  type: "response.output_item.done"
  seq_id: number
  response: {
    output_index: number
    type: string
    text?: string
    content?: Citation[]
  }
}

export interface AgentEventDone {
  type: "response.done"
  seq_id: number
  response: {
    run_time_ms: number
    finished: boolean
  }
}

export type AgentEvent =
  | AgentEventCreated
  | AgentEventStarting
  | AgentEventOutputAdded
  | AgentEventTextDelta
  | AgentEventOutputDone
  | AgentEventDone

// ── Citations ──

export interface Citation {
  source_type: string
  citation_uri: string
  title: string
  snippet: string
  url: string
  thumbnail_url?: string
}

// ── Contents API types ──

export interface ContentRequest {
  urls: string[]
  formats?: ("html" | "markdown" | "metadata")[]
  crawl_timeout?: number
}

export interface ContentResponse {
  url: string
  title: string
  html?: string | null
  markdown?: string | null
  metadata?: {
    site_name?: string | null
    favicon_url?: string
  }
}

// ── App-level types (study flow) ──

export interface Resource {
  title: string
  url: string
  snippet: string
  thumbnailUrl?: string
  video?: VideoMetadata
}

export interface Section {
  id: string
  title: string
  content: string
  resources: Resource[]
  isExpanded: boolean
}

export interface LearningPath {
  topic: string
  summary: string
  sections: Section[]
}

export type AgentStepStatus = "pending" | "running" | "complete" | "error"

export interface AgentStep {
  stepNumber: number
  label: string
  detail?: string
  status: AgentStepStatus
}

export interface AgentResponse {
  id: string
  query: string
  answer: string
  citations: Citation[]
  createdAt: number
}

export interface SourceView {
  citation: Citation
  content: string | null
}

export interface StudySession {
  id: string
  topic: string
  learningPath: LearningPath | null
  responses: AgentResponse[]
  createdAt: number
  lastAccessed: number
}
