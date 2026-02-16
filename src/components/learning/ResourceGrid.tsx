import { FileText, Play } from "lucide-react"
import { motion } from "framer-motion"
import { ResourceCard } from "./ResourceCard"
import type { Resource, Citation, VideoMetadata } from "../../lib/api/types"

interface ResourceGridProps {
  resources: Resource[]
  onOpenSource?: (citation: Citation, video?: VideoMetadata) => void
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
}

export function ResourceGrid({ resources, onOpenSource }: ResourceGridProps) {
  const articles = resources.filter((r) => !r.video)
  const videos = resources.filter((r) => r.video)

  if (resources.length === 0) return null

  return (
    <div className="space-y-5">
      {articles.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Articles</span>
            <span className="text-xs">({articles.length})</span>
          </div>
          <motion.div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {articles.map((resource, i) => (
              <motion.div key={i} variants={item}>
                <ResourceCard resource={resource} onOpenSource={onOpenSource} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Play className="h-4 w-4" />
            <span>Videos</span>
            <span className="text-xs">({videos.length})</span>
          </div>
          <motion.div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {videos.map((resource, i) => (
              <motion.div key={i} variants={item}>
                <ResourceCard resource={resource} onOpenSource={onOpenSource} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  )
}
