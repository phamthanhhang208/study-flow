import { useCallback } from "react"
import { toast } from "sonner"
import { useStudyStore } from "../lib/store/studyStore"
import { useSettingsStore } from "../lib/store/settingsStore"
import { useAgentStream } from "./useAgentStream"
import { getYouComClient } from "../lib/api/youcom"
import { detectVideo } from "../lib/utils/video"
import type { LearningPath, Section, Resource, Citation, SearchWebResult } from "../lib/api/types"

// ── Prompt templates ──

function buildTopicPrompt(topic: string): string {
  return `You are a learning assistant. Research the topic "${topic}" thoroughly and create a structured learning path.

Format your response EXACTLY as follows (use these exact headers):

# ${topic}

## Summary
A 2-3 sentence overview of what this topic covers and why it's important.

## Section: [Section Title 1]
Detailed explanation of this subtopic (2-4 paragraphs).

## Section: [Section Title 2]
Detailed explanation of this subtopic (2-4 paragraphs).

## Section: [Section Title 3]
Detailed explanation of this subtopic (2-4 paragraphs).

Create 3-6 sections covering the key aspects of the topic. Each section should be educational and thorough.`
}

function buildQuestionPrompt(topic: string, question: string): string {
  return `You are a learning assistant helping someone study "${topic}".

Answer the following question thoroughly with citations where appropriate. Use [1], [2], etc. to reference sources.

Question: ${question}`
}

// ── Response parsing ──

function parseLearningPath(topic: string, content: string): LearningPath {
  const lines = content.split("\n")
  let summary = ""
  const sections: Section[] = []
  let currentSection: { title: string; lines: string[] } | null = null

  for (const line of lines) {
    // Summary section
    if (line.startsWith("## Summary")) {
      continue
    }

    // Section header
    const sectionMatch = line.match(/^## Section:\s*(.+)/)
    if (sectionMatch) {
      // Save previous section
      if (currentSection) {
        sections.push({
          id: crypto.randomUUID(),
          title: currentSection.title,
          content: currentSection.lines.join("\n").trim(),
          resources: [],
          isExpanded: sections.length === 0,
        })
      }
      currentSection = { title: sectionMatch[1].trim(), lines: [] }
      continue
    }

    // Generic h2 that's not "Summary" or "Section:" - treat as section
    const h2Match = line.match(/^## (.+)/)
    if (h2Match && !h2Match[1].startsWith("Summary")) {
      if (currentSection) {
        sections.push({
          id: crypto.randomUUID(),
          title: currentSection.title,
          content: currentSection.lines.join("\n").trim(),
          resources: [],
          isExpanded: sections.length === 0,
        })
      }
      currentSection = { title: h2Match[1].trim(), lines: [] }
      continue
    }

    // Skip the main title
    if (line.startsWith("# ")) continue

    // Accumulate content
    if (currentSection) {
      currentSection.lines.push(line)
    } else if (!summary && line.trim()) {
      // Before first section, accumulate as summary
      summary += (summary ? " " : "") + line.trim()
    }
  }

  // Save last section
  if (currentSection) {
    sections.push({
      id: crypto.randomUUID(),
      title: currentSection.title,
      content: currentSection.lines.join("\n").trim(),
      resources: [],
      isExpanded: sections.length === 0,
    })
  }

  // If no structured sections found, create a single section from the whole content
  if (sections.length === 0) {
    sections.push({
      id: crypto.randomUUID(),
      title: "Overview",
      content: content,
      resources: [],
      isExpanded: true,
    })
  }

  return { topic, summary: summary || `A comprehensive guide to ${topic}.`, sections }
}

function citationsToResources(citations: Citation[]): Resource[] {
  return citations.map((c) => {
    const video = detectVideo(c.url)
    return {
      title: c.title,
      url: c.url,
      snippet: c.snippet,
      thumbnailUrl: c.thumbnail_url,
      ...(video && { video }),
    }
  })
}

function distributeResources(sections: Section[], resources: Resource[]): Section[] {
  if (resources.length === 0 || sections.length === 0) return sections

  // Distribute resources across sections evenly
  const perSection = Math.ceil(resources.length / sections.length)
  return sections.map((section, i) => ({
    ...section,
    resources: resources.slice(i * perSection, (i + 1) * perSection),
  }))
}

async function enrichWithSearch(topic: string, sections: Section[], apiKey?: string): Promise<Section[]> {
  try {
    const client = getYouComClient(apiKey)
    const results = await client.search(topic, { count: 10 })
    const webResults = results.results.web

    if (webResults.length === 0) return sections

    // Try to match resources to sections by keyword relevance
    const enriched = sections.map((section) => {
      const sectionWords = section.title.toLowerCase().split(/\s+/)
      const matched = webResults.filter((r: SearchWebResult) => {
        const text = (r.title + " " + r.description).toLowerCase()
        return sectionWords.some((word) => word.length > 3 && text.includes(word))
      })

      const resources: Resource[] = (matched.length > 0 ? matched : []).slice(0, 3).map((r: SearchWebResult) => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
        thumbnailUrl: r.thumbnail_url,
        ...(r.video && { video: r.video }),
      }))

      return { ...section, resources: [...section.resources, ...resources] }
    })

    // Put unmatched resources in sections that have none
    const usedUrls = new Set(enriched.flatMap((s) => s.resources.map((r) => r.url)))
    const unmatched = webResults
      .filter((r: SearchWebResult) => !usedUrls.has(r.url))
      .slice(0, 6)
      .map((r: SearchWebResult): Resource => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
        thumbnailUrl: r.thumbnail_url,
        ...(r.video && { video: r.video }),
      }))

    if (unmatched.length > 0) {
      const emptySections = enriched.filter((s) => s.resources.length === 0)
      if (emptySections.length > 0) {
        const perEmpty = Math.ceil(unmatched.length / emptySections.length)
        let idx = 0
        return enriched.map((s) => {
          if (s.resources.length === 0 && idx < unmatched.length) {
            const assigned = unmatched.slice(idx, idx + perEmpty)
            idx += perEmpty
            return { ...s, resources: assigned }
          }
          return s
        })
      }
    }

    return enriched
  } catch {
    // Search enrichment is best-effort
    return sections
  }
}

