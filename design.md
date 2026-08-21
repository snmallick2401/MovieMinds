# MovieMinds — Design System, Colors, Theme & Typography Guide

**Document Version:** 1.0.0  
**Design Philosophy:** Cinematic, Immersive, Minimalist, High-Performance  
**Last Updated:** August 2026  

---

## 1. Design Philosophy & Aesthetic Principles

MovieMinds is designed with a **cinematic, content-first aesthetic**. Media backdrops and poster artwork take center stage, framed by balanced whitespace, deep obsidian surfaces, and high-legibility typography.

### Core Principles
1. **Content-Forward Hierarchy**: UI elements recede to let cinematic artwork, character photography, and viewing statistics command attention.
2. **Harmonious Dual Theming**: Flawless contrast and accessibility across both Dark Mode (Midnight Obsidian) and Light Mode (Clean Daylight).
3. **Micro-Interactions over Visual Clutter**: Subtle scale transitions on poster hover (`hover:scale-105`), smooth fade-in animations, and clear focus indicators.
4. **Accessible Information Density**: Clear visual grouping with responsive cards, snap-scroll horizontal carousels, and scannable badges.

---

## 2. Color System & Design Tokens (HSL Architecture)

The color palette is built entirely on semantic **HSL (Hue, Saturation, Lightness)** design tokens defined in `globals.css` and mapped into Tailwind CSS utilities.

### 2.1 Color Tokens Table

| Semantic Token | Light Mode (HSL) | Dark Mode (HSL) | Usage & Visual Role |
| :--- | :--- | :--- | :--- |
| `--background` | `0 0% 99%` | `228 16% 6%` | Root application background. Pure canvas in light, deep obsidian in dark. |
| `--foreground` | `240 10% 10%` | `0 0% 100%` | Primary text and headings. High-contrast slate in light, pure white in dark. |
| `--card` | `0 0% 100%` | `232 13% 12%` | Container surfaces, modal dialogs, media cards, review boxes. |
| `--card-foreground`| `240 10% 10%` | `0 0% 96%` | Text inside cards and elevated containers. |
| `--primary` | `262 83% 58%` | `262 83% 58%` | **Electric Violet / Royal Purple**. Brand identity, primary CTA buttons, active tabs. |
| `--primary-foreground`| `0 0% 100%` | `0 0% 100%` | Text/icons on top of primary brand elements. |
| `--accent` | `38 92% 50%` | `38 92% 50%` | **Golden Amber / Star Gold**. Ratings, badges, highlights, taste match highlights. |
| `--accent-foreground`| `0 0% 100%` | `0 0% 100%` | Text on top of golden accent badges. |
| `--muted` | `240 5% 95%` | `232 13% 16%` | Secondary button backgrounds, skeletons, pill badges, input backgrounds. |
| `--muted-foreground`| `240 4% 46%` | `240 5% 65%` | Subtitles, release dates, metadata labels, placeholder text. |
| `--border` | `240 6% 90%` | `235 11% 19%` | Hairline card borders, divider lines, form input outlines. |
| `--ring` | `262 83% 58%` | `262 83% 58%` | Focus outline rings for keyboard accessibility. |
| `--destructive` | `0 72% 51%` | `0 63% 55%` | Error banners, delete buttons, drop/cancel library actions. |

---

### 2.2 Functional & Status Colors

