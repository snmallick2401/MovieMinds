import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PeopleList } from "@/components/social/people-list";

export const metadata = { title: "Discover People - MovieMinds" };

function PeopleListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-2xl border border-border/50 bg-card p-6 shadow-sm animate-pulse min-h-[210px]"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-full bg-muted shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
              </div>
              <div className="size-10 rounded-full bg-muted shrink-0" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="flex gap-1">
                <div className="h-5 w-14 bg-muted rounded-md" />
                <div className="h-5 w-16 bg-muted rounded-md" />
                <div className="h-5 w-12 bg-muted rounded-md" />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="h-9 w-24 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function PeoplePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Discover People</h1>
        <p className="mt-2 text-muted-foreground">Find users with similar taste and discover new recommendations.</p>
      </div>

      <div className="space-y-12">
        {user && (
          <section>
            <h2 className="text-xl font-bold mb-4">Similar Taste</h2>
            <Suspense fallback={<PeopleListSkeleton />}>
              <PeopleList category="similar" currentUserId={user.id} />
            </Suspense>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold mb-4">Popular Reviewers</h2>
          <Suspense fallback={<PeopleListSkeleton />}>
            <PeopleList category="popular" currentUserId={user?.id} />
          </Suspense>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">New Members</h2>
          <Suspense fallback={<PeopleListSkeleton />}>
            <PeopleList category="new" currentUserId={user?.id} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
