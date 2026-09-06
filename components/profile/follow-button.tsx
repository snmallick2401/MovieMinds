"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function FollowButton({ 
  targetUserId, 
  initialIsFollowing 
}: { 
  targetUserId: string; 
  initialIsFollowing: boolean 
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Sync state if initialIsFollowing prop updates from server re-render
  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  async function handleFollow() {
    setIsLoading(true);
    try {
      if (isFollowing) {
        const res = await fetch(`/api/social/follow?targetUserId=${targetUserId}`, { method: "DELETE" });
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        if (res.ok) {
          setIsFollowing(false);
          router.refresh();
        }
      } else {
        const res = await fetch("/api/social/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId }),
        });
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        if (res.ok) {
          setIsFollowing(true);
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Follow action failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className="gap-2 rounded-full font-bold shadow-sm px-6"
      onClick={handleFollow}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="size-4" />
      ) : (
        <UserPlus className="size-4" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
