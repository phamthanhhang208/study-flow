import { create } from "zustand";
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
import { generateQuiz } from "../api/quizGenerator";
import type { Quiz } from "../api/quizGenerator";
import {
  fetchUserPaths,
  saveLearningPath,
  deleteLearningPath,
} from "../db/learningPaths";
import {
  fetchUserProgress,
  markModuleComplete,
  unmarkModuleComplete,
} from "../db/moduleProgress";
import { supabase } from "../supabase";

// ── Quiz answer record ──
export interface AnswerRecord {
  questionId: number;
  correct: boolean;
}

export interface QuizAttempt {
  id?: string;
  moduleId: string;
  score: number;
  total: number;
  answers: AnswerRecord[];
  completedAt: string;
}

function uuid(): string {
  return crypto.randomUUID();
}

// ── State shape ──

interface StudyState {
  // Cloud-backed (no localStorage)
  sessions: StudySession[];
  currentSessionId: string | null;
  isLoadingPaths: boolean;

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

  // Module progress (cloud-backed)
  completedModuleIds: Set<string>;

  // Q&A tutor state (transient — not persisted to Supabase in Phase 2)
  moduleConversations: Record<string, ModuleConversation>;
  isAnswering: boolean;
  tutorError: string | null;

  // Session actions
  loadUserPaths: (userId: string) => Promise<void>;
  loadUserProgress: () => Promise<void>;
  toggleModuleComplete: (moduleId: string) => Promise<void>;
  startNewTopic: (topic: string) => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => Promise<void>;
  clearCurrentSession: () => void;

  // Learning path
  setLearningPath: (path: LearningPath, userId: string) => Promise<void>;
  setActiveModule: (moduleId: string) => void;
  setOrchestrating: (status: boolean) => void;
  setOrchestrationStep: (step: OrchestrationStep) => void;

