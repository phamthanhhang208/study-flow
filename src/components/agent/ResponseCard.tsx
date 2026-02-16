import ReactMarkdown from "react-markdown"
import { Card, CardContent } from "../ui/card"

interface ResponseCardProps {
  content: string
}

export function ResponseCard({ content }: ResponseCardProps) {
  return (
    <Card>
      <CardContent className="prose prose-sm max-w-none pt-6 dark:prose-invert">
        <ReactMarkdown>{content}</ReactMarkdown>
      </CardContent>
    </Card>
  )
}
