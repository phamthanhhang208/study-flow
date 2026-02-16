import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink, Copy, Check, Loader2, AlertCircle, RefreshCw, Globe, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { MarkdownRenderer } from "../agent/MarkdownRenderer"
import { getYouComClient } from "../../lib/api/youcom"
import { useSettingsStore } from "../../lib/store/settingsStore"
import type { SourceView } from "../../lib/api/types"

interface SourceReaderModalProps {
  sourceView: SourceView | null
  onClose: () => void
}

type FetchState = "idle" | "loading" | "success" | "error"

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}

export function SourceReaderModal({ sourceView, onClose }: SourceReaderModalProps) {
  const apiKey = useSettingsStore((s) => s.apiKey)
  const [fetchState, setFetchState] = useState<FetchState>("idle")
  const [articleContent, setArticleContent] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [copied, setCopied] = useState(false)

  const citation = sourceView?.citation
  const isOpen = !!sourceView && !sourceView.video

  const fetchContent = useCallback(async (url: string) => {
    setFetchState("loading")
    setErrorMessage("")
    try {
      const client = getYouComClient(apiKey || undefined)
      const results = await client.getContent([url], ["markdown", "metadata"])
      const result = results[0]
      if (result?.markdown) {
        setArticleContent(result.markdown)
        setFetchState("success")
      } else {
        setArticleContent(null)
        setFetchState("success")
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to fetch content")
      setFetchState("error")
    }
  }, [apiKey])

  useEffect(() => {
    if (!isOpen || !citation) {
      setFetchState("idle")
      setArticleContent(null)
      return
    }

    // If content is already provided, use it
    if (sourceView.content) {
      setArticleContent(sourceView.content)
      setFetchState("success")
      return
    }

    // Fetch content via Contents API
    fetchContent(citation.url)
  }, [isOpen, citation, sourceView?.content, fetchContent])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [isOpen])

  const handleCopy = useCallback(async () => {
    if (!articleContent) return
    try {
      await navigator.clipboard.writeText(articleContent)
      setCopied(true)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }, [articleContent])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && citation && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80" onClick={onClose} />

          {/* Modal panel */}
          <motion.div
            className="relative z-10 mt-12 flex flex-1 flex-col overflow-hidden rounded-t-xl border-t bg-background shadow-2xl sm:mx-auto sm:mt-16 sm:max-w-4xl sm:rounded-t-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-start gap-3 border-b px-6 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold leading-snug">{citation.title}</h2>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  <span>{getDomain(citation.url)}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCopy}
                  disabled={!articleContent}
                  aria-label="Copy content"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
              {fetchState === "loading" && (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">Loading article content...</p>
                </div>
              )}

              {fetchState === "error" && (
                <div className="flex flex-col items-center justify-center py-24">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="mt-4 text-sm font-medium">Failed to load content</p>
                  <p className="mt-1 max-w-md text-center text-xs text-muted-foreground">
                    {errorMessage}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1.5"
                    onClick={() => fetchContent(citation.url)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry
                  </Button>
                </div>
              )}

              {fetchState === "success" && articleContent && (
                <div className="mx-auto max-w-3xl px-6 py-8">
                  <MarkdownRenderer content={articleContent} />
                </div>
              )}

              {fetchState === "success" && !articleContent && (
                <iframe
                  src={citation.url}
                  className="h-full w-full"
                  title={citation.title}
                  sandbox="allow-same-origin allow-scripts allow-popups"
                />
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  placeholder="Ask about this article..."
                  className="h-9 text-sm"
                  disabled
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
