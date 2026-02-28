import { useState } from "react";
import {
  Brain,
  Trophy,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "../../lib/utils/cn";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import type {
  Quiz,
  MultipleChoiceQuestion,
  FillBlankQuestion,
} from "../../lib/api/quizGenerator";

// ── Types ──

type QuizStatus = "idle" | "loading" | "active" | "completed";

interface AnswerRecord {
  questionId: number;
  correct: boolean;
}

interface BestAttempt {
  score: number;
  total: number;
}

interface KnowledgeCheckProps {
  moduleId: string;
  moduleTitle: string;
  moduleContent: string;
  quiz: Quiz | null;
  isGenerating: boolean;
  bestAttempt?: BestAttempt;
  onStart: () => void;
  onComplete: (score: number, total: number, answers: AnswerRecord[]) => void;
}

// ── Score message ──

function scoreMessage(pct: number): string {
  if (pct === 100) return "Perfect score! Outstanding work. 🎉";
  if (pct >= 80) return "Great job! You're ready to move on.";
  if (pct >= 60)
    return "Good effort! Consider reviewing the module before continuing.";
  return "Keep studying — retake this quiz when you're ready.";
}

// ── Multiple choice input ──

function MultipleChoiceInput({
  question,
  selected,
  isRevealed,
  onSelect,
}: {
  question: MultipleChoiceQuestion;
  selected: number | null;
  isRevealed: boolean;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="space-y-2">
      {question.options.map((opt, i) => {
        const isSelected = selected === i;
        const isCorrect = i === question.correctIndex;

        let style =
          "border-border bg-background hover:border-primary/50 hover:bg-accent/50";
        let icon: React.ReactNode = null;

        if (isRevealed) {
          if (isCorrect) {
            style =
              "border-green-500 bg-green-50 dark:bg-green-950/30 cursor-default";
            icon = <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />;
          } else if (isSelected) {
            style =
              "border-red-400 bg-red-50 dark:bg-red-950/30 cursor-default";
            icon = <XCircle className="h-4 w-4 shrink-0 text-red-500" />;
          } else {
            style = "border-border bg-background opacity-50 cursor-default";
          }
        } else if (isSelected) {
          style = "border-primary bg-primary/5";
        }

        return (
          <button
            key={i}
            type="button"
            disabled={isRevealed}
            onClick={() => onSelect(i)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition-all",
              style,
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                isRevealed && isCorrect
                  ? "border-green-500 text-green-600"
                  : isRevealed && isSelected
                    ? "border-red-400 text-red-500"
                    : isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40 text-muted-foreground",
              )}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1">{opt}</span>
            {icon}
          </button>
        );
      })}
    </div>
  );
}

// ── True / False input ──

function TrueFalseInput({
  selected,
  isRevealed,
  correct,
  onSelect,
}: {
  selected: boolean | null;
  isRevealed: boolean;
  correct: boolean;
  onSelect: (v: boolean) => void;
}) {
  const options: { value: boolean; label: string }[] = [
    { value: true, label: "True" },
    { value: false, label: "False" },
  ];

  return (
    <div className="flex gap-4">
      {options.map(({ value, label }) => {
        const isSelected = selected === value;
        const isCorrect = value === correct;

        let style = "border-border hover:border-primary/50 hover:bg-accent/50";
        let icon: React.ReactNode = null;

        if (isRevealed) {
          if (isCorrect) {
            style =
              "border-green-500 bg-green-50 dark:bg-green-950/30 cursor-default";
            icon = <CheckCircle2 className="h-5 w-5 text-green-600" />;
          } else if (isSelected) {
            style =
              "border-red-400 bg-red-50 dark:bg-red-950/30 cursor-default";
            icon = <XCircle className="h-5 w-5 text-red-500" />;
          } else {
            style = "border-border opacity-50 cursor-default";
          }
        } else if (isSelected) {
          style = "border-primary bg-primary/5";
        }

        return (
          <button
            key={label}
            type="button"
            disabled={isRevealed}
            onClick={() => onSelect(value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-4 text-base font-semibold transition-all",
              style,
            )}
          >
            {label}
            {icon}
          </button>
        );
      })}
    </div>
  );
}

