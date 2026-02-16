import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { Components } from "react-markdown"

interface MarkdownRendererProps {
  content: string
  onCitationClick?: (index: number) => void
}

export function MarkdownRenderer({ content, onCitationClick }: MarkdownRendererProps) {
  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "")
      const codeString = String(children).replace(/\n$/, "")

      if (match) {
        return (
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            className="rounded-lg text-sm"
          >
            {codeString}
          </SyntaxHighlighter>
        )
      }

      return (
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...props}>
          {children}
        </code>
      )
    },
    a({ href, children, ...props }) {
      // Check if this is a citation link like [1], [2]
      const text = String(children)
      const citationMatch = /^\[(\d+)\]$/.exec(text)
      if (citationMatch && onCitationClick) {
        const index = parseInt(citationMatch[1], 10)
        return (
          <button
            type="button"
            className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-primary/10 px-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            onClick={(e) => {
              e.preventDefault()
              onCitationClick(index)
            }}
          >
            {index}
          </button>
        )
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
          {...props}
        >
          {children}
        </a>
      )
    },
    table({ children, ...props }) {
      return (
        <div className="my-4 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm" {...props}>
            {children}
          </table>
        </div>
      )
    },
    th({ children, ...props }) {
      return (
        <th className="border-b bg-muted/50 px-4 py-2 text-left font-medium" {...props}>
          {children}
        </th>
      )
    },
    td({ children, ...props }) {
      return (
        <td className="border-b px-4 py-2" {...props}>
          {children}
        </td>
      )
    },
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  )
}
