import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Copy, Check, Brain, Clock } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "../ui/card"
import { Button } from "../ui/button"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { CitationCard } from "./CitationCard"
import { AgentThinkingDisplay } from "./AgentThinkingDisplay"
import type { Citation, AgentStep } from "../../lib/api/types"

interface ResponseCardProps {
  content: string
  query?: string
  citations?: Citation[]
  agentSteps?: AgentStep[]
  timestamp?: number
  isStreaming?: boolean
  onOpenSource?: (citation: Citation) => void
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function ResponseCard({
  content,
  query,
  citations = [],
  agentSteps = [],
  timestamp,
  isStreaming = false,
  onOpenSource,
}: ResponseCardProps) {
  const [showReasoning, setShowReasoning] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }, [content])

  const handleCitationClick = useCallback(
    (index: number) => {
      const el = document.getElementById(`citation-${index}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" })
        el.classList.add("ring-2", "ring-primary")
        setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 2000)
      }
    },
    [],
  )

  const handleViewSource = useCallback(
    (citation: Citation) => {
      if (onOpenSource) {
        onOpenSource(citation)
      }
    },
    [onOpenSource],
  )

  return (
    <Card>
      {/* Question header */}
      {query && (
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug">{query}</p>
            {timestamp && (
              <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatTimestamp(timestamp)}</span>
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className={query ? "pt-0" : "pt-6"}>
        {/* Answer body with markdown */}
        <div className="relative">
          <MarkdownRenderer content={content} onCitationClick={handleCitationClick} />

          {/* Streaming cursor */}
          {isStreaming && (
            <span className="streaming-cursor ml-0.5 inline-block h-4 w-0.5 bg-foreground" />
          )}
        </div>

        {/* Action bar */}
        {!isStreaming && content && (
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </Button>

            {agentSteps.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
                onClick={() => setShowReasoning(!showReasoning)}
              >
                <Brain className="h-3 w-3" />
                {showReasoning ? "Hide" : "Show"} Reasoning
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${showReasoning ? "rotate-180" : ""}`}
                />
              </Button>
            )}
          </div>
        )}

        {/* Collapsible reasoning */}
        <AnimatePresence>
          {showReasoning && agentSteps.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 border-t pt-4">
                <AgentThinkingDisplay isThinking={false} steps={agentSteps} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Citations */}
        {citations.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sources ({citations.length})
            </h4>
            <div className="space-y-2">
              {citations.map((citation, i) => (
                <CitationCard
                  key={`${citation.url}-${i}`}
                  citation={citation}
                  index={i + 1}
                  onViewSource={handleViewSource}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
