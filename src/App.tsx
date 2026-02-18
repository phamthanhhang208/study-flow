import { useState, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { InputBar, type InputBarRef } from "./components/layout/InputBar";
import { WelcomeScreen } from "./components/layout/WelcomeScreen";
import { ModuleNavHorizontal } from "./components/learning/ModuleNavHorizontal";
import { ContentTabs } from "./components/learning/ContentTabs";
import { StudyAssistant } from "./components/learning/StudyAssistant";
import { OrchestrationProgress } from "./components/learning/OrchestrationProgress";
import { ResponseCard } from "./components/agent/ResponseCard";
import { KeyboardShortcutsModal } from "./components/modals/KeyboardShortcutsModal";
import { useStudyFlow } from "./hooks/useStudyFlow";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useSettingsStore } from "./lib/store/settingsStore";
import { exportSession } from "./lib/export";
import type { VideoResource } from "./lib/api/types";

// Lazy load heavy modals and pages
const SourceReaderModal = lazy(() =>
  import("./components/modals/SourceReaderModal").then((m) => ({
    default: m.SourceReaderModal,
  })),
);
const VideoPlayerModal = lazy(() =>
  import("./components/modals/VideoPlayerModal").then((m) => ({
    default: m.VideoPlayerModal,
  })),
);
const SettingsPage = lazy(() =>
  import("./components/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const inputRef = useRef<InputBarRef>(null);
  const apiKey = useSettingsStore((s) => s.apiKey);

  const {
    sessions,
    currentSession,
    currentSessionId,
    sidebarOpen,
    agentThinking,
    currentResponse,
    currentCitations,
    activeSource,
    isOrchestrating,
    orchestrationStep,
    activeModuleId,
    submitQuery,
    stopStream,
    clearCurrentSession,
    loadSession,
    deleteSession,
    setActiveModule,
    openSource,
    closeSource,
    setSidebarOpen,
    moduleConversations,
    isAnswering,
    tutorError,
    askTutorQuestion,
    clearConversation,
  } = useStudyFlow();

  const learningPath = currentSession?.learningPath ?? null;
  const hasLearningPath = !!(
    learningPath &&
    learningPath.subModules &&
    learningPath.subModules.length > 0
  );

  const activeModule = useMemo(() => {
    if (!hasLearningPath || !activeModuleId) return null;
    return (
      learningPath!.subModules.find((m) => m.id === activeModuleId) ?? null
    );
  }, [hasLearningPath, learningPath, activeModuleId]);

  // Build citations from articles in the active module
  const moduleCitations = useMemo(() => {
    if (!activeModule) return [];
    return activeModule.articles.map((a) => ({
      source_type: "web",
      citation_uri: a.url,
      title: a.title,
      snippet: a.snippet || a.description,
      url: a.url,
    }));
  }, [activeModule]);

  const handleExport = useCallback(() => {
    if (!currentSession) {
      toast.error("No session to export");
      return;
    }
    exportSession(currentSession);
    toast.success("Session exported");
  }, [currentSession]);

  const handleNewTopic = useCallback(() => {
    clearCurrentSession();
    setShowSettings(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [clearCurrentSession]);

  const handleWatchVideo = useCallback(
    (video: VideoResource) => {
      openSource(
        {
          source_type: "video",
          citation_uri: video.url,
          title: video.title,
          snippet: video.description,
          url: video.url,
          thumbnail_url: video.thumbnail,
        },
        null,
        {
          provider: video.platform,
          videoId: video.videoId,
          embedUrl:
            video.platform === "youtube"
              ? `https://www.youtube.com/embed/${video.videoId}`
              : `https://player.vimeo.com/video/${video.videoId}`,
          thumbnailUrl: video.thumbnail,
        },
      );
    },
    [openSource],
  );

  const handleAskTutor = useCallback(
    (question: string) => {
      askTutorQuestion(question, apiKey || undefined);
    },
    [askTutorQuestion, apiKey],
  );

  useKeyboardShortcuts({
    onFocusInput: () => inputRef.current?.focus(),
    onExport: handleExport,
    onNewTopic: handleNewTopic,
    onToggleHelp: () => setShowShortcuts((v) => !v),
  });

  // Layout state flags
  const showOrchestrating = isOrchestrating;
  const showLearningContent =
    !isOrchestrating && hasLearningPath && activeModule;
  const showWelcome = !currentSession && !isOrchestrating;

  return (
    <div className="flex h-screen flex-col">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onExport={currentSession ? handleExport : undefined}
        onSettings={() => setShowSettings(!showSettings)}
        onShortcuts={() => setShowShortcuts(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - session history */}
        <Sidebar
          open={sidebarOpen}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewTopic={handleNewTopic}
          onSelectSession={(id) => {
            loadSession(id);
            setShowSettings(false);
          }}
          onDeleteSession={deleteSession}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Center + Right */}
        <div className="flex flex-1 overflow-hidden">
          {/* Center content */}
          <main
            id="main-content"
            className="flex min-w-0 flex-1 flex-col"
            role="main"
          >
            {showSettings ? (
              <div className="flex-1 overflow-y-auto">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-24 text-muted-foreground">
                      Loading...
                    </div>
                  }
                >
                  <SettingsPage />
                </Suspense>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto">
                  <div className="mx-auto max-w-4xl px-6 py-6 lg:px-8">
                    {showOrchestrating && (
                      <AnimatePresence>
                        <OrchestrationProgress step={orchestrationStep} />
                      </AnimatePresence>
                    )}

                    {showLearningContent && (
                      <>
                        {/* Module navigation */}
                        <ModuleNavHorizontal
                          path={learningPath!}
                          activeModuleId={activeModuleId!}
                          onSelect={setActiveModule}
                        />

                        {/* Content tabs */}
                        <div className="mt-6">
                          <ContentTabs
                            module={activeModule}
                            citations={moduleCitations}
                            onWatchVideo={handleWatchVideo}
                          />
                        </div>

                        {/* Q&A History */}
                        {currentSession!.responses.length > 0 && (
                          <div className="mt-8 space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground">
                              Questions & Answers
                            </h3>
                            {currentSession!.responses.map((response) => (
                              <ResponseCard
                                key={response.id}
                                content={response.answer}
                                query={response.query}
                                citations={response.citations}
                                timestamp={response.createdAt}
                                onOpenSource={(citation) =>
                                  openSource(citation, null)
                                }
                              />
                            ))}
                          </div>
                        )}

                        {/* Streaming response */}
                        {currentResponse && (
                          <div className="mt-6">
                            <ResponseCard
                              content={currentResponse}
                              citations={currentCitations}
                              isStreaming={agentThinking}
                              onOpenSource={(citation) =>
                                openSource(citation, null)
                              }
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* Session exists but no learning path yet and not orchestrating */}
                    {currentSession && !hasLearningPath && !isOrchestrating && (
                      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
                        <p className="text-sm">
                          Preparing your learning path...
                        </p>
                      </div>
                    )}

                    {showWelcome && (
                      <WelcomeScreen onSelectTopic={submitQuery} />
                    )}
                  </div>
                </div>

                <InputBar
                  ref={inputRef}
                  onSubmit={submitQuery}
                  onStop={stopStream}
                  isLoading={agentThinking || isOrchestrating}
                />
              </>
            )}
          </main>

          {/* Right sidebar - Study Assistant (desktop only, when learning path active) */}
          {showLearningContent && !showSettings && (
            <aside className="hidden w-96 flex-col border-l lg:flex">
              <StudyAssistant
                moduleId={activeModuleId!}
                module={activeModule!}
                conversation={moduleConversations[activeModuleId!]}
                isAnswering={isAnswering}
                tutorError={tutorError}
                onAskQuestion={handleAskTutor}
                onClearConversation={clearConversation}
                onViewCitation={(citation) => openSource(citation, null)}
              />
            </aside>
          )}
        </div>
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        <SourceReaderModal sourceView={activeSource} onClose={closeSource} />
        <VideoPlayerModal sourceView={activeSource} onClose={closeSource} />
      </Suspense>
      <KeyboardShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Screen reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {agentThinking || isOrchestrating ? "Researching your topic..." : ""}
      </div>
    </div>
  );
}

export default App;
