"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import styles from "./theme-toggle.module.css";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={styles.switchContainer} />;
  }

  const isDark = resolvedTheme !== "light";

  const toggleTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTheme(e.target.checked ? "dark" : "light");
  };

  return (
    <div className={styles.switchContainer}>
      <label>
        <input 
          className={styles.slider} 
          type="checkbox" 
          checked={isDark} 
          onChange={toggleTheme} 
          aria-label="Toggle color theme"
        />
        <div className={styles.switch}>
          <div className={styles.suns} />
          <div className={styles.moons}>
            <div className={cn(styles.star, styles.star1)} />
            <div className={cn(styles.star, styles.star2)} />
            <div className={cn(styles.star, styles.star3)} />
            <div className={cn(styles.star, styles.star4)} />
            <div className={cn(styles.star, styles.star5)} />
            <div className={styles.firstMoon} />
          </div>
          <div className={styles.sand} />
          <div className={styles.bb8}>
            <div className={styles.antennas}>
              <div className={cn(styles.antenna, styles.short)} />
              <div className={cn(styles.antenna, styles.long)} />
            </div>
            <div className={styles.head}>
              <div className={cn(styles.stripe, styles.one)} />
              <div className={cn(styles.stripe, styles.two)} />
              <div className={styles.eyes}>
                <div className={cn(styles.eye, styles.one)} />
                <div className={cn(styles.eye, styles.two)} />
              </div>
              <div className={cn(styles.stripe, styles.detail)}>
                <div className={cn(styles.detail, styles.zero)} />
                <div className={cn(styles.detail, styles.zero)} />
                <div className={cn(styles.detail, styles.one)} />
                <div className={cn(styles.detail, styles.two)} />
                <div className={cn(styles.detail, styles.three)} />
                <div className={cn(styles.detail, styles.four)} />
                <div className={cn(styles.detail, styles.five)} />
                <div className={cn(styles.detail, styles.five)} />
              </div>
              <div className={cn(styles.stripe, styles.three)} />
            </div>
            <div className={styles.ball}>
              <div className={cn(styles.lines, styles.one)} />
              <div className={cn(styles.lines, styles.two)} />
              <div className={cn(styles.ring, styles.one)} />
              <div className={cn(styles.ring, styles.two)} />
              <div className={cn(styles.ring, styles.three)} />
            </div>
            <div className={styles.shadow} />
          </div>
        </div>
      </label>
    </div>
  );
}
