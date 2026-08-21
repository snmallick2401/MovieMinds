"use client";

import React, { useState, useEffect, useRef } from "react";

const BALLS = [1, 2, 3, 4, 5, 6, 7] as const;

const STAR_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[35, 50], [65, 50]],
  3: [[50, 35], [35, 60], [65, 60]],
  4: [[35, 35], [65, 35], [35, 65], [65, 65]],
  5: [[50, 25], [25, 45], [75, 45], [35, 70], [65, 70]],
  6: [[35, 25], [65, 25], [20, 50], [80, 50], [35, 70], [65, 70]],
  7: [[35, 25], [65, 25], [20, 50], [80, 50], [35, 75], [65, 75], [50, 50]],
};

const STAR_PATH = "M 0,-9 L 2,-2.5 L 8.5,-2.5 L 3.2,1.5 L 5.2,8 L 0,4 L -5.2,8 L -3.2,1.5 L -8.5,-2.5 L -2,-2.5 Z";

const DB_LABELS: Record<number, string> = {
  0.5: "Terrible",
  1: "Very Bad",
  1.5: "Bad",
  2: "Poor",
  2.5: "Below Average",
  3: "Average",
  3.5: "Above Average",
  4: "Good",
  4.5: "Very Good",
  5: "Great",
  5.5: "Excellent",
  6: "Superb",
  6.5: "Amazing",
  7: "LEGENDARY! 🐉",
};

