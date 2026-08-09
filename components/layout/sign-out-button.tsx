"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function signOut() {
    setPending(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-muted-foreground"
      onClick={signOut}
      disabled={pending}
    >
      <LogOut className="size-4" />
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
