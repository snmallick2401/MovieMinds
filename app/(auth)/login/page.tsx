import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to pick up your next great story."
    >
      <Suspense
        fallback={<div className="mt-8 h-80 animate-pulse rounded-xl bg-muted" />}
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
