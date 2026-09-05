"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./like-button.module.css";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  initialCount?: number;
  initialLiked?: boolean;
  postId: string;
}

export function LikeButton({ initialCount = 0, initialLiked = false, postId }: LikeButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setLiked(initialLiked);
  }, [initialLiked]);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  const handleToggleLike = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPending) return;

    const nextLiked = e.target.checked;
    const prevLiked = liked;
    const prevCount = count;

    // Optimistic UI update
    setLiked(nextLiked);
    setCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    setIsPending(true);

    try {
      const res = await fetch(`/api/discussions/posts/${postId}/react`, {
        method: nextLiked ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: nextLiked ? JSON.stringify({ type: "LIKE" }) : undefined,
      });

      if (res.status === 401) {
        setLiked(prevLiked);
        setCount(prevCount);
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to update reaction");
      }

      const data = await res.json();
      if (typeof data.reactionCount === "number") {
        setCount(data.reactionCount);
      }
    } catch (err) {
      console.error("Like toggle failed:", err);
      // Revert optimistic update
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setIsPending(false);
    }
  };

  // Use the ID to generate a unique HTML ID for the checkbox label linking
  const checkboxId = `heart-${postId}`;
  const unlikedCount = liked ? Math.max(0, count - 1) : count;
  const likedCount = liked ? count : count + 1;

  return (
    <div className={styles.likeButton}>
      <input 
        className={styles.heartInput} 
        id={checkboxId} 
        type="checkbox" 
        checked={liked}
        disabled={isPending}
        onChange={handleToggleLike}
      />
      
      <label className={styles.like} htmlFor={checkboxId}>
        <svg className={styles.likeIcon} fillRule="nonzero" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
        </svg>
        <span className={styles.likeText}>Like</span>
      </label>
      
      <span className={cn(styles.likeCount, styles.likeCountOne)}>
        {unlikedCount}
      </span>
      <span className={cn(styles.likeCount, styles.likeCountTwo)}>
        {likedCount}
      </span>
    </div>
  );
}
