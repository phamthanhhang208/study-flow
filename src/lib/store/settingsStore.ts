import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "light" | "dark" | "system"

interface SettingsState {
  apiKey: string
  theme: Theme

  setApiKey: (key: string) => void
  setTheme: (theme: Theme) => void
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.toggle("dark", prefersDark)
  } else {
    root.classList.toggle("dark", theme === "dark")
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: "",
      theme: "system" as Theme,

      setApiKey: (apiKey) => set({ apiKey }),

      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
    }),
    {
      name: "studyflow-settings",
      onRehydrate: () => {
        return (state) => {
          if (state) applyTheme(state.theme)
        }
      },
    },
  ),
)
