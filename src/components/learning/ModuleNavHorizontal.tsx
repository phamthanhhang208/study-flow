import { useEffect, useRef } from "react"
import { Clock, Circle, CheckCircle2 } from "lucide-react"
import { cn } from "../../lib/utils/cn"
import { Progress } from "../ui/progress"
import type { LearningPath } from "../../lib/api/types"

interface ModuleNavHorizontalProps {
  path: LearningPath
  activeModuleId: string
  completedModuleIds: Set<string>
  onSelect: (id: string) => void
  onToggleComplete: (moduleId: string) => void
}

export function ModuleNavHorizontal({
  path,
  activeModuleId,
  completedModuleIds,
  onSelect,
  onToggleComplete,
}: ModuleNavHorizontalProps) {
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

  const totalModules = path.subModules.length
  const completedCount = path.subModules.filter((m) => completedModuleIds.has(m.id)).length
  const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <Progress value={progressPercent} className="flex-1 [&>div]:bg-green-500" />
        <span className="shrink-0 text-xs text-muted-foreground">
          {completedCount} / {totalModules} modules completed
        </span>
      </div>

      {/* Module cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin"
        role="tablist"
        aria-label="Learning modules"
      >
        {path.subModules.map((mod) => {
          const isActive = mod.id === activeModuleId
          const isComplete = completedModuleIds.has(mod.id)
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
                  : isComplete
                  ? "border-green-500/50 bg-green-50/40 hover:border-green-500/80 dark:bg-green-950/10"
                  : "border-border hover:border-blue-300 hover:bg-accent/50",
              )}
            >
              {/* Top row: module label + time */}
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "text-xs font-medium uppercase tracking-wide",
                    isActive
                      ? "text-blue-500"
                      : isComplete
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground",
                  )}
                >
                  Module {mod.order}
                </span>
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

              {/* Title */}
              <h4
                className={cn(
                  "mt-2 line-clamp-2 text-sm font-semibold leading-snug",
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : isComplete
                    ? "text-green-700 dark:text-green-300"
                    : "text-foreground",
                )}
              >
                {mod.title}
              </h4>

              {/* Description */}
              <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                {mod.description}
              </p>

              {/* Toggle checkbox */}
              <button
                type="button"
                aria-label={isComplete ? "Mark incomplete" : "Mark complete"}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleComplete(mod.id)
                }}
                className={cn(
                  "mt-3 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  isComplete
                    ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0" />
                )}
                {isComplete ? "Completed" : "Mark complete"}
              </button>
            </button>
          )
        })}
      </div>
    </div>
  )
}
