import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { LibraryStatus } from "@prisma/client";
import { CheckCircle2, Clock, PlayCircle, XCircle, PauseCircle } from "lucide-react";

const statusConfig = {
  WATCHING: { label: "Watching", icon: PlayCircle, color: "text-blue-500" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, color: "text-green-500" },
  PLAN_TO_WATCH: { label: "Plan to Watch", icon: Clock, color: "text-muted-foreground" },
  ON_HOLD: { label: "On Hold", icon: PauseCircle, color: "text-yellow-500" },
  DROPPED: { label: "Dropped", icon: XCircle, color: "text-red-500" },
};

export async function LibraryTab({ userId, username, filterStatus }: { userId: string, username: string, filterStatus?: string }) {
  const libraryEntries = await prisma.userLibrary.findMany({
    where: { 
      userId,
      ...(filterStatus && filterStatus !== "ALL" ? { status: filterStatus as LibraryStatus } : {})
    },
    include: {
      media: {
        select: { id: true, title: true, posterUrl: true, year: true, mediaType: true }
      }
    },
    orderBy: { updatedAt: "desc" },
  });

  // Group entries by status if no filter is applied
  const grouped = libraryEntries.reduce((acc, entry) => {
    acc[entry.status] = acc[entry.status] || [];
    acc[entry.status].push(entry);
    return acc;
  }, {} as Record<string, typeof libraryEntries>);

  const statusesToRender = filterStatus && filterStatus !== "ALL" 
    ? [filterStatus] 
    : Object.keys(statusConfig);

  if (libraryEntries.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-12 rounded-xl border border-dashed border-border bg-card">
        Library is empty.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {statusesToRender.map((status) => {
        const entries = grouped[status] || [];
        if (entries.length === 0) return null;
        
        const config = statusConfig[status as keyof typeof statusConfig];
        const Icon = config.icon;
        
        return (
          <section key={status} className="space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Icon className={`size-5 ${config.color}`} />
              <h2 className="text-xl font-bold tracking-tight">{config.label}</h2>
              <span className="text-sm text-muted-foreground ml-2">({entries.length})</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {entries.map((entry) => (
                <div key={entry.id} className="group relative flex flex-col gap-2 transition-transform hover:scale-105">
                  <Link href={`/media/${entry.media.id}`} className="block">
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-border shadow-sm">
                      {entry.media.posterUrl ? (
                        <Image 
                          src={entry.media.posterUrl} 
                          alt={entry.media.title} 
                          fill 
                          className="object-cover" 
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted p-2 text-center text-xs">
                          {entry.media.title}
                        </div>
                      )}
                      
                      {entry.progress > 0 && (
                        <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent p-2">
                          <div className="text-xs font-semibold text-white">
                            Ep/Ch {entry.progress}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="px-1 text-center">
                    <Link href={`/media/${entry.media.id}`} className="line-clamp-2 text-xs font-medium hover:underline leading-tight">
                      {entry.media.title}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