// ── Fill in the blank input ──

function FillBlankInput({
  question,
  value,
  isRevealed,
  isCorrect,
  onChange,
}: {
  question: FillBlankQuestion;
  value: string;
  isRevealed: boolean;
  isCorrect: boolean | null;
  onChange: (v: string) => void;
}) {
  const parts = question.question.split("___");

  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base leading-relaxed">
        {parts.map((part, i) => (
          <span key={i} className="contents">
            <span>{part}</span>
            {i < parts.length - 1 && (
              <input
                type="text"
                value={value}
                disabled={isRevealed}
                onChange={(e) => onChange(e.target.value)}
                placeholder="type here"
                className={cn(
                  "inline-block rounded border-b-2 border-t-0 border-l-0 border-r-0 bg-transparent px-1 py-0.5 text-base outline-none transition-colors min-w-[8rem]",
                  isRevealed && isCorrect === true
                    ? "border-green-500 text-green-700 dark:text-green-400"
                    : isRevealed && isCorrect === false
                      ? "border-red-400 text-red-600"
                      : "border-primary/50 focus:border-primary",
                )}
              />
            )}
          </span>
        ))}
      </p>

      {isRevealed && isCorrect === false && (
        <p className="text-sm text-red-600 dark:text-red-400">
          The answer was: <strong>{question.answer}</strong>
        </p>
      )}
    </div>
  );
}

// ── Explanation box ──

function ExplanationBox({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
        Explanation
      </p>
      <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">{text}</p>
    </div>
  );
}

// ── Main component ──

