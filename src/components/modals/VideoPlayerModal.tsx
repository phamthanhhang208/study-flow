import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { getYouTubeEmbedUrl } from "../../lib/utils/video"

interface VideoPlayerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  videoId: string
}

export function VideoPlayerModal({ open, onOpenChange, title, videoId }: VideoPlayerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video">
          <iframe
            src={getYouTubeEmbedUrl(videoId)}
            className="h-full w-full rounded-md"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
