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

export interface ArticleResource {
  id: string
  url: string
  title: string
  description: string
  snippet: string
  domain: string
  favicon?: string
  publishedDate?: string
  estimatedReadMinutes?: number
}

export interface VideoResource {
  id: string
  url: string
  title: string
  description: string
  platform: "youtube" | "vimeo"
  videoId: string
  thumbnail: string
  channelName?: string
  duration?: string
  publishedDate?: string
}

export interface SubModule {
  id: string
  order: number
  title: string
  description: string
  estimatedMinutes: number
  searchQuery: string
  difficulty: "beginner" | "intermediate" | "advanced"
  articles: ArticleResource[]
  videos: VideoResource[]
  status: "pending" | "loading" | "complete" | "error"
}

export interface LearningPath {
  id: string
  topic: string
  overview: string
  totalModules: number
  estimatedTotalMinutes: number
  difficulty: "beginner" | "intermediate" | "advanced"
  subModules: SubModule[]
  createdAt: Date
  generatedBy: "llm"
}

export interface LLMModuleOutline {
  topic: string
  overview: string
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedTotalMinutes: number
  modules: Array<{
    order: number
    title: string
    description: string
    estimatedMinutes: number
    searchQuery: string
    difficulty: "beginner" | "intermediate" | "advanced"
  }>
}

export type OrchestrationStep =
  | { step: "generating"; message: string }
  | { step: "searching"; message: string }
  | { step: "complete"; message: string }
  | { step: "error"; message: string; error: Error }

// ── Q&A Tutor types ──

export interface QAMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  suggestedFollowUps?: string[];
  timestamp: number;
}

export interface ModuleConversation {
  moduleId: string;
  moduleName: string;
  messages: QAMessage[];
  lastUpdated: number;
}

export interface TutorContext {
  topic: string;
  moduleTitle: string;
  moduleDescription: string;
  moduleContent: string;
  availableArticles: ArticleResource[];
  availableVideos: VideoResource[];
  conversationHistory: QAMessage[];
}

export interface TutorResponse {
  answer: string;
  citations: Citation[];
  suggestedFollowUps: string[];
}

// Legacy types kept for backward compatibility during migration
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

export type AgentStepStatus = "pending" | "running" | "complete" | "error"
export type AgentStepType = "thinking" | "research" | "compute" | "complete"

export interface AgentStep {
  stepNumber: number
  type: AgentStepType
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
  video?: VideoMetadata
}

export interface StudySession {
  id: string
  topic: string
  learningPath: LearningPath | null
  activeModuleId: string | null
  responses: AgentResponse[]
  createdAt: number
  lastAccessed: number
}