interface DragonBallRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function DragonBallRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  showLabel = true,
}: DragonBallRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [flashing, setFlashing] = useState(false);
  const [shenronActive, setShenronActive] = useState(false);
  const shenronTimerRef = useRef<NodeJS.Timeout | null>(null);

  const displayRating = hoverRating ?? value ?? 0;

  // Ball dimensions by size variant
  const ballPx = size === "lg" ? 64 : size === "sm" ? 34 : 48;
  const gapPx = size === "lg" ? 14 : size === "sm" ? 8 : 10;

  function handleSelect(val: number) {
    if (readOnly || !onChange) return;

    // Toggle off if clicking the exact current rating
    const nextRating = value === val ? 0 : val;
    onChange(nextRating);

    // Trigger golden flash pulse
    setFlashing(false);
    setTimeout(() => setFlashing(true), 15);

    // Trigger Shenron easter egg on perfect 7.0
    if (nextRating === 7) {
      if (shenronTimerRef.current) clearTimeout(shenronTimerRef.current);
      setShenronActive(false);
      setTimeout(() => {
        setShenronActive(true);
        shenronTimerRef.current = setTimeout(() => setShenronActive(false), 2600);
      }, 10);
    } else {
      setShenronActive(false);
    }
  }

  useEffect(() => {
    return () => {
      if (shenronTimerRef.current) clearTimeout(shenronTimerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center select-none">
      {/* Scoped CSS Styles for high-contrast visibility & 3D rendering */}
      <style jsx>{`
        .db-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 18px;
          border-radius: 40px;
          background: rgba(18, 18, 24, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .db-ball-container {
          position: relative;
          cursor: ${readOnly ? "default" : "pointer"};
          flex-shrink: 0;
          border-radius: 50%;
        }

        .db-ball {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid rgba(255, 255, 255, 0.22);
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease, border-color 0.2s ease;
          overflow: hidden;
        }

        .state-full .db-ball,
        .state-half .db-ball {
          border-color: rgba(255, 180, 0, 0.7);
          box-shadow: 0 0 12px rgba(255, 150, 0, 0.45);
        }

        ${!readOnly
          ? `
        .db-ball-container:hover .db-ball {
          transform: scale(1.18);
          border-color: #ffb300;
          box-shadow: 0 0 22px 6px rgba(255, 180, 0, 0.75);
          z-index: 10;
        }
        `
          : ""}

        .db-layer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          overflow: hidden;
        }

        /* 1. High-Contrast Slate/Obsidian Base Layer */
        .db-layer-stone {
          background: radial-gradient(circle at 35% 35%, #475569 0%, #1e293b 60%, #0f172a 100%);
          box-shadow: inset -2px -2px 6px rgba(0, 0, 0, 0.8), inset 2px 2px 6px rgba(255, 255, 255, 0.2);
        }

        /* 2. Full Glassy Glowing Amber State */
        .db-layer-color {
          background: radial-gradient(circle at 35% 35%, #fff3b0 0%, #ffaa00 35%, #e65100 70%, #991b1b 100%);
          box-shadow: inset -5px -5px 12px rgba(153, 27, 27, 0.85), inset 3px 3px 12px rgba(255, 243, 176, 0.7);
          opacity: 0;
          clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
          transition: clip-path 0.22s ease-in-out, opacity 0.22s ease-in-out;
          transition-delay: calc(var(--ball-idx) * 35ms);
        }

        /* 3. Glass Glare Specular Highlight */
        .db-layer-glare {
          background: radial-gradient(ellipse at 50% 20%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 55%);
          pointer-events: none;
        }

        /* Active Fill States */
        .state-half .db-layer-color {
          opacity: 1;
          clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%);
        }

        .state-full .db-layer-color {
          opacity: 1;
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
        }

        /* Hitboxes for half-star precision */
        .db-hitbox {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          z-index: 20;
        }
        .db-hitbox-left { left: 0; }
        .db-hitbox-right { left: 50%; }

        /* Selection Flash Animation */
        @keyframes dbFlashPulse {
          0% { box-shadow: 0 0 0px 0px rgba(255, 235, 59, 1); }
          50% { box-shadow: 0 0 32px 14px rgba(255, 215, 0, 0.85); }
          100% { box-shadow: 0 0 0px 0px rgba(255, 235, 59, 0); }
        }

        .db-flash .db-ball {
          animation: dbFlashPulse 0.4s ease-out;
        }

        /* Shenron Easter Egg Animation */
        .db-shenron-canvas {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 125%;
          height: 220px;
          pointer-events: none;
          z-index: -1;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .db-shenron-active {
          opacity: 1;
        }

        .db-dragon-path {
          fill: none;
          stroke: #2ecc71;
          stroke-width: 6;
          stroke-linecap: round;
          filter: drop-shadow(0 0 12px #2ecc71) drop-shadow(0 0 28px #00ff88);
          stroke-dasharray: 1600;
          stroke-dashoffset: 1600;
        }

        .db-shenron-active .db-dragon-path {
          animation: summonShenron 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes summonShenron {
          0% { stroke-dashoffset: 1600; opacity: 1; }
          75% { stroke-dashoffset: 0; opacity: 1; filter: drop-shadow(0 0 20px #2ecc71) drop-shadow(0 0 45px #00ff88); }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
      `}</style>

      {/* Main Container */}
      <div
        className="db-wrapper"
        style={{ gap: `${gapPx}px` }}
        onMouseLeave={() => !readOnly && setHoverRating(null)}
      >
        {BALLS.map((ballIndex) => {
          const isFull = displayRating >= ballIndex;
          const isHalf = !isFull && displayRating === ballIndex - 0.5;
          const isFlashing = flashing && ballIndex <= Math.ceil(displayRating);

          const positions = STAR_POSITIONS[ballIndex];

          return (
            <div
              key={ballIndex}
              className={`db-ball-container ${isFull ? "state-full" : isHalf ? "state-half" : ""} ${
                isFlashing ? "db-flash" : ""
              }`}
              style={
                {
                  width: `${ballPx}px`,
                  height: `${ballPx}px`,
                  "--ball-idx": ballIndex,
                } as React.CSSProperties
              }
            >
              <div className="db-ball">
                {/* 1. High-Contrast Slate/Obsidian Base Layer */}
                <div className="db-layer db-layer-stone">
                  <svg viewBox="0 0 100 100" className="size-full">
                    {positions.map(([cx, cy], i) => (
                      <path
                        key={i}
                        d={STAR_PATH}
                        fill="#94a3b8"
                        opacity={0.8}
                        transform={`translate(${cx}, ${cy}) scale(0.9)`}
                      />
                    ))}
                  </svg>
                </div>

                {/* 2. Radiant Glassy Orange Glow Layer */}
                <div className="db-layer db-layer-color">
                  <svg viewBox="0 0 100 100" className="size-full">
                    {positions.map(([cx, cy], i) => (
                      <path
                        key={i}
                        d={STAR_PATH}
                        fill="#dc2626"
                        transform={`translate(${cx}, ${cy}) scale(0.9)`}
                      />
                    ))}
                  </svg>
                </div>

                {/* 3. Glass Glare Specular Highlight */}
                <div className="db-layer db-layer-glare" />
              </div>

              {/* Hitboxes for half/full star clicks */}
              {!readOnly && (
                <>
                  <div
                    className="db-hitbox db-hitbox-left"
                    title={`Rate ${ballIndex - 0.5} Dragon Balls`}
                    onMouseEnter={() => setHoverRating(ballIndex - 0.5)}
                    onClick={() => handleSelect(ballIndex - 0.5)}
                  />
                  <div
                    className="db-hitbox db-hitbox-right"
                    title={`Rate ${ballIndex} Dragon Balls`}
                    onMouseEnter={() => setHoverRating(ballIndex)}
                    onClick={() => handleSelect(ballIndex)}
                  />
                </>
              )}
            </div>
          );
        })}

        {/* Shenron Easter Egg SVG Animation */}
        <svg
          className={`db-shenron-canvas ${shenronActive ? "db-shenron-active" : ""}`}
          viewBox="0 0 600 250"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="db-dragon-path"
            d="M -50,250 Q 50,50 150,150 T 300,80 T 450,180 T 650,-20"
          />
        </svg>
      </div>

      {/* Dynamic Rating Label */}
      {showLabel && (
        <div className="mt-3 text-center font-bold min-h-[1.5rem] transition-colors">
          {displayRating > 0 ? (
            <div className="flex items-center justify-center gap-1.5 text-sm sm:text-base">
              <span className="text-orange-400 font-extrabold text-lg sm:text-xl">
                {displayRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground font-medium">/ 7.0</span>
              <span className="text-foreground/90 font-semibold ml-1">
                — {DB_LABELS[displayRating] ?? ""}
              </span>
            </div>
          ) : (
            <span className="text-xs sm:text-sm text-muted-foreground font-normal">
              {readOnly ? "Not rated" : "Click or hover to rate with Dragon Balls"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
