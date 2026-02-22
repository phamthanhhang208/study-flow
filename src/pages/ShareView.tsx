import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, Clock, Copy, Loader2, LogIn, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import {
  fetchSharedPath,
  clonePath,
  fetchClonedSession,
  buildShareUrl,
} from "../lib/db/sharedPaths";
import { useStudyStore } from "../lib/store/studyStore";
import type { LearningPath } from "../lib/api/types";
import { cn } from "../lib/utils/cn";

export default function ShareView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const store = useStudyStore();

  const [path, setPath] = useState<LearningPath | null>(null);
  const [originalPathId, setOriginalPathId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cloning, setCloning] = useState(false);

  // Load shared path on mount
  useEffect(() => {
    if (!slug) return;
    fetchSharedPath(slug).then((result) => {
      if (!result) {
        setNotFound(true);
      } else {
        setPath(result.path);
        setOriginalPathId(result.originalPathId);
      }
      setLoading(false);
    });
  }, [slug]);

  // After OAuth redirect back, if there's a pending clone slug stored, proceed
  useEffect(() => {
    const pendingSlug = sessionStorage.getItem("pendingCloneSlug");
    if (user && pendingSlug && pendingSlug === slug && originalPathId) {
      sessionStorage.removeItem("pendingCloneSlug");
      handleClone();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, originalPathId]);

  const handleClone = useCallback(async () => {
    if (!originalPathId) return;

    if (!user) {
      // Save slug so we can resume after OAuth redirect
      sessionStorage.setItem("pendingCloneSlug", slug ?? "");
      signInWithGoogle();
      return;
    }

    setCloning(true);
    try {
      const newPathId = await clonePath(originalPathId);
      const session = await fetchClonedSession(newPathId);
      if (session) {
        store.loadUserPaths(user.id); // refresh full list
        toast.success("Path cloned! Opening your copy…");
        navigate("/");
      }
    } catch (err) {
      console.error("Clone failed:", err);
      toast.error("Failed to clone path. Please try again.");
    } finally {
      setCloning(false);
    }
  }, [originalPathId, user, slug, signInWithGoogle, store, navigate]);

  const handleCopyLink = useCallback(() => {
    if (!slug) return;
    navigator.clipboard.writeText(buildShareUrl(slug));
    toast.success("Link copied!");
  }, [slug]);

  // ── Render states ──

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !path) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <h1 className="text-xl font-semibold">Path not found</h1>
        <p className="text-sm text-muted-foreground">
          This link may have expired or been deleted.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Go to StudyFlow
        </Button>
      </div>
    );
  }

  const difficultyColor = {
    beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }[path.difficulty] ?? "bg-muted text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-blue-500" />
          StudyFlow
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            Copy link
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleClone}
            disabled={cloning}
          >
            {cloning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : user ? (
              <BookOpen className="h-3.5 w-3.5" />
            ) : (
              <LogIn className="h-3.5 w-3.5" />
            )}
            {cloning ? "Cloning…" : user ? "Clone to my account" : "Sign in to clone"}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", difficultyColor)}>
              {path.difficulty}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {path.estimatedTotalMinutes} min total
            </span>
            <span className="text-xs text-muted-foreground">
              {path.totalModules} modules
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">{path.topic}</h1>

          {path.overview && (
            <p className="text-muted-foreground leading-relaxed">{path.overview}</p>
          )}
        </div>

        {/* Clone CTA */}
        <div className="mt-8 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/60 px-5 py-4 dark:border-blue-800/40 dark:bg-blue-950/20">
          <BookOpen className="h-5 w-5 shrink-0 text-blue-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Learn this at your own pace</p>
            <p className="text-xs text-muted-foreground">
              Clone this path to your account to track progress and ask questions.
            </p>
          </div>
          <Button size="sm" onClick={handleClone} disabled={cloning} className="shrink-0 gap-1.5">
            {cloning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : !user ? (
              <LogIn className="h-3.5 w-3.5" />
            ) : null}
            {cloning ? "Cloning…" : user ? "Clone" : "Sign in & clone"}
          </Button>
        </div>

        {/* Module list */}
        <div className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Curriculum — {path.subModules.length} modules
          </h2>
          <div className="space-y-2">
            {path.subModules.map((mod) => (
              <div
                key={mod.id}
                className="flex items-start gap-4 rounded-lg border bg-card px-4 py-3"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                  {mod.order}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug">{mod.title}</p>
                  {mod.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {mod.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {mod.estimatedMinutes} min
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Generated with{" "}
          <a href="/" className="underline underline-offset-2 hover:text-foreground">
            StudyFlow
          </a>
        </p>
      </div>
    </div>
  );
}
