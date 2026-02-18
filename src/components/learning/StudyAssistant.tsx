import { useState, useRef, useEffect, useMemo } from "react";
import {
  MessageSquare,
  ExternalLink,
  Send,
  Loader2,
  Download,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { MessageBubble } from "./MessageBubble";
import { generateSuggestedQuestions } from "../../lib/api/tutorAgent";
import { downloadConversation } from "../../lib/export";
import type { Citation, SubModule, ModuleConversation } from "../../lib/api/types";

interface StudyAssistantProps {
  moduleId: string;
  module: SubModule;
  conversation: ModuleConversation | undefined;
  isAnswering: boolean;
  tutorError: string | null;
  onAskQuestion: (question: string) => void;
  onClearConversation: (moduleId: string) => void;
  onViewCitation?: (citation: Citation) => void;
}

export function StudyAssistant({
  moduleId,
  module,
  conversation,
  isAnswering,
  tutorError,
  onAskQuestion,
  onClearConversation,
  onViewCitation,
}: StudyAssistantProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(
    () => conversation?.messages || [],
    [conversation?.messages],
  );

  // Collect unique citations from assistant messages
  const allCitations = useMemo(() => {
    const seen = new Set<string>();
    return messages
      .filter((m) => m.role === "assistant")
      .flatMap((m) => m.citations || [])
      .filter((c) => {
        if (seen.has(c.url)) return false;
        seen.add(c.url);
        return true;
      });
  }, [messages]);

  // Suggested questions when conversation is empty
  const suggestedQuestions = useMemo(
    () => (messages.length === 0 ? generateSuggestedQuestions(module) : []),
    [messages.length, module],
  );

  // Last assistant message's follow-ups
  const lastFollowUps = useMemo(() => {
    if (messages.length === 0) return [];
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    return lastAssistant?.suggestedFollowUps || [];
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isAnswering]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isAnswering) return;
    onAskQuestion(trimmed);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Study Assistant</h3>
        <div className="ml-auto flex items-center gap-1">
          {conversation && messages.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() =>
                  downloadConversation(conversation, module.title)
                }
                title="Export conversation"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onClearConversation(moduleId)}
                title="Clear conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <span className="h-2 w-2 rounded-full bg-green-500" title="Online" />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div>
            {/* Greeting */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                Ask me anything about{" "}
                <strong className="text-foreground">{module.title}</strong>!
              </p>
            </div>

            {/* Suggested questions */}
            {suggestedQuestions.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs text-muted-foreground">
                  Suggested questions:
                </p>
                <div className="space-y-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      className="w-full rounded-lg border p-2.5 text-left text-sm transition hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                      onClick={() => setInput(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onClickCitation={onViewCitation}
              />
            ))}

            {/* Follow-up suggestions */}
            {lastFollowUps.length > 0 && !isAnswering && (
              <div className="space-y-1.5 pt-1">
                {lastFollowUps.map((q, i) => (
                  <button
                    key={i}
                    className="w-full rounded-md border border-dashed px-2.5 py-1.5 text-left text-xs text-muted-foreground transition hover:border-blue-300 hover:text-foreground"
                    onClick={() => setInput(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {isAnswering && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}

        {/* Error state */}
        {tutorError && (
          <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {tutorError}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question..."
            disabled={isAnswering}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isAnswering}
            aria-label="Send question"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Powered by You.com Agentic Search API
        </p>
      </div>

      {/* Key Citations */}
      {allCitations.length > 0 && (
        <div className="border-t bg-indigo-950/90 px-4 py-3 dark:bg-indigo-950/60">
          <h4 className="mb-2 text-xs font-semibold text-indigo-200">
            Key Citations
          </h4>
          <ol className="space-y-1.5">
            {allCitations.map((c, i) => (
              <li key={i} className="flex items-center gap-1">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-800 text-[9px] font-bold text-indigo-200">
                  {i + 1}
                </span>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-w-0 flex-1 items-center gap-1 text-xs text-indigo-300 hover:text-indigo-100"
                >
                  <span className="truncate">{c.title}</span>
                  <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
