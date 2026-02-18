import { useCallback } from "react";
import { toast } from "sonner";
import { useStudyStore } from "../lib/store/studyStore";
import { useSettingsStore } from "../lib/store/settingsStore";
import { useAgentStream } from "./useAgentStream";
import { buildLearningPath } from "../lib/api/learningPathOrchestrator";

// ── Prompt templates ──

function buildQuestionPrompt(topic: string, question: string): string {
  return `You are a learning assistant helping someone study "${topic}".

Answer the following question thoroughly with citations where appropriate. Use [1], [2], etc. to reference sources.

Question: ${question}`;
}

// ── Main orchestration hook ──

export function useAgentOrchestration() {
  const store = useStudyStore();
  const apiKey = useSettingsStore((s) => s.apiKey);
  const { streamQuery, stopStream } = useAgentStream();

  const handleUserInput = useCallback(
    async (input: string) => {
      const isNewTopic = !store.currentSessionId;

      // Create session if needed
      if (isNewTopic) {
        store.startNewTopic(input);
      }

      if (isNewTopic) {
        // ── New topic: use two-step orchestration pipeline ──
        store.setOrchestrating(true);
        try {
          const path = await buildLearningPath(
            input,
            (step) => {
              store.setOrchestrationStep(step);
            },
            apiKey || undefined,
          );

          store.setLearningPath(path);

          if (path.subModules.length > 0) {
            store.setActiveModule(path.subModules[0].id);
          }

          toast.success("Learning path created!");
        } catch (err) {
          console.error("Learning path orchestration error:", err);
          const message =
            err instanceof Error ? err.message : "Something went wrong";
          toast.error("Failed to create learning path", {
            description: message,
          });
        } finally {
          store.setOrchestrating(false);
        }
      } else {
        // ── Follow-up question: stream via agent ──
        store.setAgentThinking(true);
        store.clearAgentSteps();
        store.clearCurrentResponse();

        try {
          const session = store.sessions.find(
            (s) => s.id === store.currentSessionId,
          );
          const topic = session?.topic || "this topic";

          const prompt = buildQuestionPrompt(topic, input);
          const { content, citations } = await streamQuery(prompt, "express", [
            { type: "web_search" },
            { type: "compute" },
          ]);

          store.addResponse({
            query: input,
            answer: content,
            citations,
          });
        } catch (err) {
          console.error("Agent orchestration error:", err);
          const message =
            err instanceof Error ? err.message : "Something went wrong";
          toast.error("Failed to process request", { description: message });

          // If we have partial content, save it
          const currentContent = store.currentResponse;
          if (currentContent) {
            store.addResponse({
              query: input,
              answer:
                currentContent + "\n\n*[Response interrupted due to an error]*",
              citations: store.currentCitations,
            });
          }
        } finally {
          store.setAgentThinking(false);
        }
      }
    },
    [store, streamQuery, apiKey],
  );

  return { handleUserInput, stopStream };
}
