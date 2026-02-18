import { useMemo } from "react"
import { useStudyStore } from "../lib/store/studyStore"
import { useAgentOrchestration } from "./useAgentOrchestration"
import type { StudySession } from "../lib/api/types"

export function useStudyFlow() {
  const store = useStudyStore()
  const { handleUserInput, stopStream } = useAgentOrchestration()

  const currentSession: StudySession | undefined = useMemo(
    () => store.sessions.find((s) => s.id === store.currentSessionId),
    [store.sessions, store.currentSessionId],
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
    isOrchestrating: store.isOrchestrating,
    orchestrationStep: store.orchestrationStep,
    activeModuleId: store.activeModuleId,

    // Q&A tutor
    moduleConversations: store.moduleConversations,
    isAnswering: store.isAnswering,
    tutorError: store.tutorError,

    // Actions
    submitQuery: handleUserInput,
    stopStream,
    startNewTopic: store.startNewTopic,
    clearCurrentSession: store.clearCurrentSession,
    loadSession: store.loadSession,
    deleteSession: store.deleteSession,
    setLearningPath: store.setLearningPath,
    setActiveModule: store.setActiveModule,
    appendResponseChunk: store.appendResponseChunk,
    addResponse: store.addResponse,
    askTutorQuestion: store.askTutorQuestion,
    clearConversation: store.clearConversation,
    openSource: store.openSource,
    closeSource: store.closeSource,
    setSidebarOpen: store.setSidebarOpen,
  }
}
