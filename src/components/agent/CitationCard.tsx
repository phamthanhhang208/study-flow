import { ExternalLink, Globe } from "lucide-react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import type { Citation } from "../../lib/api/types"

interface CitationCardProps {
  citation: Citation
  index: number
  onViewSource: (citation: Citation) => void
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).origin
    return `${domain}/favicon.ico`
  } catch {
    return ""
  }
}

export function CitationCard({ citation, index, onViewSource }: CitationCardProps) {
  return (
    <div
      id={`citation-${index}`}
      className="group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
    >
      <Badge
        variant="default"
        className="mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full p-0 text-xs font-bold"
      >
        {index}
      </Badge>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          className="text-left text-sm font-medium leading-snug text-foreground hover:text-primary transition-colors"
          onClick={() => onViewSource(citation)}
        >
          {citation.title}
        </button>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          {getFaviconUrl(citation.url) ? (
            <img
              src={getFaviconUrl(citation.url)}
              alt=""
              className="h-3.5 w-3.5 rounded"
              onError={(e) => {
                e.currentTarget.style.display = "none"
                e.currentTarget.nextElementSibling?.classList.remove("hidden")
              }}
            />
          ) : null}
          <Globe className={`h-3 w-3 ${getFaviconUrl(citation.url) ? "hidden" : ""}`} />
          <span className="truncate">{getDomain(citation.url)}</span>
        </div>
        {citation.snippet && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {citation.snippet}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-0.5 h-7 shrink-0 gap-1 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => onViewSource(citation)}
      >
        View Source
        <ExternalLink className="h-3 w-3" />
      </Button>
    </div>
  )
}
