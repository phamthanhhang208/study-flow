import { Send } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"

interface InputBarProps {
  onSubmit: (query: string) => void
  isLoading: boolean
}

export function InputBar({ onSubmit, isLoading }: InputBarProps) {
  const [value, setValue] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSubmit(trimmed)
    setValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t bg-background p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What do you want to learn about?"
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={!value.trim() || isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
