import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  StudySession,
  LearningPath,
  AgentStep,
  AgentStepType,
  AgentStepStatus,
  AgentResponse,
  Citation,
  SourceView,
  VideoMetadata,
} from "../api/types"

function uuid(): string {
  return crypto.randomUUID()
}

// ── State shape ──

interface StudyState {
  // Persisted
  sessions: StudySession[]
  currentSessionId: string | null

  // Transient UI state
  sidebarOpen: boolean
  agentThinking: boolean
  agentSteps: AgentStep[]
  currentResponse: string
  currentCitations: Citation[]
  activeSource: SourceView | null

  // Session actions
  startNewTopic: (topic: string) => void
  loadSession: (id: string) => void
  deleteSession: (id: string) => void
  saveCurrentSession: () => void

  // Learning path
  setLearningPath: (path: LearningPath) => void
  toggleSectionExpanded: (sectionId: string) => void

  // Agent reasoning steps
  addAgentStep: (step: Omit<AgentStep, "stepNumber">) => void
  updateAgentStep: (stepNumber: number, updates: Partial<Pick<AgentStep, "status" | "detail">>) => void
  clearAgentSteps: () => void
  setAgentThinking: (thinking: boolean) => void

  // Streaming response
  appendResponseChunk: (chunk: string) => void
  addCitation: (citation: Citation) => void
  addResponse: (response: Omit<AgentResponse, "id" | "createdAt">) => void
  clearCurrentResponse: () => void

  // Source modal
  openSource: (citation: Citation, content: string | null, video?: VideoMetadata) => void
  closeSource: () => void

  // UI
  setSidebarOpen: (open: boolean) => void
}

// ── Helpers ──

function getCurrentSession(state: StudyState): StudySession | undefined {
  return state.sessions.find((s) => s.id === state.currentSessionId)
}

function updateSession(
  sessions: StudySession[],
  id: string,
  updater: (session: StudySession) => StudySession,
): StudySession[] {
  return sessions.map((s) => (s.id === id ? updater(s) : s))
}

function sortByLastAccessed(sessions: StudySession[]): StudySession[] {
  return [...sessions].sort((a, b) => b.lastAccessed - a.lastAccessed)
}

// ── Store ──

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      // Persisted defaults
      sessions: [],
      currentSessionId: null,

      // Transient defaults
      sidebarOpen: true,
      agentThinking: false,
      agentSteps: [],
      currentResponse: "",
      currentCitations: [],
      activeSource: null,

      // ── Session actions ──

      startNewTopic: (topic) => {
        const now = Date.now()
        const session: StudySession = {
          id: uuid(),
          topic,
          learningPath: null,
          responses: [],
          createdAt: now,
          lastAccessed: now,
        }
        set((state) => ({
          sessions: sortByLastAccessed([session, ...state.sessions]),
          currentSessionId: session.id,
          agentSteps: [],
          currentResponse: "",
          currentCitations: [],
          activeSource: null,
        }))
      },

      loadSession: (id) => {
        set((state) => ({
          currentSessionId: id,
          sessions: sortByLastAccessed(
            updateSession(state.sessions, id, (s) => ({
              ...s,
              lastAccessed: Date.now(),
            })),
          ),
          agentSteps: [],
          currentResponse: "",
          currentCitations: [],
          activeSource: null,
        }))
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
        }))
      },

      saveCurrentSession: () => {
        const state = get()
        const session = getCurrentSession(state)
        if (!session) return
        set({
          sessions: sortByLastAccessed(
            updateSession(state.sessions, session.id, (s) => ({
              ...s,
              lastAccessed: Date.now(),
            })),
          ),
        })
      },

      // ── Learning path ──

      setLearningPath: (path) => {
        const state = get()
        if (!state.currentSessionId) return
        set({
          sessions: sortByLastAccessed(
            updateSession(state.sessions, state.currentSessionId, (s) => ({
              ...s,
              learningPath: path,
              lastAccessed: Date.now(),
            })),
          ),
        })
      },

      toggleSectionExpanded: (sectionId) => {
        const state = get()
        if (!state.currentSessionId) return
        set({
          sessions: updateSession(state.sessions, state.currentSessionId, (s) => {
            if (!s.learningPath) return s
            return {
              ...s,
              learningPath: {
                ...s.learningPath,
                sections: s.learningPath.sections.map((sec) =>
                  sec.id === sectionId ? { ...sec, isExpanded: !sec.isExpanded } : sec,
                ),
              },
            }
          }),
        })
      },

      // ── Agent steps ──

      addAgentStep: (step) => {
        set((state) => ({
          agentSteps: [
            ...state.agentSteps,
            { ...step, stepNumber: state.agentSteps.length + 1 },
          ],
        }))
      },

      updateAgentStep: (stepNumber, updates) => {
        set((state) => ({
          agentSteps: state.agentSteps.map((s) =>
            s.stepNumber === stepNumber ? { ...s, ...updates } : s,
          ),
        }))
      },

      clearAgentSteps: () => set({ agentSteps: [] }),

      setAgentThinking: (agentThinking) => set({ agentThinking }),

      // ── Streaming response ──

      appendResponseChunk: (chunk) => {
        set((state) => ({ currentResponse: state.currentResponse + chunk }))
      },

      addCitation: (citation) => {
        set((state) => ({
          currentCitations: [...state.currentCitations, citation],
        }))
      },

      addResponse: (response) => {
        const state = get()
        if (!state.currentSessionId) return

        const fullResponse: AgentResponse = {
          ...response,
          id: uuid(),
          createdAt: Date.now(),
        }

        set({
          sessions: sortByLastAccessed(
            updateSession(state.sessions, state.currentSessionId, (s) => ({
              ...s,
              responses: [...s.responses, fullResponse],
              lastAccessed: Date.now(),
            })),
          ),
          currentResponse: "",
          currentCitations: [],
        })
      },

      clearCurrentResponse: () => set({ currentResponse: "", currentCitations: [] }),

      // ── Source modal ──

      openSource: (citation, content, video) => set({ activeSource: { citation, content, video } }),
      closeSource: () => set({ activeSource: null }),

      // ── UI ──

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: "studyflow-storage",
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
      }),
    },
  ),
)