export function KnowledgeCheck({
  moduleTitle,
  quiz,
  isGenerating,
  bestAttempt,
  onStart,
  onComplete,
}: KnowledgeCheckProps) {
  const [status, setStatus] = useState<QuizStatus>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);

  // Per-question answer state (typed loosely, narrowed in handlers)
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [tfSelected, setTfSelected] = useState<boolean | null>(null);
  const [fillValue, setFillValue] = useState("");
  const [fillCorrect, setFillCorrect] = useState<boolean | null>(null);

  const questions = quiz?.questions ?? [];
  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // ── Start ──

  function handleStart() {
    setStatus("loading");
    setCurrentIndex(0);
    setAnswers([]);
    resetQuestionState();
    onStart();
  }

  function resetQuestionState() {
    setMcSelected(null);
    setTfSelected(null);
    setFillValue("");
    setFillCorrect(null);
    setIsRevealed(false);
  }

  // When the quiz finishes generating, move to active
  if (status === "loading" && quiz && !isGenerating) {
    setStatus("active");
  }

  // ── Check answer ──

  function handleCheckAnswer() {
    if (!currentQ) return;

    let correct = false;

    if (currentQ.type === "multiple_choice") {
      correct = mcSelected === currentQ.correctIndex;
    } else if (currentQ.type === "true_false") {
      correct = tfSelected === currentQ.correct;
    } else if (currentQ.type === "fill_blank") {
      const normalised = fillValue.trim().toLowerCase();
      const accepted = [currentQ.answer, ...currentQ.acceptedAnswers].map((a) =>
        a.toLowerCase(),
      );
      correct = accepted.includes(normalised);
      setFillCorrect(correct);
    }

    setIsRevealed(true);
    setAnswers((prev) => [...prev, { questionId: currentQ.id, correct }]);
  }

  // ── Next / complete ──

  function handleNext() {
    if (isLastQuestion) {
      const score = answers.filter((a) => a.correct).length;
      setStatus("completed");
      onComplete(score, questions.length, answers);
    } else {
      setCurrentIndex((i) => i + 1);
      resetQuestionState();
    }
  }

  // ── Retry ──

  function handleRetry() {
    setStatus("idle");
    setCurrentIndex(0);
    setAnswers([]);
    resetQuestionState();
  }

  // ── Can check answer? ──

  const canCheck = (() => {
    if (!currentQ || isRevealed) return false;
    if (currentQ.type === "multiple_choice") return mcSelected !== null;
    if (currentQ.type === "true_false") return tfSelected !== null;
    if (currentQ.type === "fill_blank") return fillValue.trim().length > 0;
    return false;
  })();

  // ── Completed score ──
  const finalScore = answers.filter((a) => a.correct).length;
  const finalTotal = questions.length;
  const pct = finalTotal > 0 ? Math.round((finalScore / finalTotal) * 100) : 0;

  // ── Render: Idle ──

  if (status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Brain className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Knowledge Check</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Test your understanding of{" "}
          <span className="font-medium text-foreground">{moduleTitle}</span>
        </p>

        <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
          <li>• 5–10 mixed format questions</li>
          <li>• Instant feedback with explanations</li>
          <li>• Retake anytime</li>
        </ul>

        {bestAttempt && (
          <p className="mt-4 text-sm text-muted-foreground">
            Your best score:{" "}
            <span className="font-semibold text-foreground">
              {bestAttempt.score}/{bestAttempt.total}
            </span>
          </p>
        )}

        <Button className="mt-6" onClick={handleStart}>
          Start Knowledge Check
        </Button>
      </div>
    );
  }

  // ── Render: Loading ──

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Generating your quiz…
        </p>
      </div>
    );
  }

  // ── Render: Completed ──

  if (status === "completed") {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Trophy
          className={cn(
            "mb-4 h-14 w-14",
            pct >= 80 ? "text-yellow-500" : "text-muted-foreground",
          )}
        />
        <h3 className="text-xl font-bold">Quiz Completed!</h3>
        <p className="mt-2 text-4xl font-semibold tabular-nums">
          {finalScore}
          <span className="text-xl text-muted-foreground"> / {finalTotal}</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {scoreMessage(pct)}
        </p>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={handleRetry}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ── Render: Active ──

  if (!currentQ) return null;

  const progressPct =
    questions.length > 0
      ? Math.round((currentIndex / questions.length) * 100)
      : 0;

  return (
    <div className="space-y-5 py-2">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            QUESTION {currentIndex + 1} OF {questions.length}
          </span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-1.5 [&>div]:bg-primary" />
      </div>

      {/* Question text */}
      <p className="text-base font-medium leading-snug">{currentQ.question}</p>

      {/* Answer input */}
      {currentQ.type === "multiple_choice" && (
        <MultipleChoiceInput
          question={currentQ}
          selected={mcSelected}
          isRevealed={isRevealed}
          onSelect={setMcSelected}
        />
      )}

      {currentQ.type === "true_false" && (
        <TrueFalseInput
          selected={tfSelected}
          isRevealed={isRevealed}
          correct={currentQ.correct}
          onSelect={setTfSelected}
        />
      )}

      {currentQ.type === "fill_blank" && (
        <FillBlankInput
          question={currentQ}
          value={fillValue}
          isRevealed={isRevealed}
          isCorrect={fillCorrect}
          onChange={setFillValue}
        />
      )}

      {/* Revealed correct/wrong banner for fill blank */}
      {isRevealed && currentQ.type === "fill_blank" && fillCorrect !== null && (
        <p
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium",
            fillCorrect
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400",
          )}
        >
          {fillCorrect ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Correct!
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" /> Incorrect
            </>
          )}
        </p>
      )}

      {/* Explanation */}
      {isRevealed && <ExplanationBox text={currentQ.explanation} />}

      {/* Action buttons */}
      <div className="flex justify-between gap-3 pt-1">
        {!isRevealed ? (
          <Button
            className="ml-auto"
            disabled={!canCheck}
            onClick={handleCheckAnswer}
          >
            Check Answer
          </Button>
        ) : (
          <Button className="ml-auto gap-1.5" onClick={handleNext}>
            {isLastQuestion ? "See Results" : "Next Question"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
