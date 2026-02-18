import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  StudySession,
  LearningPath,
  AgentStep,
  AgentResponse,
  Citation,
  SourceView,
  VideoMetadata,
  OrchestrationStep,
  QAMessage,
  ModuleConversation,
  TutorContext,
} from "../api/types";
import { askTutorQuestion } from "../api/tutorAgent";

function uuid(): string {
  return crypto.randomUUID();
}

// ── State shape ──

interface StudyState {
  // Persisted
  sessions: StudySession[];
  currentSessionId: string | null;

  // Transient UI state
  sidebarOpen: boolean;
  agentThinking: boolean;
  agentSteps: AgentStep[];
  currentResponse: string;
  currentCitations: Citation[];
  activeSource: SourceView | null;

  // Orchestration state (transient)
  isOrchestrating: boolean;
  orchestrationStep: OrchestrationStep | null;
  activeModuleId: string | null;

  // Q&A tutor state
  moduleConversations: Record<string, ModuleConversation>;
  isAnswering: boolean;
  tutorError: string | null;

  // Session actions
  startNewTopic: (topic: string) => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
  saveCurrentSession: () => void;
  clearCurrentSession: () => void;

  // Learning path
  setLearningPath: (path: LearningPath) => void;
  setActiveModule: (moduleId: string) => void;
  setOrchestrating: (status: boolean) => void;
  setOrchestrationStep: (step: OrchestrationStep) => void;

  // Q&A tutor
  askTutorQuestion: (question: string, apiKey?: string) => Promise<void>;
  clearConversation: (moduleId: string) => void;

  // Agent reasoning steps
  addAgentStep: (step: Omit<AgentStep, "stepNumber">) => void;
  updateAgentStep: (
    stepNumber: number,
    updates: Partial<Pick<AgentStep, "status" | "detail">>,
  ) => void;
  clearAgentSteps: () => void;
  setAgentThinking: (thinking: boolean) => void;

  // Streaming response
  appendResponseChunk: (chunk: string) => void;
  addCitation: (citation: Citation) => void;
  addResponse: (response: Omit<AgentResponse, "id" | "createdAt">) => void;
  clearCurrentResponse: () => void;

  // Source modal
  openSource: (
    citation: Citation,
    content: string | null,
    video?: VideoMetadata,
  ) => void;
  closeSource: () => void;

  // UI
  setSidebarOpen: (open: boolean) => void;
}

// ── Helpers ──

function getCurrentSession(state: StudyState): StudySession | undefined {
  return state.sessions.find((s) => s.id === state.currentSessionId);
}

function updateSession(
  sessions: StudySession[],
  id: string,
  updater: (session: StudySession) => StudySession,
): StudySession[] {
  return sessions.map((s) => (s.id === id ? updater(s) : s));
}

