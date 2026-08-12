"use client";

import React, { useState } from "react";
import styles from "./like-button.module.css";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  initialCount?: number;
  postId: string;
}

export function LikeButton({ initialCount = 0, postId }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);

  // Use the ID to generate a unique HTML ID for the checkbox label linking
  const checkboxId = `heart-${postId}`;

  return (
    <div className={styles.likeButton}>
      <input 
        className={styles.heartInput} 
        id={checkboxId} 
        type="checkbox" 
        checked={liked}
        onChange={(e) => setLiked(e.target.checked)}
      />
      
      <label className={styles.like} htmlFor={checkboxId}>
        <svg className={styles.likeIcon} fillRule="nonzero" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
        </svg>
        <span className={styles.likeText}>Like</span>
      </label>
      
      <span className={cn(styles.likeCount, styles.likeCountOne)}>
        {initialCount}
      </span>
      <span className={cn(styles.likeCount, styles.likeCountTwo)}>
        {initialCount + 1}
      </span>
    </div>
  );
}
