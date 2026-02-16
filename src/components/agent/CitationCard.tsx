import { ExternalLink } from "lucide-react"
import { Badge } from "../ui/badge"

interface CitationCardProps {
  index: number
  title: string
  url: string
}

export function CitationCard({ index, title, url }: CitationCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-accent"
    >
      <Badge variant="secondary" className="shrink-0">{index}</Badge>
      <span className="truncate">{title}</span>
      <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
    </a>
  )
}
