import { useState } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "../ui/button"

interface YouTubeEmbedProps {
  videoId: string
  title: string
}

export function YouTubeEmbed({ videoId, title }: YouTubeEmbedProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`

  if (error) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border bg-muted">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">Video unavailable</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This video may have been removed or is restricted.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5"
          onClick={() => {
            setError(false)
            setLoading(true)
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      )}
      <iframe
        src={embedUrl}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title={title}
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
      />
    </div>
  )
}
