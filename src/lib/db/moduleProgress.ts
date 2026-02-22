import { supabase } from "../supabase";

/** Fetch all completed module IDs for the current user */
export async function fetchUserProgress(): Promise<Set<string>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from("module_progress")
    .select("module_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("fetchUserProgress error:", error);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.module_id as string));
}

/** Mark a module as complete for the current user */
export async function markModuleComplete(moduleId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("module_progress").upsert({
    user_id: user.id,
    module_id: moduleId,
    completed_at: new Date().toISOString(),
  });

  if (error) {
    console.error("markModuleComplete error:", error);
    throw error;
  }
}

/** Unmark a module as complete (toggle off) */
export async function unmarkModuleComplete(moduleId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("module_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("module_id", moduleId);

  if (error) {
    console.error("unmarkModuleComplete error:", error);
    throw error;
  }
}
