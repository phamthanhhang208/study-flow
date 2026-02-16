import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, ChevronDown, Brain } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { SectionAccordion } from "./SectionAccordion"
import { AgentThinkingDisplay } from "../agent/AgentThinkingDisplay"
import type { LearningPath, AgentStep, Citation, VideoMetadata } from "../../lib/api/types"

interface TopicExplorerCardProps {
  topic: string
  learningPath: LearningPath | null
  agentSteps: AgentStep[]
  isLoading: boolean
  onToggleSection: (sectionId: string) => void
  onOpenSource: (citation: Citation, video?: VideoMetadata) => void
}

export function TopicExplorerCard({
  topic,
  learningPath,
  agentSteps,
  isLoading,
  onToggleSection,
  onOpenSource,
}: TopicExplorerCardProps) {
  const [showReasoning, setShowReasoning] = useState(false)

  // Loading state — show AgentThinkingDisplay as the sole loading indicator
  if (isLoading && !learningPath) {
    return (
      <div className="w-full max-w-4xl">
        <h2 className="mb-6 text-2xl font-bold">{topic}</h2>
        <AgentThinkingDisplay isThinking={isLoading} steps={agentSteps} />
      </div>
    )
  }

  // Empty state
  if (!learningPath) {
    return (
      <div className="flex w-full max-w-4xl flex-col items-center py-12 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="mt-4 text-xl font-semibold">{topic}</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Ask a question about this topic to generate a learning path with sections and resources.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      className="w-full max-w-4xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{learningPath.topic}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {learningPath.summary}
        </p>
      </div>

      {/* Agent reasoning (collapsible) */}
      {agentSteps.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-between p-0 hover:bg-transparent"
              onClick={() => setShowReasoning(!showReasoning)}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Brain className="h-4 w-4 text-muted-foreground" />
                Agent's Reasoning
                <span className="text-xs text-muted-foreground">
                  ({agentSteps.length} step{agentSteps.length !== 1 ? "s" : ""})
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${showReasoning ? "rotate-180" : ""}`}
              />
            </Button>
          </CardHeader>
          <AnimatePresence>
            {showReasoning && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {agentSteps.map((step) => (
                      <div key={step.stepNumber} className="flex items-start gap-3 text-sm">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {step.stepNumber}
                        </div>
                        <div>
                          <span
                            className={
                              step.status === "complete"
                                ? "text-foreground"
                                : step.status === "running"
                                  ? "text-primary"
                                  : step.status === "error"
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                            }
                          >
                            {step.label}
                          </span>
                          {step.detail && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Sections */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Learning Path
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {learningPath.sections.length} section{learningPath.sections.length !== 1 ? "s" : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <SectionAccordion
            sections={learningPath.sections}
            onToggle={onToggleSection}
            onOpenSource={onOpenSource}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
