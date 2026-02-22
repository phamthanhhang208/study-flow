import { useEffect, useMemo } from "react"
import { useStudyStore } from "../lib/store/studyStore"
import { useAgentOrchestration } from "./useAgentOrchestration"
import { useAuth } from "../context/AuthContext"
import type { StudySession } from "../lib/api/types"

export function useStudyFlow() {
  const store = useStudyStore()
  const { handleUserInput, stopStream } = useAgentOrchestration()
  const { user } = useAuth()

  // Load user's paths and progress from Supabase once on login
  useEffect(() => {
    if (user) {
      store.loadUserPaths(user.id)
      store.loadUserProgress()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const currentSession: StudySession | undefined = useMemo(
    () => store.sessions.find((s) => s.id === store.currentSessionId),
    [store.sessions, store.currentSessionId],
  )

  return {
    // State
    sessions: store.sessions,
    currentSession,
    currentSessionId: store.currentSessionId,
    isLoadingPaths: store.isLoadingPaths,
    sidebarOpen: store.sidebarOpen,
    agentThinking: store.agentThinking,
    agentSteps: store.agentSteps,
    currentResponse: store.currentResponse,
    currentCitations: store.currentCitations,
    activeSource: store.activeSource,
    isOrchestrating: store.isOrchestrating,
    orchestrationStep: store.orchestrationStep,
    activeModuleId: store.activeModuleId,

    // Progress tracking
    completedModuleIds: store.completedModuleIds,
    toggleModuleComplete: store.toggleModuleComplete,

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
