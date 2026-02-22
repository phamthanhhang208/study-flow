import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";

// Google "G" logo SVG
function GoogleLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginPage() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo / brand */}
        <div className="space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight">StudyFlow</h1>
          <p className="text-sm text-muted-foreground">
            Your AI-powered learning companion
          </p>
        </div>

        {/* Sign in card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <p className="text-sm text-muted-foreground">
            Sign in to save your learning paths and continue where you left off.
          </p>

          <Button
            onClick={signInWithGoogle}
            disabled={loading}
            variant="outline"
            className="w-full gap-3 text-sm font-medium"
          >
            <GoogleLogo />
            Continue with Google
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          By signing in you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