// ── Main orchestration hook ──

export function useAgentOrchestration() {
  const store = useStudyStore()
  const apiKey = useSettingsStore((s) => s.apiKey)
  const { streamQuery, stopStream } = useAgentStream()

  const handleUserInput = useCallback(
    async (input: string) => {
      const isNewTopic = !store.currentSessionId

      // Create session if needed
      if (isNewTopic) {
        store.startNewTopic(input)
      }

      store.setAgentThinking(true)
      store.clearAgentSteps()
      store.clearCurrentResponse()

      try {
        if (isNewTopic) {
          // ── New topic: generate learning path ──
          const prompt = buildTopicPrompt(input)
          const { content, citations } = await streamQuery(
            prompt,
            "express",
            [{ type: "web_search" }, { type: "research", search_effort: "high", report_verbosity: "high" }],
          )

          // Parse learning path from response
          let learningPath = parseLearningPath(input, content)

          // Add citation resources to sections
          if (citations.length > 0) {
            const resources = citationsToResources(citations)
            learningPath = {
              ...learningPath,
              sections: distributeResources(learningPath.sections, resources),
            }
          }

          // Enrich with search results (best effort, non-blocking for UX)
          try {
            const enrichedSections = await enrichWithSearch(input, learningPath.sections, apiKey || undefined)
            learningPath = { ...learningPath, sections: enrichedSections }
          } catch {
            // Search enrichment failed, continue with what we have
          }

          store.setLearningPath(learningPath)
          toast.success("Learning path created!")

          // Also save as a response for history
          store.addResponse({
            query: input,
            answer: content,
            citations,
          })
        } else {
          // ── Follow-up question ──
          const session = store.sessions.find((s) => s.id === store.currentSessionId)
          const topic = session?.topic || "this topic"

          const prompt = buildQuestionPrompt(topic, input)
          const { content, citations } = await streamQuery(
            prompt,
            "express",
            [{ type: "web_search" }, { type: "compute" }],
          )

          // Save as response
          store.addResponse({
            query: input,
            answer: content,
            citations,
          })
        }
      } catch (err) {
        console.error("Agent orchestration error:", err)
        const message = err instanceof Error ? err.message : "Something went wrong"
        toast.error("Failed to process request", { description: message })

        // If we have partial content, save it
        const currentContent = store.currentResponse
        if (currentContent) {
          store.addResponse({
            query: input,
            answer: currentContent + "\n\n*[Response interrupted due to an error]*",
            citations: store.currentCitations,
          })
        }
      } finally {
        store.setAgentThinking(false)
      }
    },
    [store, streamQuery],
  )

  return { handleUserInput, stopStream }
}
