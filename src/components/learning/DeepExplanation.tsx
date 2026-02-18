import type { SubModule, Citation } from "../../lib/api/types"

interface DeepExplanationProps {
  module: SubModule
  citations: Citation[]
  onCitationClick?: (index: number) => void
}

export function DeepExplanation({ module, citations, onCitationClick }: DeepExplanationProps) {
  return (
    <div className="space-y-6">
      {/* Module header */}
      <div>
        <h1 className="text-3xl font-bold leading-tight">{module.title}</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          {module.description}
        </p>
      </div>

      {/* Articles as rich content */}
      {module.articles.length > 0 && (
        <div className="space-y-6">
          {module.articles.map((article, i) => (
            <div key={article.id} className="space-y-2">
              <h3 className="text-lg font-semibold leading-snug">
                {article.title}
                <button
                  onClick={() => onCitationClick?.(i)}
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary align-super hover:bg-primary/20 transition-colors"
                  aria-label={`Citation ${i + 1}`}
                >
                  {i + 1}
                </button>
              </h3>
              <p className="text-base leading-7 text-foreground/90">
                {article.snippet || article.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {article.domain}
                {article.publishedDate && ` · ${article.publishedDate}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Key concepts from module search query */}
      <div className="rounded-lg border-l-4 border-primary/30 bg-muted/30 p-4">
        <p className="text-sm font-medium text-muted-foreground">Key Focus</p>
        <p className="mt-1 text-sm italic text-foreground/80">
          {module.searchQuery}
        </p>
      </div>

      {/* Citations reference list */}
      {citations.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">References</h4>
          <ol className="space-y-1.5 text-xs text-muted-foreground">
            {citations.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 font-mono text-primary">[{i + 1}]</span>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:text-primary hover:underline"
                >
                  {c.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Inspiration quote */}
      <div className="border-t pt-6 text-center">
        <p className="text-sm italic text-muted-foreground">
          "The best way to learn is to flow with the knowledge."
        </p>
      </div>
    </div>
  )
}
