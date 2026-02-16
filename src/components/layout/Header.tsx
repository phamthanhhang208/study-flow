import { BookOpen, Download, Menu, Settings, Keyboard } from "lucide-react"
import { Button } from "../ui/button"

interface HeaderProps {
  onToggleSidebar: () => void
  onExport?: () => void
  onSettings?: () => void
  onShortcuts?: () => void
}

export function Header({
  onToggleSidebar,
  onExport,
  onSettings,
  onShortcuts,
}: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">StudyFlow</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onExport && (
          <Button variant="ghost" size="icon" onClick={onExport} aria-label="Export session">
            <Download className="h-5 w-5" />
          </Button>
        )}
        {onShortcuts && (
          <Button variant="ghost" size="icon" onClick={onShortcuts} aria-label="Keyboard shortcuts">
            <Keyboard className="h-4 w-4" />
          </Button>
        )}
        {onSettings && (
          <Button variant="ghost" size="icon" onClick={onSettings} aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  )
}
