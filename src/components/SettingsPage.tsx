import { useState } from "react"
import { Settings, Key, Palette, Download, Trash2, Info, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Separator } from "./ui/separator"
import { useSettingsStore } from "../lib/store/settingsStore"
import { useStudyStore } from "../lib/store/studyStore"
import { exportAllSessions } from "../lib/export"

export function SettingsPage() {
  const settings = useSettingsStore()
  const studyStore = useStudyStore()
  const [showKey, setShowKey] = useState(false)
  const [keyInput, setKeyInput] = useState(settings.apiKey)
  const [confirmClear, setConfirmClear] = useState(false)

  const handleSaveKey = () => {
    settings.setApiKey(keyInput)
    toast.success("API key saved")
  }

  const handleExportAll = () => {
    if (studyStore.sessions.length === 0) {
      toast.error("No sessions to export")
      return
    }
    exportAllSessions(studyStore.sessions)
    toast.success("All sessions exported")
  }

  const handleClearData = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
      return
    }
    // Clear all sessions
    for (const session of studyStore.sessions) {
      studyStore.deleteSession(session.id)
    }
    setConfirmClear(false)
    toast.success("All data cleared")
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            API Key
          </CardTitle>
          <CardDescription>
            Your You.com API key for search and agent features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Enter your You.com API key"
                className="pr-10"
                aria-label="API key"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0.5 top-1/2 h-8 w-8 -translate-y-1/2"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={handleSaveKey} disabled={keyInput === settings.apiKey}>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Theme
          </CardTitle>
          <CardDescription>Choose your preferred color scheme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((theme) => (
              <Button
                key={theme}
                variant={settings.theme === theme ? "default" : "outline"}
                size="sm"
                className="capitalize"
                onClick={() => settings.setTheme(theme)}
              >
                {theme}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            Data
          </CardTitle>
          <CardDescription>Export or manage your study data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full gap-2" onClick={handleExportAll}>
            <Download className="h-4 w-4" />
            Export all sessions ({studyStore.sessions.length})
          </Button>
          <Separator />
          <Button
            variant={confirmClear ? "destructive" : "outline"}
            className="w-full gap-2"
            onClick={handleClearData}
          >
            <Trash2 className="h-4 w-4" />
            {confirmClear ? "Click again to confirm" : "Clear all data"}
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p><strong>StudyFlow</strong> — AI-powered learning companion</p>
            <p>Built with React, TypeScript, Tailwind CSS, and the You.com API.</p>
            <p className="text-xs">Version 0.1.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
