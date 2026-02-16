import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card"
import type { StudySession } from "../../lib/api/types"

interface SessionCardProps {
  session: StudySession
  isActive: boolean
  onClick: () => void
}

export function SessionCard({ session, isActive, onClick }: SessionCardProps) {
  const sectionCount = session.learningPath?.sections.length ?? 0
  const responseCount = session.responses.length

  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-md ${isActive ? "border-primary" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium leading-tight">{session.topic}</CardTitle>
        <CardDescription className="text-xs">
          {sectionCount > 0 && `${sectionCount} section${sectionCount !== 1 ? "s" : ""}`}
          {sectionCount > 0 && responseCount > 0 && " · "}
          {responseCount > 0 && `${responseCount} Q&A`}
          {sectionCount === 0 && responseCount === 0 && "New topic"}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
