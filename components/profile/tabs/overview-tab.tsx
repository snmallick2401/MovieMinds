import Link from "next/link";
import Image from "next/image";
import { Trophy } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { ActivityTimeline } from "../activity-timeline";

type ProfileWithFavorites = Prisma.UserGetPayload<{
  include: {
    favorites: {
      include: {
        media: { select: { id: true, title: true, posterUrl: true, year: true, mediaType: true } }
      }
    }
  }
}>;

export function OverviewTab({ profile, stats }: { profile: ProfileWithFavorites, stats: { totalWatched: number, moviesWatched: number, tvWatched: number, animeWatched: number, hoursWatched: number } }) {
  const getFavorites = (category: string) => 
    profile.favorites.filter(f => f.category === category).sort((a, b) => a.position - b.position);

  const favMovies = getFavorites("MOVIE");
  const favTv = getFavorites("TV");
  const favAnime = getFavorites("ANIME");

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_300px]">
      <div className="space-y-10">
        {/* Featured Favorites */}
        {profile.showFavorites && (favMovies.length > 0 || favTv.length > 0 || favAnime.length > 0) && (
          <section className="space-y-8">
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-yellow-500" />
              <h2 className="text-xl font-bold tracking-tight">Featured Favorites</h2>
            </div>
            
            <div className="space-y-8">
              {[
                { title: "Favorite Movies", items: favMovies },
                { title: "Favorite TV Shows", items: favTv },
                { title: "Favorite Anime", items: favAnime },
              ].map(group => group.items.length > 0 && (
                <div key={group.title} className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{group.title}</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {group.items.map((fav) => (
                      <Link 
                        key={fav.id} 
                        href={`/media/${fav.media.id}`}
                        className="group relative aspect-[2/3] overflow-hidden rounded-lg border border-border shadow-sm transition-transform hover:scale-105"
                      >
                        {fav.media.posterUrl ? (
                          <Image 
                            src={fav.media.posterUrl} 
                            alt={fav.media.title} 
                            fill 
                            className="object-cover"
                            sizes="(max-width: 768px) 25vw, 150px"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-muted flex items-center justify-center text-center p-2 text-xs">
                            {fav.media.title}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <p className="text-xs font-bold text-white line-clamp-2">{fav.media.title}</p>
                          <p className="text-[10px] text-white/70">{fav.media.year}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Activity Timeline */}
        {profile.showActivity && (
          <section className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
            <ActivityTimeline username={profile.username} />
          </section>
        )}
      </div>

      <div className="space-y-6">
        {profile.showStats && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-bold mb-4 text-lg">At a Glance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Watched</span>
                <span className="font-medium">{stats.totalWatched}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Movies</span>
                <span className="font-medium">{stats.moviesWatched}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">TV Shows</span>
                <span className="font-medium">{stats.tvWatched}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Anime</span>
                <span className="font-medium">{stats.animeWatched}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Hours Watched</span>
                <span className="font-medium">{stats.hoursWatched}h</span>
              </div>
            </div>
          </section>
        )}
        
        {/* We can place currently watching here in the future if we fetch it */}
      </div>
    </div>
  );
}
