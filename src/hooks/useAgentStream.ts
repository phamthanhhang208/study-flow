import { useCallback, useRef } from "react"
import { getYouComClient } from "../lib/api/youcom"
import { useStudyStore } from "../lib/store/studyStore"
import { useSettingsStore } from "../lib/store/settingsStore"
import type { AgentRunRequest, AgentTool, Citation } from "../lib/api/types"

export function useAgentStream() {
  const store = useStudyStore()
  const apiKey = useSettingsStore((s) => s.apiKey)
  const abortRef = useRef<AbortController | null>(null)
  const citationsRef = useRef<Citation[]>([])

  const streamQuery = useCallback(
    async (
      input: string,
      agent: AgentRunRequest["agent"] = "express",
      tools?: AgentTool[],
    ): Promise<{ content: string; citations: Citation[] }> => {
      // Abort any in-progress stream
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      citationsRef.current = []

      let fullContent = ""

      // Add initial thinking step
      store.addAgentStep({ type: "thinking", label: "Planning research...", status: "running" })

      try {
        const client = getYouComClient(apiKey || undefined)
        const stream = client.streamAgent(input, agent, tools)
        let stepCount = 1

        for await (const event of stream) {
          if (abortRef.current?.signal.aborted) break

          switch (event.type) {
            case "response.created":
              // Stream started
              break

            case "response.starting":
              // Mark thinking step complete, add research step
              store.updateAgentStep(stepCount, { status: "complete" })
              stepCount++
              store.addAgentStep({ type: "research", label: "Searching for information...", status: "running" })
              break

            case "response.output_item.added":
              if (event.response.type === "message.answer") {
                // Generating answer text
                store.updateAgentStep(stepCount, { status: "complete" })
                stepCount++
                store.addAgentStep({ type: "compute", label: "Generating response...", status: "running" })
              }
              break

            case "response.output_text.delta":
              fullContent += event.response.delta
              store.appendResponseChunk(event.response.delta)
              break

            case "response.output_item.done":
              if (event.response.content) {
                // Citations arrived
                for (const citation of event.response.content) {
                  citationsRef.current.push(citation)
                  store.addCitation(citation)
                }
              }
              break

            case "response.done":
              // Mark all remaining steps complete
              store.updateAgentStep(stepCount, { status: "complete" })
              store.addAgentStep({ type: "complete", label: "Done", status: "complete", detail: `${event.response.run_time_ms}ms` })
              break
          }
        }

        return { content: fullContent, citations: citationsRef.current }
      } catch (err) {
        if (abortRef.current?.signal.aborted) {
          return { content: fullContent, citations: citationsRef.current }
        }

        // Mark current step as error
        const steps = store.agentSteps
        const runningStep = steps.find((s) => s.status === "running")
        if (runningStep) {
          store.updateAgentStep(runningStep.stepNumber, {
            status: "error",
            detail: err instanceof Error ? err.message : "Unknown error",
          })
        }

        throw err
      }
    },
    [store, apiKey],
  )

  const stopStream = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { streamQuery, stopStream }
}
