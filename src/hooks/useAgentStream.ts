import { useState, useCallback, useRef } from "react"
import { getYouComClient } from "../lib/api/youcom"
import type { AgentEvent, AgentRunRequest, AgentTool, Citation } from "../lib/api/types"

interface AgentStreamState {
  isStreaming: boolean
  content: string
  citations: Citation[]
  events: AgentEvent[]
  error: string | null
  runtimeMs: number | null
}

const INITIAL_STATE: AgentStreamState = {
  isStreaming: false,
  content: "",
  citations: [],
  events: [],
  error: null,
  runtimeMs: null,
}

export function useAgentStream() {
  const [state, setState] = useState<AgentStreamState>(INITIAL_STATE)
  const abortRef = useRef<AbortController | null>(null)

  const startStream = useCallback(
    async (
      query: string,
      agent: AgentRunRequest["agent"] = "express",
      tools?: AgentTool[],
    ) => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      setState({ ...INITIAL_STATE, isStreaming: true })

      try {
        const client = getYouComClient()
        const stream = client.streamAgent(query, agent, tools)

        for await (const event of stream) {
          if (abortRef.current?.signal.aborted) break

          setState((prev) => {
            const events = [...prev.events, event]

            if (event.type === "response.output_text.delta") {
              return { ...prev, events, content: prev.content + event.response.delta }
            }

            if (event.type === "response.output_item.done") {
              if (event.response.content) {
                return { ...prev, events, citations: [...prev.citations, ...event.response.content] }
              }
            }

            if (event.type === "response.done") {
              return { ...prev, events, runtimeMs: event.response.run_time_ms, isStreaming: false }
            }

            return { ...prev, events }
          })
        }

        setState((prev) => ({ ...prev, isStreaming: false }))
      } catch (err) {
        if (abortRef.current?.signal.aborted) return
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "Unknown error",
          isStreaming: false,
        }))
      }
    },
    [],
  )

  const stopStream = useCallback(() => {
    abortRef.current?.abort()
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  return { ...state, startStream, stopStream }
}
