import { type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils/cn";
import type { QAMessage, Citation } from "../../lib/api/types";

interface MessageBubbleProps {
  message: QAMessage;
  onClickCitation?: (citation: Citation) => void;
}

/**
 * Parse citation references out of text and render them as inline badges.
 * Handles patterns like: [[1]](url), [1](url), [1]
 */
function renderContentWithCitations(
  content: string,
  citations: Citation[] | undefined,
  onClickCitation?: (citation: Citation) => void,
): ReactNode[] {
  // Match [[n]](url), [n](url), or standalone [n]
  const citationRegex = /\[?\[(\d+)\]\]?\(([^)]*)\)|\[(\d+)\]/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const num = parseInt(match[1] || match[3], 10);
    const citation = citations?.[num - 1];

    parts.push(
      <button
        key={`cite-${match.index}`}
        onClick={() => citation && onClickCitation?.(citation)}
        className="mx-0.5 inline-flex items-center rounded bg-primary/15 px-1 py-0.5 align-baseline text-[11px] font-semibold text-primary transition hover:bg-primary/25"
        title={citation?.title}
      >
        [{num}]
      </button>,
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

export function MessageBubble({ message, onClickCitation }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2.5",
          isUser ? "bg-blue-600 text-white" : "bg-muted text-foreground",
        )}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {isUser
            ? message.content
            : renderContentWithCitations(
                message.content,
                message.citations,
                onClickCitation,
              )}
        </div>

        {/* Citations (assistant only) */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/50 pt-2">
            {message.citations.map((citation, i) => (
              <button
                key={i}
                onClick={() => onClickCitation?.(citation)}
                className="inline-flex items-center gap-1 rounded bg-background px-1.5 py-0.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <span className="font-medium">[{i + 1}]</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            "mt-1.5 text-[10px]",
            isUser ? "text-blue-200" : "text-muted-foreground",
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
