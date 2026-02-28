import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { DeepExplanation } from "./DeepExplanation"
import { MediaResourcesGrid } from "./MediaResourcesGrid"
import { KnowledgeCheck } from "./KnowledgeCheck"
import type { SubModule, Citation, VideoResource } from "../../lib/api/types"
import type { Quiz } from "../../lib/api/quizGenerator"
import type { AnswerRecord } from "../../lib/store/studyStore"

interface ContentTabsProps {
  module: SubModule
  citations: Citation[]
  onCitationClick?: (index: number) => void
  onWatchVideo: (video: VideoResource) => void
  // Quiz
  quiz: Quiz | null
  isGeneratingQuiz: boolean
  bestAttempt?: { score: number; total: number }
  onStartQuiz: () => void
  onCompleteQuiz: (score: number, total: number, answers: AnswerRecord[]) => void
}

export function ContentTabs({
  module,
  citations,
  onCitationClick,
  onWatchVideo,
  quiz,
  isGeneratingQuiz,
  bestAttempt,
  onStartQuiz,
  onCompleteQuiz,
}: ContentTabsProps) {
  const questionCount = quiz?.questions.length ?? 0

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
        <TabsTrigger value="quiz">
          Knowledge Check
          {questionCount > 0 && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal">
              {questionCount}
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

      <TabsContent value="quiz">
        <KnowledgeCheck
          moduleId={module.id}
          moduleTitle={module.title}
          moduleContent={module.description}
          quiz={quiz}
          isGenerating={isGeneratingQuiz}
          bestAttempt={bestAttempt}
          onStart={onStartQuiz}
          onComplete={onCompleteQuiz}
        />
      </TabsContent>
    </Tabs>
  )
}
