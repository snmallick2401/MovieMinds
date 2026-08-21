import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Bell, UserPlus, Heart, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const metadata = { title: "Notifications - MovieMinds" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Please log in to view notifications</h1>
      </div>
    );
  }

  const notifications = await prisma.notification
    .findMany({
      where: { userId: user.id },
      include: {
        actor: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="size-7 text-primary" />
        <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
          <Bell className="mx-auto size-12 text-muted-foreground/40 mb-3" />
          <h2 className="text-xl font-bold">All caught up!</h2>
          <p className="mt-1 text-muted-foreground">You don't have any notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            let icon = <Bell className="size-4 text-primary" />;
            let text = "sent you a notification";
            
            const meta = n.metadata as any;
            const extraCount = meta?.count ? meta.count - 1 : 0;
            const othersText = extraCount > 0 ? ` and ${extraCount} other${extraCount > 1 ? 's' : ''}` : "";

            if (n.type === "NEW_FOLLOWER") {
              icon = <UserPlus className="size-4 text-pink-400" />;
              text = `started following you`;
            } else if (n.type === "REVIEW_LIKE") {
              icon = <Heart className="size-4 text-red-400 fill-red-400" />;
              text = `liked your review`;
            } else if (n.type === "REVIEW_COMMENT" || n.type === "REPLY") {
              icon = <MessageSquare className="size-4 text-blue-400" />;
              text = `commented on your review`;
            }

            return (
              <div key={n.id} className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-colors hover:bg-muted/30">
                <Link href={`/user/${n.actor.username}`} className="shrink-0">
                  <Avatar src={n.actor.avatarUrl} name={n.actor.displayName} className="size-10" />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <Link href={`/user/${n.actor.username}`} className="font-bold hover:underline">
                      {n.actor.displayName}
                    </Link>
                    {othersText && <span className="font-semibold text-muted-foreground">{othersText}</span>}
                    {" "}
                    <span className="text-muted-foreground">{text}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="shrink-0">{icon}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
