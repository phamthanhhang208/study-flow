import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { useSearch, useContentFetch } from "../lib/query"
import { useAgentStream } from "../hooks/useAgentStream"
import { detectVideo } from "../lib/utils/video"

export function ApiTestPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [agentQuery, setAgentQuery] = useState("")
  const [contentUrl, setContentUrl] = useState("")
  const [activeContentUrl, setActiveContentUrl] = useState("")

  const search = useSearch(activeSearch)
  const content = useContentFetch(activeContentUrl ? [activeContentUrl] : [])
  const agent = useAgentStream()

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <h1 className="text-2xl font-bold">API Test Page</h1>

      {/* Search API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Search API
            <Badge variant="outline">GET /v1/search</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setActiveSearch(searchQuery)}
            />
            <Button onClick={() => setActiveSearch(searchQuery)} disabled={!searchQuery}>
              Search
            </Button>
          </div>

          {search.isLoading && <p className="text-sm text-muted-foreground">Searching...</p>}
          {search.error && (
            <p className="text-sm text-destructive">Error: {(search.error as Error).message}</p>
          )}
          {search.data && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {search.data.results.web.length} results in {search.data.metadata.latency}ms
              </p>
              {search.data.results.web.slice(0, 5).map((result, i) => (
                <div key={i} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.title}</span>
                    {result.video && (
                      <Badge variant="secondary">{result.video.provider}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{result.url}</p>
                  <p className="mt-1 text-xs">{result.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Agent Streaming API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Agent Streaming API
            <Badge variant="outline">POST /v1/agents/runs (SSE)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask the agent..."
              value={agentQuery}
              onChange={(e) => setAgentQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && agent.startStream(agentQuery)}
            />
            <Button
              onClick={() => agent.startStream(agentQuery)}
              disabled={!agentQuery || agent.isStreaming}
            >
              {agent.isStreaming ? "Streaming..." : "Ask"}
            </Button>
            {agent.isStreaming && (
              <Button variant="outline" onClick={agent.stopStream}>
                Stop
              </Button>
            )}
          </div>

          {agent.error && (
            <p className="text-sm text-destructive">Error: {agent.error}</p>
          )}

          {agent.events.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Events received: {agent.events.length}
                {agent.runtimeMs && ` | Runtime: ${agent.runtimeMs}ms`}
              </p>
              <div className="flex flex-wrap gap-1">
                {agent.events.map((event, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {agent.content && (
            <div className="rounded-md border bg-muted/50 p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Response:</p>
              <p className="whitespace-pre-wrap text-sm">{agent.content}</p>
            </div>
          )}

          {agent.citations.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Citations:</p>
              {agent.citations.map((cite, i) => (
                <div key={i} className="rounded border p-2 text-xs">
                  <span className="font-medium">[{i + 1}]</span> {cite.title}{" "}
                  <span className="text-muted-foreground">- {cite.url}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Contents API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Contents API
            <Badge variant="outline">POST /v1/contents</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="URL to fetch..."
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setActiveContentUrl(contentUrl)}
            />
            <Button onClick={() => setActiveContentUrl(contentUrl)} disabled={!contentUrl}>
              Fetch
            </Button>
          </div>

          {content.isLoading && <p className="text-sm text-muted-foreground">Fetching content...</p>}
          {content.error && (
            <p className="text-sm text-destructive">Error: {(content.error as Error).message}</p>
          )}
          {content.data?.[0] && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{content.data[0].title}</p>
              {content.data[0].metadata?.site_name && (
                <Badge variant="secondary">{content.data[0].metadata.site_name}</Badge>
              )}
              {content.data[0].markdown && (
                <div className="max-h-64 overflow-y-auto rounded-md border bg-muted/50 p-3">
                  <pre className="whitespace-pre-wrap text-xs">{content.data[0].markdown.slice(0, 2000)}</pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Video Detection */}
      <Card>
        <CardHeader>
          <CardTitle>Video Detection (client-side)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              "https://youtu.be/dQw4w9WgXcQ",
              "https://www.youtube.com/shorts/dQw4w9WgXcQ",
              "https://vimeo.com/123456789",
              "https://example.com/not-a-video",
            ].map((url) => {
              const video = detectVideo(url)
              return (
                <div key={url} className="flex items-center gap-2">
                  <Badge variant={video ? "default" : "outline"}>
                    {video ? video.provider : "none"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{url}</span>
                  {video && <span className="text-xs">ID: {video.videoId}</span>}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
