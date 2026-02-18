import { Play, Search } from "lucide-react"
import type { VideoResource } from "../../lib/api/types"

interface MediaResourcesGridProps {
  videos: VideoResource[]
  onWatch: (video: VideoResource) => void
}

export function MediaResourcesGrid({ videos, onWatch }: MediaResourcesGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {videos.map((video) => (
        <button
          key={video.id}
          onClick={() => onWatch(video)}
          className="group overflow-hidden rounded-lg border text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          {/* Thumbnail */}
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Play className="h-8 w-8 text-muted-foreground/40" />
              </div>
            )}
            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
              <div className="rounded-full bg-white/90 p-2 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                <Play className="h-5 w-5 text-foreground" fill="currentColor" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <h4 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
              {video.title}
            </h4>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={
                  video.platform === "youtube"
                    ? "font-medium text-red-500"
                    : "font-medium text-blue-500"
                }
              >
                {video.platform === "youtube" ? "YouTube" : "Vimeo"}
              </span>
              {video.duration && (
                <>
                  <span>·</span>
                  <span>{video.duration}</span>
                </>
              )}
              {video.channelName && (
                <>
                  <span>·</span>
                  <span className="truncate">{video.channelName}</span>
                </>
              )}
            </div>
          </div>
        </button>
      ))}

      {/* Empty state / find more card */}
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center">
        <Search className="h-8 w-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Find more resources
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          via You.com Search API
        </p>
      </div>
    </div>
  )
}
