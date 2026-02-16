import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"

interface SourceReaderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  url: string
}

export function SourceReaderModal({ open, onOpenChange, title, url }: SourceReaderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <iframe src={url} className="h-[70vh] w-full rounded-md border" title={title} />
      </DialogContent>
    </Dialog>
  )
}
