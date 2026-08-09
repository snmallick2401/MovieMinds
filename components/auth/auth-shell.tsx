import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col">
        <p className="text-2xl font-bold">MovieMinds</p>
        <div className="my-auto max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            Every story, one home
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-tight">
            Remember what moved you.
          </h1>
          <p className="mt-5 text-primary-foreground/80">
            A thoughtful home for the movies, anime, and shows that stay with you.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">v0.1 · Authentication System</p>
      </section>
      <section className="relative flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 block text-xl font-bold lg:hidden">
            MovieMinds
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="mt-2 text-muted-foreground">{description}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
