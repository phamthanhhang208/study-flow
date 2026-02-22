import { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { Share2, Loader2 } from "lucide-react";
import { Button } from "./components/ui/button";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { InputBar, type InputBarRef } from "./components/layout/InputBar";
import { WelcomeScreen } from "./components/layout/WelcomeScreen";
import { ModuleNavHorizontal } from "./components/learning/ModuleNavHorizontal";
import { ContentTabs } from "./components/learning/ContentTabs";
import { StudyAssistant } from "./components/learning/StudyAssistant";
import { OrchestrationProgress } from "./components/learning/OrchestrationProgress";
import { KeyboardShortcutsModal } from "./components/modals/KeyboardShortcutsModal";
import { useStudyFlow } from "./hooks/useStudyFlow";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useSettingsStore } from "./lib/store/settingsStore";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/auth/LoginPage";
import { exportSession } from "./lib/export";
import { shareOrGetSlug, buildShareUrl } from "./lib/db/sharedPaths";
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

// Root component — handles auth gate only, no other hooks
function App() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <StudyApp />;
}

// Inner app — only rendered when authenticated, safe to call all hooks
function StudyApp() {
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [assistantWidth, setAssistantWidth] = useState(384); // px, matches w-96
  const inputRef = useRef<InputBarRef>(null);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const delta = resizeRef.current.startX - e.clientX;
      setAssistantWidth(
        Math.min(Math.max(resizeRef.current.startWidth + delta, 240), 640),
      );
    };
    const onMouseUp = () => {
      if (!resizeRef.current) return;
      resizeRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);
  const apiKey = useSettingsStore((s) => s.apiKey);

  const {
    sessions,
    currentSession,
    currentSessionId,
    sidebarOpen,
    agentThinking,
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
    completedModuleIds,
    toggleModuleComplete,
    isLoadingPaths,
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

  const handleShareSession = useCallback(async (sessionId: string) => {
    try {
      const slug = await shareOrGetSlug(sessionId);
      const url = buildShareUrl(slug);
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!", { description: url });
    } catch {
      toast.error("Failed to create share link");
    }
  }, []);

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
  const showWelcome = !isLoadingPaths && !currentSession && !isOrchestrating;

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
                  <div className="mx-auto max-w-4xl px-6 py-6 pb-8 lg:px-8">
                    {showOrchestrating && (
                      <AnimatePresence>
                        <OrchestrationProgress step={orchestrationStep} />
                      </AnimatePresence>
                    )}

                    {showLearningContent && (
                      <>
                        {/* Topic header with Share button */}
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <h1 className="text-xl font-bold leading-tight tracking-tight text-foreground line-clamp-2">
                            {learningPath!.topic}
                          </h1>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 gap-1.5"
                            onClick={() => currentSessionId && handleShareSession(currentSessionId)}
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            Share
                          </Button>
                        </div>

                        {/* Module navigation + progress bar */}
                        <ModuleNavHorizontal
                          path={learningPath!}
                          activeModuleId={activeModuleId!}
                          completedModuleIds={completedModuleIds}
                          onSelect={setActiveModule}
                          onToggleComplete={toggleModuleComplete}
                        />

                        {/* Content tabs */}
                        <div className="mt-6">
                          <ContentTabs
                            module={activeModule}
                            citations={moduleCitations}
                            onWatchVideo={handleWatchVideo}
                          />
                        </div>
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

                    {isLoadingPaths && (
                      <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}

                    {showWelcome && (
                      <WelcomeScreen onSelectTopic={submitQuery} />
                    )}
                  </div>
                </div>

                {/* Input bar — only shown before a learning path is active */}
                {!hasLearningPath && (
                  <InputBar
                    ref={inputRef}
                    onSubmit={submitQuery}
                    onStop={stopStream}
                    isLoading={agentThinking || isOrchestrating}
                  />
                )}
              </>
            )}
          </main>

          {/* Right sidebar - Study Assistant (desktop only, when learning path active) */}
          {showLearningContent && !showSettings && (
            <aside
              className="relative hidden flex-col border-l lg:flex"
              style={{ width: assistantWidth }}
            >
              {/* Drag handle on left edge */}
              <div
                className="absolute inset-y-0 left-0 z-10 w-1 cursor-col-resize transition-colors hover:bg-primary/30 active:bg-primary/50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  resizeRef.current = {
                    startX: e.clientX,
                    startWidth: assistantWidth,
                  };
                  document.body.style.cursor = "col-resize";
                  document.body.style.userSelect = "none";
                }}
              />
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
