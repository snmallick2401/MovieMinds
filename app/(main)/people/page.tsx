import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Loader2 } from "lucide-react";
import { PeopleList } from "@/components/social/people-list";

export const metadata = { title: "Discover People - MovieMinds" };

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
            <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
              <PeopleList category="similar" currentUserId={user.id} />
            </Suspense>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold mb-4">Popular Reviewers</h2>
          <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
            <PeopleList category="popular" currentUserId={user?.id} />
          </Suspense>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">New Members</h2>
          <Suspense fallback={<Loader2 className="animate-spin text-muted-foreground" />}>
            <PeopleList category="new" currentUserId={user?.id} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
