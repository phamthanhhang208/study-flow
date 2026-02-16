import { useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink, Globe, MessageSquare } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { YouTubeEmbed } from "./YouTubeEmbed"
import type { SourceView } from "../../lib/api/types"

interface VideoPlayerModalProps {
  sourceView: SourceView | null
  onClose: () => void
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}

export function VideoPlayerModal({ sourceView, onClose }: VideoPlayerModalProps) {
  const citation = sourceView?.citation
  const video = sourceView?.video
  const isOpen = !!sourceView && !!video

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [isOpen])

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
      {isOpen && citation && video && (
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
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3 w-3" />
                    <span>{getDomain(citation.url)}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {video.provider}
                  </Badge>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
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

            {/* Video content */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl px-6 py-6">
                {video.provider === "youtube" ? (
                  <YouTubeEmbed videoId={video.videoId} title={citation.title} />
                ) : (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                    <iframe
                      src={video.embedUrl}
                      className="h-full w-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={citation.title}
                    />
                  </div>
                )}

                {/* Video description */}
                {citation.snippet && (
                  <div className="mt-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {citation.snippet}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  placeholder="Ask about this video..."
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
