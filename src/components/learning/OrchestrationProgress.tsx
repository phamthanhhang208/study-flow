import { motion } from "framer-motion";
import { Brain, Loader2, Search, CheckCircle2 } from "lucide-react";
import type { OrchestrationStep } from "../../lib/api/types";

interface OrchestrationProgressProps {
  step: OrchestrationStep | null;
}

const stepConfig = {
  generating: {
    icon: Brain,
    label: "Analyzing topic structure",
    color: "text-blue-500",
  },
  searching: {
    icon: Search,
    label: "Finding best resources",
    color: "text-amber-500",
  },
  complete: {
    icon: CheckCircle2,
    label: "Learning path ready!",
    color: "text-green-500",
  },
  error: {
    icon: Brain,
    label: "Something went wrong",
    color: "text-destructive",
  },
};

export function OrchestrationProgress({ step }: OrchestrationProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="relative">
        <Brain className="h-12 w-12 text-primary/20" />
      </div>

      <h2 className="mt-6 text-xl font-semibold">
        Building your learning path...
      </h2>

      <div className="mt-6 space-y-3">
        {(["generating", "searching"] as const).map((s) => {
          const config = stepConfig[s];
          const Icon = config.icon;
          const isActive = step?.step === s;
          const isDone =
            (s === "generating" && step?.step !== "generating") ||
            (s === "searching" && step?.step === "complete");

          return (
            <div key={s} className="flex items-center gap-3 text-sm">
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Icon className="h-4 w-4 text-muted-foreground/40" />
              )}
              <span
                className={
                  isDone
                    ? "text-muted-foreground line-through"
                    : isActive
                      ? "font-medium text-foreground"
                      : "text-muted-foreground/60"
                }
              >
                {config.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        This takes 10-15 seconds
      </p>
    </motion.div>
  );
}
