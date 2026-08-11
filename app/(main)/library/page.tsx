import { LibraryDashboard } from "@/components/library/library-dashboard";
import { requireUser } from "@/lib/auth/server";
import { getLibraryDashboard } from "@/lib/library/queries";
import { recalculateUserStats } from "@/lib/media/aggregates";
import { RatingWidgets } from "@/components/ratings/rating-widgets";

export default async function LibraryPage() {
  const user = await requireUser();
  const [dashboard, ratingStats] = await Promise.all([
    getLibraryDashboard(user.id),
    recalculateUserStats(user.id)
  ]);
  const { items, wishlist } = dashboard;
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">
        Your collection
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">My Library</h1>
      <p className="mt-2 text-muted-foreground">
        Track every story you are watching, saving, and returning to.
      </p>
      <div className="mt-8">
        <RatingWidgets stats={ratingStats} />
        <LibraryDashboard initialItems={items} wishlist={wishlist} />
      </div>
    </div>
  );
}
