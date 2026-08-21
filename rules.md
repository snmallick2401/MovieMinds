# MovieMinds — Engineering Rules & Best Practices

**Document Version:** 1.0.0  
**Target Audience:** Core Developers & AI Coding Agents  
**Scope:** Architecture, Database, Performance, Error Handling, and AI Boundaries  

---

## 1. Core Architectural & Framework Rules

### What to Do:
- **Default to React Server Components (RSC)**: Keep components server-side by default. Add `"use client"` only at the leaf level when user interaction, state hooks (`useState`, `useEffect`), or browser APIs are required.
- **Use Next.js `after()` for Deferred Work**: For all external API synchronization (TMDb, AniList) or analytics logging that should not block the user response, schedule the work inside `after()` from `next/server`.
- **Implement In-Flight Deduplication**: Any background synchronization or async worker must maintain an in-memory lock/Set to prevent concurrent duplicate sync jobs from overwhelming the database.
- **Use Multi-Tier Caching**:
  - Use React `cache()` for request-level deduplication (e.g. `findMediaById`, `getOrCreateProfile`).
  - Use Next.js `unstable_cache` with descriptive cache keys and revalidation tags (`explore`, `media-${id}`) for public catalog data.
  - Strictly isolate public cached data from user-specific state (`library`, `wishlist`, `ratings`).

### What to Avoid:
- **Never Block SSR on External APIs**: Do NOT await external network calls (TMDb, AniList, AI service) on the critical server rendering path if existing database records can be served immediately.
- **No Direct Fetching in Client Components When RSC is Available**: Avoid client-side `useEffect` data fetching waterfalls; leverage Next.js App Router data passing.
- **No Hardcoded URLs or Credentials**: Never hardcode localhost ports, email addresses, or API keys directly in source files. Always use environment variables (`process.env.*`).

---

## 2. Database & Connection Pool Rules (Prisma & PgBouncer)

### What to Do:
- **Use Narrow Selects**: When querying media lists, recommendation cards, or search results, always use a lean select (`narrowCardSelect`) containing only the 8–10 fields rendered by `MediaCard`.
- **Target Composite Keys Directly**: For user state (`user_library`, `wishlists`, `user_ratings`), target the `@@unique([userId, mediaId])` composite index directly using parameterized queries (`prisma.$queryRaw` with `Prisma.sql`) for O(1) B-tree lookups in 1 round trip.
- **Skip Redundant `COUNT(*)` Queries**: When fetching fixed-size discovery rows (e.g. 8 trending, 8 popular movies on the homepage), pass `{ skipCount: true }` to avoid executing expensive full-table count scans across the remote connection pool.
- **Evaluate Relation Joins Carefully**: Use `relationLoadStrategy: "join"` only on heavy detail pages where relational graph data is actually rendered. Avoid using it blindly on simple card lists.

### What to Avoid:
- **DO NOT Reintroduce Uncontrolled `Promise.all`**: Never run parallel unconstrained Prisma queries that exceed connection limits. The remote Supabase transaction pooler operates with `pool=20`. Uncontrolled concurrency triggers `P2024` connection timeouts and `P1001` unreachable database errors.
- **Do NOT Blindly Increase `connection_limit`**: Increasing pool size does not resolve network latency and will overwhelm PgBouncer.
- **Do NOT Scan Entire User Relations for a Single Item**: Never query `prisma.user.findUnique({ select: { library: true } })` and filter in memory when querying single-item state.
- **Do NOT Blindly Add Database Indexes**: Always inspect `EXPLAIN ANALYZE` before proposing schema index changes. An index that saves 2ms in PostgreSQL does not solve a 700ms remote network round-trip issue.

---

## 3. Libraries & Dependencies

