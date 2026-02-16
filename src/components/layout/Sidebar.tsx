import { Plus, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { cn } from "../../lib/utils/cn"
import { TopicExplorerCard } from "../learning/TopicExplorerCard"
import type { StudySession } from "../../lib/api/types"

interface SidebarProps {
  open: boolean
  sessions: StudySession[]
  currentSessionId: string | null
  onNewTopic: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
}

export function Sidebar({
  open,
  sessions,
  currentSessionId,
  onNewTopic,
  onSelectSession,
  onDeleteSession,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-muted/40 transition-all duration-300",
        open ? "w-64" : "w-0 overflow-hidden"
      )}
    >
      <div className="flex items-center justify-between p-4">
        <span className="text-sm font-medium text-muted-foreground">Topics</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNewTopic}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Separator />
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {sessions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No topics yet. Start by asking a question below.
          </p>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="group relative">
              <TopicExplorerCard
                session={session}
                isActive={session.id === currentSessionId}
                onClick={() => onSelectSession(session.id)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSession(session.id)
                }}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
