import { useState, useRef, useCallback, lazy, Suspense } from "react"
import { toast } from "sonner"
import { Header } from "./components/layout/Header"
import { Sidebar } from "./components/layout/Sidebar"
import { InputBar, type InputBarRef } from "./components/layout/InputBar"
import { WelcomeScreen } from "./components/layout/WelcomeScreen"
import { TopicExplorerCard } from "./components/learning/TopicExplorerCard"
import { AgentThinkingDisplay } from "./components/agent/AgentThinkingDisplay"
import { ResponseCard } from "./components/agent/ResponseCard"
import { KeyboardShortcutsModal } from "./components/modals/KeyboardShortcutsModal"
import { useStudyFlow } from "./hooks/useStudyFlow"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"
import { exportSession } from "./lib/export"

// Lazy load heavy modals and pages
const SourceReaderModal = lazy(() =>
  import("./components/modals/SourceReaderModal").then((m) => ({ default: m.SourceReaderModal })),
)
const VideoPlayerModal = lazy(() =>
  import("./components/modals/VideoPlayerModal").then((m) => ({ default: m.VideoPlayerModal })),
)
const SettingsPage = lazy(() =>
  import("./components/SettingsPage").then((m) => ({ default: m.SettingsPage })),
)

function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const inputRef = useRef<InputBarRef>(null)

  const {
    sessions,
    currentSession,
    currentSessionId,
    sidebarOpen,
    agentThinking,
    agentSteps,
    currentResponse,
    currentCitations,
    activeSource,
    submitQuery,
    stopStream,
    clearCurrentSession,
    loadSession,
    deleteSession,
    toggleSectionExpanded,
    openSource,
    closeSource,
    setSidebarOpen,
  } = useStudyFlow()

  const handleExport = useCallback(() => {
    if (!currentSession) {
      toast.error("No session to export")
      return
    }
    exportSession(currentSession)
    toast.success("Session exported")
  }, [currentSession])

  const handleNewTopic = useCallback(() => {
    // Clear current session to show the WelcomeScreen with prompts.
    // A session is created when the user actually submits a query.
    clearCurrentSession()
    setShowSettings(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [clearCurrentSession])

  useKeyboardShortcuts({
    onFocusInput: () => inputRef.current?.focus(),
    onExport: handleExport,
    onNewTopic: handleNewTopic,
    onToggleHelp: () => setShowShortcuts((v) => !v),
  })

  return (
    <div className="flex h-screen flex-col">
      {/* Skip to main content link */}
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
        <Sidebar
          open={sidebarOpen}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewTopic={handleNewTopic}
          onSelectSession={(id) => {
            loadSession(id)
            setShowSettings(false)
          }}
          onDeleteSession={deleteSession}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main id="main-content" className="flex flex-1 flex-col" role="main">
          {showSettings ? (
            <div className="flex-1 overflow-y-auto">
              <Suspense fallback={<div className="flex items-center justify-center py-24 text-muted-foreground">Loading...</div>}>
                <SettingsPage />
              </Suspense>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-8 sm:px-6">
                  {currentSession ? (
                    <>
                      {/* Learning Path */}
                      <TopicExplorerCard
                        topic={currentSession.topic}
                        learningPath={currentSession.learningPath}
                        agentSteps={agentSteps}
                        isLoading={agentThinking}
                        onToggleSection={toggleSectionExpanded}
                        onOpenSource={(citation, video) => openSource(citation, null, video)}
                      />

                      {/* Q&A History */}
                      {currentSession.responses.length > 0 && (
                        <div className="mt-8 w-full max-w-4xl space-y-4">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Questions & Answers
                          </h3>
                          {currentSession.responses.map((response) => (
                            <ResponseCard
                              key={response.id}
                              content={response.answer}
                              query={response.query}
                              citations={response.citations}
                              timestamp={response.createdAt}
                              onOpenSource={(citation) => openSource(citation, null)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Current streaming response */}
                      {currentResponse && (
                        <div className="mt-6 w-full max-w-4xl">
                          <ResponseCard
                            content={currentResponse}
                            citations={currentCitations}
                            isStreaming={agentThinking}
                            onOpenSource={(citation) => openSource(citation, null)}
                          />
                        </div>
                      )}

                      {/* Agent thinking for follow-up questions (before streaming text starts) */}
                      {agentThinking && !currentResponse && currentSession.learningPath && (
                        <div className="mt-6 w-full max-w-4xl">
                          <AgentThinkingDisplay isThinking={agentThinking} steps={agentSteps} />
                        </div>
                      )}
                    </>
                  ) : (
                    <WelcomeScreen onSelectTopic={submitQuery} />
                  )}
                </div>
              </div>
              <InputBar
                ref={inputRef}
                onSubmit={submitQuery}
                onStop={stopStream}
                isLoading={agentThinking}
              />
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        <SourceReaderModal sourceView={activeSource} onClose={closeSource} />
        <VideoPlayerModal sourceView={activeSource} onClose={closeSource} />
      </Suspense>
      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Screen reader live region for loading announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {agentThinking ? "Researching your topic..." : ""}
      </div>
    </div>
  )
}

export default App