### Approved Tech Stack:
| Category | Approved Library / Tool | Purpose & Usage Guidelines |
| :--- | :--- | :--- |
| **Framework** | `next@15.4.2` | App Router, Server Actions, `next/server` `after()`. |
| **UI Runtime** | `react@19.1.0`, `react-dom@19.1.0` | Server Components, Suspense streaming. |
| **Styling** | `tailwindcss@3.4`, `clsx`, `tailwind-merge` | Utility styling using the `cn()` helper. No ad-hoc CSS modules. |
| **Icons** | `lucide-react` | Standardized modern icons across the UI. |
| **Theming** | `next-themes` | Dark / Light theme provider with `attribute="class"`. |
| **Charts & Analytics** | `recharts` | Data visualization for viewing statistics and rating distributions. |
| **Auth & Client** | `@supabase/ssr`, `@supabase/supabase-js` | Server-side cookie session management. |
| **ORM** | `@prisma/client@6.12+`, `prisma` | Type-safe parameterized queries and schema management. |
| **Validation** | `zod`, `react-hook-form`, `@hookform/resolvers` | Strict validation for mutations, forms, and API routes. |
| **Logging** | `pino`, `pino-pretty` | Structured JSON logging with query latency warnings. |

### Forbidden Library Practices:
- Do NOT install alternative CSS frameworks (e.g. Bootstrap, Chakra UI, Emotion, styled-components).
- Do NOT install duplicate date/utility libraries (use `date-fns` and native `Intl`).
- Do NOT install client-side global state bloat (Redux, MobX) for data that belongs in Server Components or URL search params.

---

## 4. Error Handling & Resilience

### What to Do:
- **Graceful Fallbacks for External Microservices**: If the Python AI microservice (`http://127.0.0.1:8001`) is offline, unreachable, or exceeds its 500ms timeout budget, the application MUST instantly switch to deterministic algorithmic heuristics (Bayesian top-rated and genre matching) without user disruption.
- **In-Memory Fallbacks for Layout Profiles**: `getOrCreateProfile()` must return a valid in-memory fallback user object if transient database pooler congestion occurs, preventing layout-level HTTP 500 crashes.
- **Wrap Async Server Components in `<Suspense>`**: Heavy async components (e.g. `SuspendedCastAndPlatforms`, `SuspendedSimilarMedia`) must be wrapped in Suspense with animated skeleton fallbacks.
- **Structured Error Logging**: Log unexpected errors with contextual metadata using `logger.error({ msg, target, error })`.

### What to Avoid:
- **Do NOT Let Secondary Features Crash the Core Page**: A failure in cast synchronization, recommendations, or streaming badges must never prevent the main media synopsis and action buttons from rendering.
- **Do NOT Swallow Critical Errors Without Diagnostics**: Always log caught errors in server actions and background tasks so issues are traceable.
- **Do NOT Show Raw Error Stacks to End Users**: Always render human-friendly error messages with retry actions in error boundaries (`error.tsx`).

---

## 5. Boundaries & Rules for AI Coding Agents

### 1. Empirical Verification & Benchmarking
- **Never Claim Performance Without Real Measurements**: Do NOT report that an optimization reduced latency to "3 seconds" based on individual Prisma query logs. The authoritative metric is the **actual user-perceived warm HTTP response time** across multiple runs.
- **Always Run 5-Iteration Warm Benchmarks**:
  - Run 1 warmup request to allow Next.js route compilation.
  - Run 5 consecutive warm requests.
  - Report Minimum, Average, Median, and Maximum.
- **Distinguish Infrastructure from Application Latency**:
  - Report **Local Application Processing Time** (SSR, component rendering, serialization: ~150–350ms).
  - Report **Remote Connection Pooler Floor** (~600–1,100ms per round trip to remote Supabase Sydney pooler).

### 2. Code Integrity & Clean Pair Programming
- **Preserve Existing Documentation & Comments**: Never strip out existing explanatory comments, types, or docstrings unless explicitly asked by the user.
- **Do NOT Propose `cd` Commands**: Always execute commands with explicit working directories (`Cwd`).
- **Do NOT Hallucinate APIs**: Verify package versions in `package.json` before utilizing experimental or newly introduced framework APIs.
- **Maintain Allowed Dev Origins**: Ensure any development IP address used to test the application (e.g. `10.210.172.208`, `192.168.1.7`) is configured in `allowedDevOrigins` in `next.config.ts` to prevent cross-origin dev asset blocking.

### 3. Change Review & Rollback Discipline
- **Explain Non-Obvious Rationale**: When making modifications, clearly state the root cause and why the specific solution preserves system stability.
- **Maintain Rollback Readiness**: If an optimization introduces connection starvation (`P2024`), layout crashes, or data regressions, immediately revert the change and document the findings.
