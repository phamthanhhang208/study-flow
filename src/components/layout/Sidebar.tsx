import { useState, useMemo } from "react"
import { Plus, Trash2, Search, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Separator } from "../ui/separator"
import { cn } from "../../lib/utils/cn"
import type { StudySession } from "../../lib/api/types"

interface SidebarProps {
  open: boolean
  sessions: StudySession[]
  currentSessionId: string | null
  onNewTopic: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onClose?: () => void
}

// ── Date grouping helpers ──

function getDateGroup(timestamp: number): string {
  const now = new Date()
  const date = new Date(timestamp)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  if (date >= today) return "Today"
  if (date >= yesterday) return "Yesterday"
  if (date >= weekAgo) return "Last 7 days"
  return "Older"
}

function groupSessions(sessions: StudySession[]): [string, StudySession[]][] {
  const groups = new Map<string, StudySession[]>()
  const order = ["Today", "Yesterday", "Last 7 days", "Older"]

  for (const session of sessions) {
    const group = getDateGroup(session.lastAccessed)
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(session)
  }

  return order.filter((g) => groups.has(g)).map((g) => [g, groups.get(g)!])
}

// ── Sidebar component ──

export function Sidebar({
  open,
  sessions,
  currentSessionId,
  onNewTopic,
  onSelectSession,
  onDeleteSession,
  onClose,
}: SidebarProps) {
  const [search, setSearch] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions
    const q = search.toLowerCase()
    return sessions.filter((s) => s.topic.toLowerCase().includes(q))
  }, [sessions, search])

  const grouped = useMemo(() => groupSessions(filtered), [filtered])

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      onDeleteSession(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      // Auto-dismiss after 3s
      setTimeout(() => setConfirmDelete((prev) => (prev === id ? null : prev)), 3000)
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "flex h-full flex-col border-r bg-muted/40 transition-all duration-300",
          // Mobile: fixed overlay drawer
          "fixed inset-y-0 left-0 z-40 md:relative md:z-auto",
          open ? "w-64" : "w-0 overflow-hidden",
        )}
      >
      <div className="flex items-center justify-between p-4">
        <span className="text-sm font-medium text-muted-foreground">Topics</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onNewTopic}
          aria-label="New topic"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="h-8 pl-8 pr-8 text-xs"
            aria-label="Search topics"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0.5 top-1/2 h-6 w-6 -translate-y-1/2"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {search ? "No matching topics" : "No topics yet. Start by asking a question below."}
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map(([group, items]) => (
              <div key={group}>
                <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group}
                </p>
                <div className="space-y-1">
                  <AnimatePresence mode="popLayout">
                    {items.map((session) => (
                      <motion.div
                        key={session.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="group relative"
                      >
                        <button
                          type="button"
                          className={cn(
                            "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                            session.id === currentSessionId
                              ? "bg-accent font-medium text-accent-foreground"
                              : "hover:bg-accent/50",
                          )}
                          onClick={() => onSelectSession(session.id)}
                          aria-label={`Open topic: ${session.topic}`}
                        >
                          <p className="truncate leading-snug">{session.topic}</p>
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            {session.learningPath
                              ? `${session.learningPath.sections.length} sections`
                              : "New topic"}
                            {session.responses.length > 0 &&
                              ` · ${session.responses.length} Q&A`}
                          </p>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "absolute right-1 top-1 h-6 w-6 transition-opacity",
                            confirmDelete === session.id
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100",
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(session.id)
                          }}
                          aria-label={confirmDelete === session.id ? "Confirm delete" : "Delete topic"}
                        >
                          <Trash2
                            className={cn(
                              "h-3 w-3",
                              confirmDelete === session.id
                                ? "text-destructive"
                                : "text-muted-foreground",
                            )}
                          />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </aside>
    </>
  )
}
