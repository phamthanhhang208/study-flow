import { Send, Square } from "lucide-react";
import {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  type FormEvent,
} from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface InputBarProps {
  onSubmit: (query: string) => void;
  onStop?: () => void;
  isLoading: boolean;
}

export interface InputBarRef {
  focus: () => void;
}

export const InputBar = forwardRef<InputBarRef, InputBarProps>(
  function InputBar({ onSubmit, onStop, isLoading }, ref) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    const handleSubmit = (e?: FormEvent) => {
      e?.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || isLoading) return;
      onSubmit(trimmed);
      setValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Enter to submit (without shift)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
        return;
      }
      // Cmd/Ctrl+Enter also submits
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    };

    return (
      <form onSubmit={handleSubmit} className="border-t bg-background p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading ? "Thinking..." : "What do you want to learn about?"
            }
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
            disabled={isLoading}
            aria-label="Ask a question"
          />
          {isLoading ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={onStop}
              aria-label="Stop"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!value.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="mx-auto mt-1.5 max-w-3xl text-center text-[10px] text-muted-foreground/60">
          Press Enter to send · Shift+Enter for new line
        </p>
      </form>
    );
  },
);
