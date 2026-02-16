import { motion } from "framer-motion"
import { BookOpen, Sparkles } from "lucide-react"

interface WelcomeScreenProps {
  onSelectTopic: (topic: string) => void
}

const EXAMPLE_TOPICS = [
  "How does machine learning work?",
  "Rust programming language",
  "History of the Internet",
  "Quantum computing basics",
  "How to build a REST API",
  "Introduction to calculus",
]

export function WelcomeScreen({ onSelectTopic }: WelcomeScreenProps) {
  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <BookOpen className="h-14 w-14 text-muted-foreground/40" />
      <h2 className="mt-5 text-2xl font-semibold">Welcome to StudyFlow</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Ask any question to start learning. StudyFlow will research the topic,
        organize information, and create a structured study guide for you.
      </p>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Try one of these</span>
        </div>
        <div className="flex max-w-lg flex-wrap justify-center gap-2">
          {EXAMPLE_TOPICS.map((topic, i) => (
            <motion.button
              key={topic}
              type="button"
              className="rounded-full border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => onSelectTopic(topic)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              {topic}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
