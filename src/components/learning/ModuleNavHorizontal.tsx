import { useEffect, useRef } from "react"
import { Clock, Circle } from "lucide-react"
import { cn } from "../../lib/utils/cn"
import type { LearningPath } from "../../lib/api/types"

interface ModuleNavHorizontalProps {
  path: LearningPath
  activeModuleId: string
  onSelect: (id: string) => void
}

export function ModuleNavHorizontal({ path, activeModuleId, onSelect }: ModuleNavHorizontalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      const card = activeRef.current
      const containerRect = container.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()

      if (cardRect.left < containerRect.left || cardRect.right > containerRect.right) {
        card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
      }
    }
  }, [activeModuleId])

  return (
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin"
      role="tablist"
      aria-label="Learning modules"
    >
      {path.subModules.map((mod) => {
        const isActive = mod.id === activeModuleId
        return (
          <button
            key={mod.id}
            ref={isActive ? activeRef : undefined}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(mod.id)}
            className={cn(
              "group flex w-56 shrink-0 flex-col rounded-lg border-2 p-4 text-left transition-all",
              isActive
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                : "border-border hover:border-blue-300 hover:bg-accent/50",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Circle className={cn("h-4 w-4", isActive ? "text-blue-500" : "text-muted-foreground/50")} />
                <span
                  className={cn(
                    "text-xs font-medium uppercase tracking-wide",
                    isActive ? "text-blue-500" : "text-muted-foreground",
                  )}
                >
                  Module {mod.order}
                </span>
              </div>
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1 text-xs",
                  isActive ? "text-blue-500/80" : "text-muted-foreground",
                )}
              >
                <Clock className="h-3 w-3" />
                {mod.estimatedMinutes} min
              </span>
            </div>

            <h4
              className={cn(
                "mt-2 line-clamp-2 text-sm font-semibold leading-snug",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-foreground",
              )}
            >
              {mod.title}
            </h4>

            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {mod.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}