```
┌────────────────────────────────────────────────────────────────────────┐
│ STATUS BADGE PALETTES                                                  │
├────────────────────────────────────────────────────────────────────────┤
│ • WATCHING     : Emerald Green  (bg-emerald-500/20 text-emerald-400)   │
│ • COMPLETED    : Electric Blue  (bg-blue-500/20 text-blue-400)         │
│ • PLAN TO WATCH: Violet / Indigo(bg-primary/20 text-primary)           │
│ • ON HOLD      : Amber Gold     (bg-amber-500/20 text-amber-400)       │
│ • DROPPED      : Rose / Red     (bg-destructive/20 text-destructive)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Typography & Font Hierarchy

### 3.1 Typeface Selection
- **Primary Typeface**: **Inter** (Google Font loaded via `next/font/google` with Latin subset and variable font axis).
- **Fallback Stack**: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- **Characteristics**: Crisp geometric letterforms, tall x-height for scannable metadata, exceptional legibility on high-DPI displays.

---

### 3.2 Typography Scale & Style Guide

| Level / Role | Tailwind Classes | Font Size | Weight | Tracking & Leading | Usage in MovieMinds |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | `text-4xl sm:text-5xl font-bold` | `36px – 48px` | Bold (700) | `tracking-tight leading-tight` | Media Detail Hero Titles, Explore Hero |
| **Page Heading (H1)** | `text-3xl font-bold` | `30px` | Bold (700) | `tracking-tight leading-normal` | My Library, Community, Profile headers |
| **Section Title (H2)** | `text-xl font-bold` | `20px` | Bold (700) | `leading-snug` | "Trending now", "Cast & Crew", "Where to Watch" |
| **Card Title (H3)** | `text-base font-semibold` | `16px` | SemiBold (600) | `leading-snug line-clamp-1` | MediaCard titles, discussion thread headers |
| **Body (Standard)** | `text-sm text-foreground` | `14px` | Regular (400) | `leading-relaxed` | Synopses, reviews, forum replies |
| **Body (Muted)** | `text-sm text-muted-foreground` | `14px` | Regular (400) | `leading-relaxed` | Secondary descriptions, helper text |
| **Meta / Subtitle** | `text-xs text-muted-foreground` | `12px` | Medium (500) | `leading-normal` | Release year, runtime, vote count |
| **Micro Badge** | `text-[10px] font-bold uppercase` | `10px` | Bold (700) | `tracking-wider` | "MOVIE", "TV", "ANIME", "VOICE ACTOR" badges |

---

## 4. UI Components & Design Patterns

### 4.1 Media Card Design Pattern
- **Aspect Ratio**: Precise cinematic `aspect-[2/3]` poster container.
- **Corner Radius**: Modern rounded corners (`rounded-xl` / `0.9rem`).
- **Surface & Elevation**: Subtle border (`border-border`), dark elevated drop shadows (`shadow-sm hover:shadow-lg`).
- **Interactive State**: `-translate-y-0.5` transform on hover with smooth 300ms easing (`transition duration-300`).
- **Poster Overlay**: Gradient backdrop blur badges for media type in the top-left corner (`bg-black/70 backdrop-blur text-white`).

### 4.2 Badges & Indicator Tags
- **Genre Badge**: Compact rounded pill (`rounded-full bg-muted/60 text-xs px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted`).
- **Rating Badge**: Golden star icon with amber badge background (`bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20`).
- **Status Pills**: Color-coded status indicators on personal library cards.

### 4.3 Carousels & Horizontal Snapping
- **Snap Scrolling**: `snap-x overflow-x-auto pb-4 scrollbar-thin` for Cast & Crew and Streaming Providers.
- **Actor Circular Avatars**: 96px circular profile containers (`size-24 rounded-full border-2 border-border/50 shadow-md object-cover`).

### 4.4 Form Controls & Modals
- **Inputs & Dropdowns**: Sleek dark card styling (`bg-card border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary`).
- **Action Buttons**:
  - **Primary**: `bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 shadow-md`.
  - **Secondary**: `bg-muted text-foreground hover:bg-muted/80 rounded-xl`.
  - **Ghost**: `hover:bg-muted/50 text-muted-foreground hover:text-foreground`.

---

## 5. Spacing, Layout & Breakpoint System

### 5.1 Responsive Grid Breakpoints (Tailwind Standards)
- **Mobile (`< 640px`)**: 2-column media grids (`grid-cols-2 gap-3`).
- **Tablet (`sm:` / `640px – 768px`)**: 3-column media grids (`sm:grid-cols-3 gap-4`).
- **Small Desktop (`md:` / `768px – 1024px`)**: 4-column media grids (`md:grid-cols-4`).
- **Large Desktop (`lg:` / `1024px – 1280px`)**: 5-column media grids (`lg:grid-cols-5`).
- **Extra Wide (`xl:` / `> 1280px`)**: 6-column media grids (`xl:grid-cols-6`).

### 5.2 Container Constraints
- **Max Page Width**: `max-w-7xl` (1280px) centered with responsive padding (`px-4 sm:px-6 md:px-8`).
- **Vertical Rhythm**: Consistent spacing between major page sections (`space-y-8 md:space-y-12`).

---

## 6. Animation & Motion Design

```css
/* Smooth Fade-In Keyframe */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

- **Duration Standard**: 200ms – 300ms for micro-interactions (button hover, card lift, modal entrance).
- **Reduced Motion**: Respects `prefers-reduced-motion: reduce` across all animations.
- **Skeleton Pulse**: Animated gradient pulse (`animate-pulse bg-muted rounded-xl`) for instant loading state feedback.
