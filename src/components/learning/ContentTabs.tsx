import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { DeepExplanation } from "./DeepExplanation"
import { MediaResourcesGrid } from "./MediaResourcesGrid"
import type { SubModule, Citation, VideoResource } from "../../lib/api/types"

interface ContentTabsProps {
  module: SubModule
  citations: Citation[]
  onCitationClick?: (index: number) => void
  onWatchVideo: (video: VideoResource) => void
}

export function ContentTabs({ module, citations, onCitationClick, onWatchVideo }: ContentTabsProps) {
  return (
    <Tabs defaultValue="explanation" className="w-full">
      <TabsList className="w-full justify-start px-0">
        <TabsTrigger value="explanation">Deep Explanation</TabsTrigger>
        <TabsTrigger value="media">
          Media Resources
          {module.videos.length > 0 && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal">
              {module.videos.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="explanation">
        <DeepExplanation
          module={module}
          citations={citations}
          onCitationClick={onCitationClick}
        />
      </TabsContent>

      <TabsContent value="media">
        <MediaResourcesGrid
          videos={module.videos}
          onWatch={onWatchVideo}
        />
      </TabsContent>
    </Tabs>
  )
}