  // Quiz
  quizzes: Record<string, Quiz>;
  quizAttempts: Record<string, QuizAttempt[]>;
  isGeneratingQuiz: boolean;
  quizError: string | null;
  generateQuizForModule: (moduleId: string, moduleTitle: string, moduleContent: string, apiKey?: string) => Promise<void>;
  saveQuizAttempt: (moduleId: string, score: number, total: number, answers: AnswerRecord[]) => Promise<void>;
  loadQuizAttempts: (moduleId: string) => Promise<void>;

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

function sortByLastAccessed(sessions: StudySession[]): StudySession[] {
  return [...sessions].sort((a, b) => b.lastAccessed - a.lastAccessed);
}

// ── Store (no persist — Supabase is the persistence layer) ──

export const useStudyStore = create<StudyState>()((set, get) => ({
  // Defaults
  sessions: [],
  currentSessionId: null,
  isLoadingPaths: false,

  sidebarOpen: true,
  agentThinking: false,
  agentSteps: [],
  currentResponse: "",
  currentCitations: [],
  activeSource: null,
  isOrchestrating: false,
  orchestrationStep: null,
  activeModuleId: null,
  completedModuleIds: new Set<string>(),
  moduleConversations: {},
  isAnswering: false,
  tutorError: null,
  quizzes: {},
  quizAttempts: {},
  isGeneratingQuiz: false,
  quizError: null,

  // ── Cloud sync ──

  loadUserPaths: async (userId) => {
    set({ isLoadingPaths: true });
    try {
      const sessions = await fetchUserPaths();
      set({
        sessions: sortByLastAccessed(sessions),
        currentSessionId: null,
        activeModuleId: null,
        isLoadingPaths: false,
      });
    } catch (err) {
      console.error("loadUserPaths failed:", err);
      set({ isLoadingPaths: false });
    }
    void userId; // userId used for RLS via session cookie
  },

  loadUserProgress: async () => {
    try {
      const ids = await fetchUserProgress();
      set({ completedModuleIds: ids });
    } catch (err) {
      console.error("loadUserProgress failed:", err);
    }
  },

  toggleModuleComplete: async (moduleId) => {
    const { completedModuleIds } = get();
    const isCompleted = completedModuleIds.has(moduleId);
    const next = new Set(completedModuleIds);
    if (isCompleted) {
      next.delete(moduleId);
    } else {
      next.add(moduleId);
    }
    set({ completedModuleIds: next });
    try {
      if (isCompleted) {
        await unmarkModuleComplete(moduleId);
      } else {
        await markModuleComplete(moduleId);
      }
    } catch (err) {
      // Revert on error
      set({ completedModuleIds });
      console.error("toggleModuleComplete failed:", err);
      throw err;
    }
  },

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
      activeModuleId: null,
    }));
  },

  loadSession: (id) => {
    set((state) => {
      const session = state.sessions.find((s) => s.id === id);
      return {
        currentSessionId: id,
        sessions: sortByLastAccessed(
          state.sessions.map((s) =>
            s.id === id ? { ...s, lastAccessed: Date.now() } : s,
          ),
        ),
        activeModuleId:
          session?.learningPath?.subModules[0]?.id ??
          state.activeModuleId,
        agentSteps: [],
        currentResponse: "",
        currentCitations: [],
        activeSource: null,
      };
    });
  },

  deleteSession: async (id) => {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSessionId:
        state.currentSessionId === id ? null : state.currentSessionId,
      activeModuleId:
        state.currentSessionId === id ? null : state.activeModuleId,
    }));
    try {
      await deleteLearningPath(id);
    } catch (err) {
      console.error("deleteSession Supabase error:", err);
    }
  },

  clearCurrentSession: () => {
    set({
      currentSessionId: null,
      agentSteps: [],
      currentResponse: "",
      currentCitations: [],
      activeSource: null,
      activeModuleId: null,
    });
  },

  // ── Learning path ──

  setLearningPath: async (path, userId) => {
    const state = get();
    if (!state.currentSessionId) return;

    // Update local state immediately
    set({
      sessions: sortByLastAccessed(
        state.sessions.map((s) =>
          s.id === state.currentSessionId
            ? { ...s, learningPath: path, lastAccessed: Date.now() }
            : s,
        ),
      ),
    });

    // Persist to Supabase in background
    try {
      await saveLearningPath(userId, path);
    } catch (err) {
      console.error("setLearningPath Supabase save error:", err);
    }
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

  // ── Quiz ──

  generateQuizForModule: async (moduleId, moduleTitle, moduleContent, apiKey) => {
    set({ isGeneratingQuiz: true, quizError: null });
    try {
      const quiz = await generateQuiz({ id: moduleId, title: moduleTitle, content: moduleContent }, apiKey);
      set((state) => ({
        quizzes: { ...state.quizzes, [moduleId]: quiz },
        isGeneratingQuiz: false,
      }));
    } catch (err) {
      console.error("generateQuizForModule failed:", err);
      set({ isGeneratingQuiz: false, quizError: "Failed to generate quiz. Please try again." });
    }
  },

  saveQuizAttempt: async (moduleId, score, total, answers) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const attempt: QuizAttempt = {
      moduleId,
      score,
      total,
      answers,
      completedAt: new Date().toISOString(),
    };

    const { data } = await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      module_id: moduleId,
      score,
      total,
      answers,
    }).select("id").single();

    if (data) attempt.id = data.id;

    set((state) => ({
      quizAttempts: {
        ...state.quizAttempts,
        [moduleId]: [...(state.quizAttempts[moduleId] ?? []), attempt],
      },
    }));
  },

  loadQuizAttempts: async (moduleId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("quiz_attempts")
      .select("id, score, total, answers, completed_at")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .order("completed_at", { ascending: false });

    if (!data) return;

    const attempts: QuizAttempt[] = data.map((row) => ({
      id: row.id,
      moduleId,
      score: row.score,
      total: row.total,
      answers: row.answers as AnswerRecord[],
      completedAt: row.completed_at,
    }));

    set((state) => ({
      quizAttempts: { ...state.quizAttempts, [moduleId]: attempts },
    }));
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
        state.sessions.map((s) =>
          s.id === state.currentSessionId
            ? {
                ...s,
                responses: [...s.responses, fullResponse],
                lastAccessed: Date.now(),
              }
            : s,
        ),
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
}));
