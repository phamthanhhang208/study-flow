import { supabase } from "../supabase";
import type { LearningPath, StudySession } from "../api/types";

// ── Row types ──

interface SharedPathRow {
  id: string;
  path_id: string;
  slug: string;
  user_id: string;
  created_at: string;
}

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

// ── Public API ──

/**
 * Share a path: returns the slug (creates one if it doesn't exist yet).
 */
export async function shareOrGetSlug(pathId: string): Promise<string> {
  // Check for an existing share
  const { data: existing } = await supabase
    .from("shared_paths")
    .select("slug")
    .eq("path_id", pathId)
    .maybeSingle();

  if (existing) return existing.slug as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Create a new share row with user_id (needed for RLS)
  const { data, error } = await supabase
    .from("shared_paths")
    .insert({ path_id: pathId, user_id: user.id })
    .select("slug")
    .single();

  if (error) {
    console.error("shareOrGetSlug error:", error);
    throw error;
  }

  return (data as SharedPathRow).slug;
}

/**
 * Fetch a shared learning path by slug (public, no auth required).
 * Returns null if the slug doesn't exist.
 */
export async function fetchSharedPath(
  slug: string,
): Promise<{ path: LearningPath; originalPathId: string } | null> {
  // First resolve slug → path_id
  const { data: share, error: shareError } = await supabase
    .from("shared_paths")
    .select("path_id")
    .eq("slug", slug)
    .maybeSingle();

  if (shareError || !share) return null;

  const pathId = (share as { path_id: string }).path_id;

  // Fetch the path + modules
  const { data, error } = await supabase
    .from("learning_paths")
    .select("*, modules (*)")
    .eq("id", pathId)
    .single();

  if (error || !data) {
    console.error("fetchSharedPath error:", error);
    return null;
  }

  const path = rowToLearningPath(data as PathRow);
  return { path, originalPathId: pathId };
}

/**
 * Clone a shared path to the current user's account.
 * Returns the new StudySession id.
 */
export async function clonePath(originalPathId: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch original path + modules
  const { data: original, error: fetchError } = await supabase
    .from("learning_paths")
    .select("*, modules (*)")
    .eq("id", originalPathId)
    .single();

  if (fetchError || !original) throw new Error("Could not fetch path to clone");

  const row = original as PathRow;

  // Generate new IDs
  const newPathId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Insert new path
  const { error: pathError } = await supabase.from("learning_paths").insert({
    id: newPathId,
    user_id: user.id,
    title: row.title,
    topic: row.topic,
    overview: row.overview,
    difficulty: row.difficulty,
    estimated_total_minutes: row.estimated_total_minutes,
    created_at: now,
    updated_at: now,
  });

  if (pathError) throw pathError;

  // Insert cloned modules with new IDs
  const modules = (row.modules ?? []).map((m: ModuleRow) => ({
    id: crypto.randomUUID(),
    path_id: newPathId,
    title: m.title,
    description: m.description,
    order_index: m.order_index,
    estimated_minutes: m.estimated_minutes,
    search_query: m.search_query,
    difficulty: m.difficulty,
    module_status: m.module_status,
    resources: m.resources,
    created_at: now,
  }));

  if (modules.length > 0) {
    const { error: modError } = await supabase.from("modules").insert(modules);
    if (modError) throw modError;
  }

  return newPathId;
}

/**
 * Build the full share URL for a given slug.
 */
export function buildShareUrl(slug: string): string {
  return `${window.location.origin}/share/${slug}`;
}

/**
 * Convert a cloned path row back into a StudySession for the store.
 */
export async function fetchClonedSession(
  newPathId: string,
): Promise<StudySession | null> {
  const { data, error } = await supabase
    .from("learning_paths")
    .select("*, modules (*)")
    .eq("id", newPathId)
    .single();

  if (error || !data) return null;

  const row = data as PathRow;
  const path = rowToLearningPath(row);
  const ts = new Date(row.created_at).getTime();

  return {
    id: row.id,
    topic: row.topic,
    learningPath: path,
    activeModuleId: path.subModules[0]?.id ?? null,
    responses: [],
    createdAt: ts,
    lastAccessed: ts,
  };
}
