import { useCallback, useMemo } from "react"
import { useStudyStore } from "../lib/store/studyStore"
import type { StudySession } from "../lib/api/types"

export function useStudyFlow() {
  const store = useStudyStore()

  const currentSession: StudySession | undefined = useMemo(
    () => store.sessions.find((s) => s.id === store.currentSessionId),
    [store.sessions, store.currentSessionId],
  )

  const submitQuery = useCallback(
    async (query: string) => {
      if (!store.currentSessionId) {
        store.startNewTopic(query)
      }
      store.setAgentThinking(true)
      store.clearCurrentResponse()

      try {
        // Will be wired to the agent stream in a later phase
        console.log("Submitting query:", query)
      } finally {
        store.setAgentThinking(false)
      }
    },
    [store],
  )

  return {
    // State
    sessions: store.sessions,
    currentSession,
    currentSessionId: store.currentSessionId,
    sidebarOpen: store.sidebarOpen,
    agentThinking: store.agentThinking,
    agentSteps: store.agentSteps,
    currentResponse: store.currentResponse,
    currentCitations: store.currentCitations,
    activeSource: store.activeSource,

    // Actions
    submitQuery,
    startNewTopic: store.startNewTopic,
    loadSession: store.loadSession,
    deleteSession: store.deleteSession,
    setLearningPath: store.setLearningPath,
    toggleSectionExpanded: store.toggleSectionExpanded,
    appendResponseChunk: store.appendResponseChunk,
    addResponse: store.addResponse,
    openSource: store.openSource,
    closeSource: store.closeSource,
    setSidebarOpen: store.setSidebarOpen,
  }
}
