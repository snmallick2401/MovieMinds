import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profile = await prisma.user.findUnique({ where: { id: user.id } });
  if (!profile)
    throw new Error(
      "Your profile could not be found. Run the Supabase profile migration and try again.",
    );
  return <AppShell profile={profile}>{children}</AppShell>;
}
