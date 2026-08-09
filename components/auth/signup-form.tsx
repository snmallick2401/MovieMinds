"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Chrome } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const form = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });
  async function submit(values: SignupInput) {
    const { email, password, username, displayName } = values;
    setError(null);
    try {
      const { data, error: authError } = await createClient().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username, display_name: displayName },
        },
      });
      if (authError) return setError(authError.message);
      setConfirmation(!data.session);
      if (data.session) window.location.assign("/");
    } catch {
      setError(
        "Supabase is not configured. Add your real project URL and anon key to .env.local, then restart npm run dev.",
      );
    }
  }
  async function google() {
    setError(null);
    try {
      const { error: authError } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) setError(authError.message);
    } catch {
      setError(
        "Supabase is not configured. Add your real project URL and anon key to .env.local, then restart npm run dev.",
      );
    }
  }
  if (confirmation)
    return (
      <div className="mt-8 rounded-xl border border-primary/25 bg-primary/10 p-5">
        <h3 className="font-semibold">Check your inbox</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to your email. Once confirmed, you can sign in to
          MovieMinds.
        </p>
      </div>
    );
  return (
    <form onSubmit={form.handleSubmit(submit)} className="mt-8 space-y-4">
      <label className="block text-sm font-medium">
        Display name
        <Input className="mt-2" autoComplete="name" {...form.register("displayName")} />
      </label>
      {form.formState.errors.displayName && (
        <p className="text-sm text-destructive">
          {form.formState.errors.displayName.message}
        </p>
      )}
      <label className="block text-sm font-medium">
        Username
        <Input
          className="mt-2"
          autoComplete="username"
          placeholder="movie_fan"
          {...form.register("username")}
        />
      </label>
      {form.formState.errors.username && (
        <p className="text-sm text-destructive">
          {form.formState.errors.username.message}
        </p>
      )}
      <label className="block text-sm font-medium">
        Email
        <Input className="mt-2" autoComplete="email" {...form.register("email")} />
      </label>
      {form.formState.errors.email && (
        <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
      )}
      <label className="block text-sm font-medium">
        Password
        <PasswordInput
          className="mt-2"
          autoComplete="new-password"
          {...form.register("password")}
        />
      </label>
      {form.formState.errors.password && (
        <p className="text-sm text-destructive">
          {form.formState.errors.password.message}
        </p>
      )}
      <label className="block text-sm font-medium">
        Confirm password
        <PasswordInput
          className="mt-2"
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
      </label>
      {form.formState.errors.confirmPassword && (
        <p className="text-sm text-destructive">
          {form.formState.errors.confirmPassword.message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creating account…" : "Create account"}
      </Button>
      <Button type="button" variant="outline" className="w-full" onClick={google}>
        <Chrome className="size-4" />
        Continue with Google
      </Button>
      <p className="pt-1 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
