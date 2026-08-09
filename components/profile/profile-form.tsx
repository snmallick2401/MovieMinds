"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import type { Profile } from "@/types/profile";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile.displayName,
      username: profile.username,
      bio: profile.bio ?? "",
      avatarUrl: profile.avatarUrl ?? "",
    },
  });
  async function submit(values: ProfileInput) {
    setMessage(null);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload: { error?: string } = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Could not save your profile.");
      return;
    }
    setMessage("Profile saved.");
  }
  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Display name
          <Input className="mt-2" {...form.register("displayName")} />
        </label>
        <label className="text-sm font-medium">
          Username
          <Input className="mt-2" {...form.register("username")} />
        </label>
      </div>
      {(form.formState.errors.displayName || form.formState.errors.username) && (
        <p className="text-sm text-destructive">
          {form.formState.errors.displayName?.message ??
            form.formState.errors.username?.message}
        </p>
      )}
      <label className="block text-sm font-medium">
        Avatar URL
        <Input className="mt-2" placeholder="https://…" {...form.register("avatarUrl")} />
      </label>
      {form.formState.errors.avatarUrl && (
        <p className="text-sm text-destructive">
          {form.formState.errors.avatarUrl.message}
        </p>
      )}
      <label className="block text-sm font-medium">
        Bio
        <textarea
          className="mt-2 flex min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          maxLength={500}
          {...form.register("bio")}
        />
      </label>
      {form.formState.errors.bio && (
        <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Save changes"}
        </Button>
        {message && (
          <p
            className={
              message === "Profile saved."
                ? "text-sm text-primary"
                : "text-sm text-destructive"
            }
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
