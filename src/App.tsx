import { useState } from "react"
import { BookOpen } from "lucide-react"
import { Header } from "./components/layout/Header"
import { Sidebar } from "./components/layout/Sidebar"
import { InputBar } from "./components/layout/InputBar"
import { ApiTestPage } from "./components/ApiTestPage"
import { useStudyFlow } from "./hooks/useStudyFlow"

function App() {
  const [showTestPage, setShowTestPage] = useState(false)
  const {
    sessions,
    currentSession,
    currentSessionId,
    sidebarOpen,
    agentThinking,
    submitQuery,
    startNewTopic,
    loadSession,
    deleteSession,
    setSidebarOpen,
  } = useStudyFlow()

  return (
    <div className="flex h-screen flex-col">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onToggleTest={() => setShowTestPage(!showTestPage)}
        showTestPage={showTestPage}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewTopic={() => startNewTopic("New Topic")}
          onSelectSession={loadSession}
          onDeleteSession={deleteSession}
        />
        <main className="flex flex-1 flex-col">
          {showTestPage ? (
            <div className="flex-1 overflow-y-auto">
              <ApiTestPage />
            </div>
          ) : (
            <>
              <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
                {currentSession ? (
                  <div className="w-full max-w-3xl">
                    <h2 className="text-xl font-semibold">{currentSession.topic}</h2>
                    {currentSession.responses.length === 0 && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Ask a question about this topic to get started.
                      </p>
                    )}
                    {currentSession.responses.map((response) => (
                      <div key={response.id} className="mt-4 rounded-lg border p-4">
                        <p className="text-sm font-medium text-muted-foreground">{response.query}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm">{response.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h2 className="mt-4 text-xl font-semibold">Welcome to StudyFlow</h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                      Ask any question to start learning. StudyFlow will research the topic,
                      organize information, and create a structured study guide for you.
                    </p>
                  </div>
                )}
              </div>
              <InputBar onSubmit={submitQuery} isLoading={agentThinking} />
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
