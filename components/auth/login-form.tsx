"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, getSafeRedirectUrl, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const destination = getSafeRedirectUrl(params.get("next"), "/");
  async function submit(values: LoginInput) {
    console.log("Submit started");
    setError(null);
    try {
      console.log("Calling supabase...");
      const { error: authError } = await createClient().auth.signInWithPassword(values);
      console.log("Supabase returned", authError);
      if (authError) return setError(authError.message);
      console.log("Replacing route");
      router.replace(destination);
      router.refresh();
    } catch (err) {
      console.error("Submit caught error", err);
      setError(
        "Supabase is not configured. Add your real project URL and anon key to .env.local, then restart npm run dev.",
      );
    }
  }
  return (
    <form onSubmit={form.handleSubmit(submit)} className="mt-8 space-y-5">
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
          autoComplete="current-password"
          {...form.register("password")}
        />
      </label>
      {form.formState.errors.password && (
        <p className="text-sm text-destructive">
          {form.formState.errors.password.message}
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
        {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <p className="pt-2 text-center text-sm text-muted-foreground">
        New to MovieMinds?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
