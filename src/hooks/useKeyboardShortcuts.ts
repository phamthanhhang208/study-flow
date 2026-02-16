import { useEffect, useCallback } from "react"

export interface ShortcutActions {
  onFocusInput: () => void
  onExport: () => void
  onNewTopic: () => void
  onToggleHelp: () => void
}

export const SHORTCUTS = [
  { keys: ["⌘", "K"], label: "Focus input", winKeys: ["Ctrl", "K"] },
  { keys: ["⌘", "E"], label: "Export session", winKeys: ["Ctrl", "E"] },
  { keys: ["⌘", "N"], label: "New topic", winKeys: ["Ctrl", "N"] },
  { keys: ["⌘", "/"], label: "Show shortcuts", winKeys: ["Ctrl", "/"] },
  { keys: ["Esc"], label: "Close modals", winKeys: ["Esc"] },
] as const

export function useKeyboardShortcuts(actions: ShortcutActions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      // Don't capture if in a non-shortcut input scenario
      const target = e.target as HTMLElement
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA"

      if (mod && e.key === "k") {
        e.preventDefault()
        actions.onFocusInput()
        return
      }

      if (mod && e.key === "e") {
        e.preventDefault()
        actions.onExport()
        return
      }

      if (mod && e.key === "n") {
        e.preventDefault()
        actions.onNewTopic()
        return
      }

      if (mod && e.key === "/") {
        e.preventDefault()
        actions.onToggleHelp()
        return
      }

      // Escape only when not typing in an input
      if (e.key === "Escape" && !isInput) {
        // This is handled by individual modals
      }
    },
    [actions],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}
