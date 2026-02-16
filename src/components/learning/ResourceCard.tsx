import { ExternalLink, Play } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Badge } from "../ui/badge"
import type { Resource } from "../../lib/api/types"

interface ResourceCardProps {
  resource: Resource
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-sm font-medium">{resource.title}</CardTitle>
              {resource.video && (
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <Play className="h-3 w-3" />
                  {resource.video.provider}
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1 text-xs">{resource.snippet}</CardDescription>
          </div>
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CardHeader>
    </Card>
  )
}
