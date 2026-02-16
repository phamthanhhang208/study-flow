import { motion } from "framer-motion"
import { Loader2, Check, AlertCircle, Brain, Search, Calculator, CheckCircle2 } from "lucide-react"
import type { AgentStep, AgentStepType } from "../../lib/api/types"

interface AgentThinkingDisplayProps {
  isThinking: boolean
  steps: AgentStep[]
}

function StepTypeIcon({ type, isActive }: { type: AgentStepType; isActive: boolean }) {
  const baseClass = "h-4 w-4"
  const activeClass = isActive ? "text-primary" : "text-muted-foreground"

  switch (type) {
    case "thinking":
      return <Brain className={`${baseClass} ${activeClass}`} />
    case "research":
      return <Search className={`${baseClass} ${activeClass}`} />
    case "compute":
      return <Calculator className={`${baseClass} ${activeClass}`} />
    case "complete":
      return <CheckCircle2 className={`${baseClass} text-green-500`} />
  }
}

function StepStatusIndicator({ status }: { status: AgentStep["status"] }) {
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
  if (status === "complete") return <Check className="h-3.5 w-3.5 text-green-500" />
  if (status === "error") return <AlertCircle className="h-3.5 w-3.5 text-destructive" />
  return <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
}

export function AgentThinkingDisplay({ isThinking, steps }: AgentThinkingDisplayProps) {
  if (!isThinking && steps.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-muted/50 p-4"
    >
      {steps.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Thinking...</span>
        </div>
      ) : (
        <div className="relative space-y-0">
          {/* Vertical timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

          {steps.map((step, i) => {
            const isActive = step.status === "running"

            return (
              <motion.div
                key={step.stepNumber}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`relative flex items-start gap-3 py-2 ${isActive ? "z-10" : ""}`}
              >
                {/* Timeline node */}
                <div
                  className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background ${
                    isActive
                      ? "border-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]"
                      : step.status === "complete"
                        ? "border-green-500/30"
                        : step.status === "error"
                          ? "border-destructive/30"
                          : "border-border"
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  )}
                  <StepTypeIcon type={step.type} isActive={isActive} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${
                        isActive
                          ? "font-medium text-foreground"
                          : step.status === "complete"
                            ? "text-muted-foreground"
                            : step.status === "error"
                              ? "text-destructive"
                              : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                    <StepStatusIndicator status={step.status} />
                  </div>
                  {step.detail && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
                  )}
                </div>
              </motion.div>
            )
          })}

          {/* Processing indicator when between steps */}
          {isThinking && steps.every((s) => s.status !== "running") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative flex items-center gap-3 py-2"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Processing...</span>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  )
}
