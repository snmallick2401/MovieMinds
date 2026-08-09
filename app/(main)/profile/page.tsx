import { CalendarDays, Mail } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { formatJoinDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">YOUR PROFILE</p>
        <h1 className="mt-1 text-3xl font-bold">Profile settings</h1>
        <p className="mt-2 text-muted-foreground">
          Keep your MovieMinds identity up to date.
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary/60 via-violet-500/30 to-transparent" />
        <div className="px-6 pb-6">
          <Avatar
            name={profile.displayName}
            src={profile.avatarUrl}
            className="-mt-10 size-20 border-4 border-card text-xl"
          />
          <h2 className="mt-3 text-xl font-semibold">{profile.displayName}</h2>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Mail className="size-4" />
              {profile.email}
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              Joined {formatJoinDate(profile.createdAt)}
            </span>
          </div>
          {profile.bio && <p className="mt-4 text-sm leading-6">{profile.bio}</p>}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Edit profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your email is managed securely through Supabase Auth.
        </p>
        <div className="mt-6">
          <ProfileForm profile={profile} />
        </div>
      </Card>
    </div>
  );
}
