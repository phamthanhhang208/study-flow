import { BookOpen, FlaskConical, Menu, Moon, Sun } from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"

interface HeaderProps {
  onToggleSidebar: () => void
  onToggleTest?: () => void
  showTestPage?: boolean
}

export function Header({ onToggleSidebar, onToggleTest, showTestPage }: HeaderProps) {
  const [dark, setDark] = useState(false)

  const toggleTheme = () => {
    setDark(!dark)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">StudyFlow</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onToggleTest && (
          <Button variant={showTestPage ? "secondary" : "ghost"} size="icon" onClick={onToggleTest} title="API Test Page">
            <FlaskConical className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  )
}
