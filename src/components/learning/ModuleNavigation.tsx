import { useEffect, useRef } from "react"
import { Clock } from "lucide-react"
import { cn } from "../../lib/utils"
import type { LearningPath } from "../../lib/api/types"

interface ModuleNavigationProps {
  path: LearningPath
  activeModuleId: string
  onSelect: (id: string) => void
}

export function ModuleNavigation({ path, activeModuleId, onSelect }: ModuleNavigationProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  // Smooth scroll to active module when it changes
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      const card = activeRef.current
      const containerRect = container.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()

      // Only scroll if the card is not fully visible
      if (cardRect.left < containerRect.left || cardRect.right > containerRect.right) {
        card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
      }
    }
  }, [activeModuleId])

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin"
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
              "group flex w-56 shrink-0 flex-col rounded-lg border-2 p-4 text-left transition-colors",
              isActive
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:border-primary/40 hover:bg-accent/50",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "text-xs font-medium uppercase tracking-wide",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                Module {mod.order}
              </span>
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1 text-xs",
                  isActive ? "text-primary/80" : "text-muted-foreground",
                )}
              >
                <Clock className="h-3 w-3" />
                {mod.estimatedMinutes} min
              </span>
            </div>

            <h4
              className={cn(
                "mt-2 line-clamp-2 text-sm font-semibold leading-snug",
                isActive ? "text-primary" : "text-foreground",
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
