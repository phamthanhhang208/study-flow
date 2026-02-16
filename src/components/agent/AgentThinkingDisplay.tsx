import { Loader2 } from "lucide-react"

interface AgentThinkingDisplayProps {
  isThinking: boolean
  message?: string
}

export function AgentThinkingDisplay({ isThinking, message }: AgentThinkingDisplayProps) {
  if (!isThinking) return null

  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{message || "Thinking..."}</span>
    </div>
  )
}
