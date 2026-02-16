import { motion, AnimatePresence } from "framer-motion"
import { X, Keyboard } from "lucide-react"
import { Button } from "../ui/button"
import { SHORTCUTS } from "../../hooks/useKeyboardShortcuts"

interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
}

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent)

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            className="relative z-10 w-full max-w-sm rounded-xl border bg-background p-6 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {SHORTCUTS.map((shortcut) => {
                const keys = isMac ? shortcut.keys : shortcut.winKeys
                return (
                  <div key={shortcut.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{shortcut.label}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((key) => (
                        <kbd
                          key={key}
                          className="rounded border bg-muted px-2 py-0.5 text-xs font-medium"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
