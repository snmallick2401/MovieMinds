"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <AlertTriangle className="mx-auto size-9 text-destructive" />
      <h2 className="mt-4 text-xl font-bold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn’t load this part of MovieMinds. Please try again.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
