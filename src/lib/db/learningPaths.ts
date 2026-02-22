import { supabase } from "../supabase";
import type { LearningPath, StudySession } from "../api/types";

// ── Row types (what Supabase returns) ──

interface PathRow {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  overview: string | null;
  difficulty: string | null;
  estimated_total_minutes: number | null;
  created_at: string;
  updated_at: string;
  modules: ModuleRow[];
}

interface ModuleRow {
  id: string;
  path_id: string;
  title: string;
  description: string | null;
  order_index: number;
  estimated_minutes: number | null;
  search_query: string | null;
  difficulty: string | null;
  module_status: string | null;
  resources: { articles: unknown[]; videos: unknown[] } | null;
  created_at: string;
}

// ── Mappers ──

function rowToLearningPath(row: PathRow): LearningPath {
  return {
    id: row.id,
    topic: row.topic,
    overview: row.overview ?? "",
    totalModules: row.modules.length,
    estimatedTotalMinutes: row.estimated_total_minutes ?? 0,
    difficulty: (row.difficulty as LearningPath["difficulty"]) ?? "beginner",
    generatedBy: "llm",
    createdAt: new Date(row.created_at),
    subModules: row.modules
      .sort((a, b) => a.order_index - b.order_index)
      .map((m) => ({
        id: m.id,
        order: m.order_index,
        title: m.title,
        description: m.description ?? "",
        estimatedMinutes: m.estimated_minutes ?? 10,
        searchQuery: m.search_query ?? "",
        difficulty:
          (m.difficulty as "beginner" | "intermediate" | "advanced") ??
          "beginner",
        status: (m.module_status as "pending" | "complete") ?? "complete",
        articles: (m.resources?.articles ?? []) as LearningPath["subModules"][0]["articles"],
        videos: (m.resources?.videos ?? []) as LearningPath["subModules"][0]["videos"],
      })),
  };
}

function pathToSession(row: PathRow, path: LearningPath): StudySession {
  const ts = new Date(row.created_at).getTime();
  return {
    id: row.id,
    topic: row.topic,
    learningPath: path,
    activeModuleId: path.subModules[0]?.id ?? null,
    responses: [],
    createdAt: ts,
    lastAccessed: new Date(row.updated_at).getTime(),
  };
}

// ── Public API ──

/** Fetch all learning paths (with modules) for the current user */
export async function fetchUserPaths(): Promise<StudySession[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("learning_paths")
    .select(
      `
      *,
      modules (*)
    `,
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("fetchUserPaths error:", error);
    return [];
  }

  return (data as PathRow[]).map((row) => {
    const path = rowToLearningPath(row);
    return pathToSession(row, path);
  });
}

/** Save a full LearningPath (upsert path + all modules) */
export async function saveLearningPath(
  userId: string,
  path: LearningPath,
): Promise<void> {
  // Upsert the path row
  const { error: pathError } = await supabase.from("learning_paths").upsert({
    id: path.id,
    user_id: userId,
    title: path.topic,
    topic: path.topic,
    overview: path.overview,
    difficulty: path.difficulty,
    estimated_total_minutes: path.estimatedTotalMinutes,
    updated_at: new Date().toISOString(),
  });

  if (pathError) {
    console.error("saveLearningPath error:", pathError);
    throw pathError;
  }

  // Upsert all modules
  const moduleRows = path.subModules.map((mod) => ({
    id: mod.id,
    path_id: path.id,
    title: mod.title,
    description: mod.description,
    order_index: mod.order,
    estimated_minutes: mod.estimatedMinutes,
    search_query: mod.searchQuery,
    difficulty: mod.difficulty,
    module_status: mod.status,
    resources: { articles: mod.articles, videos: mod.videos },
  }));

  const { error: modError } = await supabase
    .from("modules")
    .upsert(moduleRows);

  if (modError) {
    console.error("saveModules error:", modError);
    throw modError;
  }
}

/** Delete a learning path (modules cascade automatically) */
export async function deleteLearningPath(pathId: string): Promise<void> {
  const { error } = await supabase
    .from("learning_paths")
    .delete()
    .eq("id", pathId);

  if (error) {
    console.error("deleteLearningPath error:", error);
    throw error;
  }
}
