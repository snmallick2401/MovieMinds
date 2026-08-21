"use client";

/**
 * Dragon Ball icon component.
 * High-contrast, premium crystal orb with crisp visibility in both dark and light UI themes.
 */

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

interface DragonBallProps {
  /** Number of stars (1–7) */
  stars: number;
  /** Visual size in px */
  size?: number;
  /** Whether this ball is active/selected (colored) or unselected (translucent obsidian) */
  active?: boolean;
  /** Whether this ball is half-filled */
  half?: boolean;
  /** Optional extra class names */
  className?: string;
}

export function DragonBall({
  stars,
  size = 40,
  active = true,
  half = false,
  className = "",
}: DragonBallProps) {
  const ballCount = Math.min(7, Math.max(1, stars));
  const positions = STAR_POSITIONS[ballCount] ?? STAR_POSITIONS[1];

  const isColored = active || half;

  return (
    <div
      className={`relative inline-block shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className="relative size-full rounded-full overflow-hidden transition-all duration-200"
        style={{
          border: isColored
            ? "1.5px solid rgba(255, 180, 0, 0.6)"
            : "1.5px solid rgba(255, 255, 255, 0.2)",
          boxShadow: isColored
            ? "0 0 10px rgba(255, 150, 0, 0.4), inset 0 0 6px rgba(255, 200, 0, 0.3)"
            : "inset 0 0 6px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Layer 1: High-Contrast Translucent Slate/Obsidian Base (Crisp on Dark Themes) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 35%, #475569 0%, #1e293b 60%, #0f172a 100%)",
            boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.8), inset 2px 2px 6px rgba(255,255,255,0.2)",
          }}
        >
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

        {/* Layer 2: Glowing Crystal Orange Fill */}
        {isColored && (
          <div
            className="absolute inset-0 rounded-full transition-all duration-300"
            style={{
              background: "radial-gradient(circle at 35% 35%, #fff3b0 0%, #ffaa00 35%, #e65100 70%, #991b1b 100%)",
              boxShadow: "inset -4px -4px 10px rgba(153, 27, 27, 0.85), inset 3px 3px 10px rgba(255, 243, 176, 0.7)",
              clipPath: half ? "polygon(0 0, 50% 0, 50% 100%, 0 100%)" : "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            }}
          >
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
        )}

        {/* Layer 3: Crystal Glass Glare for 3D Pop */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 55%)",
          }}
        />
      </div>
    </div>
  );
}