function sortByLastAccessed(sessions: StudySession[]): StudySession[] {
  return [...sessions].sort((a, b) => b.lastAccessed - a.lastAccessed);
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
      isOrchestrating: false,
      orchestrationStep: null,
      activeModuleId: null,
      moduleConversations: {},
      isAnswering: false,
      tutorError: null,

      // ── Session actions ──

      startNewTopic: (topic) => {
        const now = Date.now();
        const session: StudySession = {
          id: uuid(),
          topic,
          learningPath: null,
          activeModuleId: null,
          responses: [],
          createdAt: now,
          lastAccessed: now,
        };
        set((state) => ({
          sessions: sortByLastAccessed([session, ...state.sessions]),
          currentSessionId: session.id,
          agentSteps: [],
          currentResponse: "",
          currentCitations: [],
          activeSource: null,
        }));
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
        }));
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          currentSessionId:
            state.currentSessionId === id ? null : state.currentSessionId,
        }));
      },

      saveCurrentSession: () => {
        const state = get();
        const session = getCurrentSession(state);
        if (!session) return;
        set({
          sessions: sortByLastAccessed(
            updateSession(state.sessions, session.id, (s) => ({
              ...s,
              lastAccessed: Date.now(),
            })),
          ),
        });
      },

      clearCurrentSession: () => {
        set({
          currentSessionId: null,
          agentSteps: [],
          currentResponse: "",
          currentCitations: [],
          activeSource: null,
        });
      },

      // ── Learning path ──

      setLearningPath: (path) => {
        const state = get();
        if (!state.currentSessionId) return;
        set({
          sessions: sortByLastAccessed(
            updateSession(state.sessions, state.currentSessionId, (s) => ({
              ...s,
              learningPath: path,
              lastAccessed: Date.now(),
            })),
          ),
        });
      },

      setActiveModule: (moduleId) => {
        set({ activeModuleId: moduleId });
      },

      setOrchestrating: (status) => {
        set({ isOrchestrating: status });
      },

      setOrchestrationStep: (step) => {
        set({ orchestrationStep: step });
      },

      // ── Q&A tutor ──

      askTutorQuestion: async (question, apiKey) => {
        const state = get();
        const { activeModuleId } = state;
        const session = getCurrentSession(state);

        if (!activeModuleId || !session?.learningPath) return;

        const activeModule = session.learningPath.subModules.find(
          (m) => m.id === activeModuleId,
        );
        if (!activeModule) return;

        // Add user message immediately
        const userMessage: QAMessage = {
          id: uuid(),
          role: "user",
          content: question,
          timestamp: Date.now(),
        };

        const existingConvo = state.moduleConversations[activeModuleId] || {
          moduleId: activeModuleId,
          moduleName: activeModule.title,
          messages: [],
          lastUpdated: Date.now(),
        };

        set({
          moduleConversations: {
            ...state.moduleConversations,
            [activeModuleId]: {
              ...existingConvo,
              messages: [...existingConvo.messages, userMessage],
              lastUpdated: Date.now(),
            },
          },
          isAnswering: true,
          tutorError: null,
        });

        // Build context
        const context: TutorContext = {
          topic: session.learningPath.topic,
          moduleTitle: activeModule.title,
          moduleDescription: activeModule.description,
          moduleContent: activeModule.description,
          availableArticles: activeModule.articles,
          availableVideos: activeModule.videos,
          conversationHistory: existingConvo.messages,
        };

        try {
          const response = await askTutorQuestion(question, context, apiKey);

          const assistantMessage: QAMessage = {
            id: uuid(),
            role: "assistant",
            content: response.answer,
            citations: response.citations,
            suggestedFollowUps: response.suggestedFollowUps,
            timestamp: Date.now(),
          };

          const updatedConvo = get().moduleConversations[activeModuleId];
          set({
            moduleConversations: {
              ...get().moduleConversations,
              [activeModuleId]: {
                ...updatedConvo,
                messages: [...updatedConvo.messages, assistantMessage],
                lastUpdated: Date.now(),
              },
            },
            isAnswering: false,
          });
        } catch (error) {
          console.error("Tutor question failed:", error);
          set({
            isAnswering: false,
            tutorError: "Failed to get answer. Please try again.",
          });
        }
      },

      clearConversation: (moduleId) => {
        const state = get();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [moduleId]: _, ...rest } = state.moduleConversations;
        set({ moduleConversations: rest, tutorError: null });
      },

      // ── Agent steps ──

      addAgentStep: (step) => {
        set((state) => ({
          agentSteps: [
            ...state.agentSteps,
            { ...step, stepNumber: state.agentSteps.length + 1 },
          ],
        }));
      },

      updateAgentStep: (stepNumber, updates) => {
        set((state) => ({
          agentSteps: state.agentSteps.map((s) =>
            s.stepNumber === stepNumber ? { ...s, ...updates } : s,
          ),
        }));
      },

      clearAgentSteps: () => set({ agentSteps: [] }),

      setAgentThinking: (agentThinking) => set({ agentThinking }),

      // ── Streaming response ──

      appendResponseChunk: (chunk) => {
        set((state) => ({ currentResponse: state.currentResponse + chunk }));
      },

      addCitation: (citation) => {
        set((state) => ({
          currentCitations: [...state.currentCitations, citation],
        }));
      },

      addResponse: (response) => {
        const state = get();
        if (!state.currentSessionId) return;

        const fullResponse: AgentResponse = {
          ...response,
          id: uuid(),
          createdAt: Date.now(),
        };

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
        });
      },

      clearCurrentResponse: () =>
        set({ currentResponse: "", currentCitations: [] }),

      // ── Source modal ──

      openSource: (citation, content, video) =>
        set({ activeSource: { citation, content, video } }),
      closeSource: () => set({ activeSource: null }),

      // ── UI ──

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: "studyflow-storage",
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        moduleConversations: state.moduleConversations,
      }),
    },
  ),
);
