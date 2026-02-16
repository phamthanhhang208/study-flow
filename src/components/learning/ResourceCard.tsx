import { ExternalLink, FileText, Play, Globe } from "lucide-react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import type { Resource, Citation, VideoMetadata } from "../../lib/api/types"

interface ResourceCardProps {
  resource: Resource
  onOpenSource?: (citation: Citation, video?: VideoMetadata) => void
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}

function ArticleCard({ resource, onOpenSource }: ResourceCardProps) {
  const handleClick = () => {
    if (onOpenSource) {
      onOpenSource({
        source_type: "web",
        citation_uri: resource.url,
        title: resource.title,
        snippet: resource.snippet,
        url: resource.url,
      })
    }
  }

  return (
    <div
      className="group flex cursor-pointer flex-col rounded-lg border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      aria-label={`Read article: ${resource.title}`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <Globe className="h-3 w-3" />
        <span className="truncate">{getDomain(resource.url)}</span>
      </div>
      <h4 className="mb-1 line-clamp-2 text-sm font-medium leading-snug">{resource.title}</h4>
      <p className="mb-3 line-clamp-2 flex-1 text-xs text-muted-foreground">{resource.snippet}</p>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
          Read Article
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

function VideoCard({ resource, onOpenSource }: ResourceCardProps) {
  const video = resource.video!
  const thumbnailUrl = resource.thumbnailUrl || video.thumbnailUrl

  const handleClick = () => {
    if (onOpenSource) {
      onOpenSource(
        {
          source_type: "video",
          citation_uri: resource.url,
          title: resource.title,
          snippet: resource.snippet,
          url: resource.url,
          thumbnail_url: thumbnailUrl,
        },
        video,
      )
    }
  }

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-lg border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      aria-label={`Watch video: ${resource.title}`}
    >
      {thumbnailUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <img
            src={thumbnailUrl}
            alt={resource.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow">
              <Play className="h-5 w-5 fill-current text-foreground" />
            </div>
          </div>
          <Badge variant="secondary" className="absolute bottom-2 right-2 gap-1 text-xs">
            <Play className="h-3 w-3" />
            {video.provider}
          </Badge>
        </div>
      )}
      <div className="p-3">
        <h4 className="line-clamp-2 text-sm font-medium leading-snug">{resource.title}</h4>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{getDomain(resource.url)}</span>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
            Watch Video
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ResourceCard({ resource, onOpenSource }: ResourceCardProps) {
  if (resource.video) {
    return <VideoCard resource={resource} onOpenSource={onOpenSource} />
  }
  return <ArticleCard resource={resource} onOpenSource={onOpenSource} />
}
