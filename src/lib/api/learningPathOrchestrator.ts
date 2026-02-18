import { generateModuleOutline } from "./moduleGenerator";
import { fetchAllModuleResources } from "./resourceFetcher";
import type { LearningPath, SubModule, OrchestrationStep } from "./types";

export async function buildLearningPath(
  topic: string,
  onProgress?: (step: OrchestrationStep) => void,
  apiKey?: string,
): Promise<LearningPath> {
  try {
    // Step 1: Generate module outline via LLM
    onProgress?.({ step: "generating", message: "Breaking topic into learning modules..." });

    const outline = await generateModuleOutline(topic, apiKey);

    // Build SubModule shells with pending status
    const subModules: SubModule[] = outline.modules.map((mod) => ({
      id: crypto.randomUUID(),
      order: mod.order,
      title: mod.title,
      description: mod.description,
      estimatedMinutes: mod.estimatedMinutes,
      searchQuery: mod.searchQuery,
      difficulty: mod.difficulty,
      articles: [],
      videos: [],
      status: "pending" as const,
    }));

    // Step 2: Fetch resources for all modules in parallel
    onProgress?.({ step: "searching", message: "Finding articles and videos for each module..." });

    const resources = await fetchAllModuleResources(
      subModules.map((m) => ({ id: m.id, searchQuery: m.searchQuery })),
      apiKey,
    );

    // Merge resources into subModules
    const enrichedModules: SubModule[] = subModules.map((mod, i) => ({
      ...mod,
      articles: resources[i].articles,
      videos: resources[i].videos,
      status: (resources[i].articles.length > 0 || resources[i].videos.length > 0
        ? "complete"
        : "error") as SubModule["status"],
    }));

    // Step 3: Assemble final LearningPath
    const learningPath: LearningPath = {
      id: crypto.randomUUID(),
      topic: outline.topic,
      overview: outline.overview,
      totalModules: enrichedModules.length,
      estimatedTotalMinutes: outline.estimatedTotalMinutes,
      difficulty: outline.difficulty,
      subModules: enrichedModules,
      createdAt: new Date(),
      generatedBy: "llm",
    };

    onProgress?.({ step: "complete", message: "Learning path ready!" });

    return learningPath;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    onProgress?.({ step: "error", message: error.message, error });
    throw error;
  }
}
