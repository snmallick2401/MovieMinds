# MovieMinds

MovieMinds is a unified media recommendation and community platform for movies, anime, television, documentaries, and other visual media. Phase 1 establishes the account system, profile model, responsive application shell, and dark-first design system for the product roadmap.

## Phase 1: v0.1 – Authentication System

- Supabase email/password authentication and Google OAuth
- Protected App Router routes with persistent, refreshed sessions
- Automatic `profiles` record creation with a Supabase database trigger
- Editable user profile with username uniqueness checks
- Responsive sidebar/mobile navigation and persistent dark mode
- Prisma/PostgreSQL foundation ready for catalog, lists, reviews, and recommendations

## Stack

Next.js 15 App Router · TypeScript (strict) · Tailwind CSS · reusable shadcn-style UI primitives · Supabase Auth · PostgreSQL · Prisma · React Hook Form + Zod · Lucide icons.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in your Supabase URL, anon key, and PostgreSQL connection string.
2. In Supabase Dashboard, enable **Email** and **Google** providers under Authentication. Add `http://localhost:3000/auth/callback` to Authentication → URL Configuration → Redirect URLs.
3. Open Supabase SQL Editor and run [`supabase/migrations/0001_create_profiles.sql`](./supabase/migrations/0001_create_profiles.sql). This is essential: it keeps auth identities and public profiles synchronized.
4. Install and generate Prisma:

```bash
npm install
npm run prisma:generate
```

5. Start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up using email/password or Google; protected routes will redirect unauthenticated users to `/login`.

### Add a development test account

After replacing the placeholder Supabase values and running the profile migration, open Supabase Dashboard → Authentication → Users → **Add user**. Use `user@gmail.com` and `User@2401`, then mark the email as confirmed for local testing. The database trigger creates the matching profile automatically. Do not commit these credentials or add them to source code; rotate them before sharing the project.

## Environment variables

| Variable                        | Purpose                              |
| ------------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase browser/server anon key     |
| `DATABASE_URL`                  | PostgreSQL connection used by Prisma |

For Supabase, use its connection pooler string in development and serverless deployments. Never commit `.env.local`.

## Useful commands

```bash
npm run dev             # development server
npm run typecheck       # strict TypeScript check
npm run lint            # ESLint
npm run format:check    # Prettier verification
npm run prisma:generate # generate Prisma Client
npm run prisma:push     # sync schema during local prototyping
```

## Architecture notes

`auth.users` remains the authority for credentials and sessions; `public.profiles` contains application-facing user data. The Supabase trigger creates the profile on every registration, and Prisma maps the `User` model to `profiles`. This keeps future application models simple: they can use `User.id` as a direct foreign key to the Supabase Auth UUID.

The `(main)` route group owns the authenticated shell, leaving future modules isolated by domain. Supabase clients are separated by browser/server context, while the middleware refreshes sessions and enforces protected routes before rendering.

## Phase 2: v0.2 - Media Catalog and Discovery

Phase 2 turns MovieMinds into a local-first, unified catalog. TMDb is used for films and television; AniList supplies anime series, anime films, OVAs, and specials. Provider records are normalized before storage so UI code, search, filtering, and future recommendation features work with one `Media` shape rather than provider-specific responses.

### Provider setup

1. Create a free account at [TMDb](https://www.themoviedb.org/settings/api) and add its API key as `TMDB_API_KEY`.
2. AniList does not require a key for the public GraphQL reads used by this project. Keep `ANILIST_API_URL=https://graphql.anilist.co` unless you deliberately use a proxy.
3. Set a random `CATALOG_SYNC_SECRET`. It protects the server-only synchronization route.
4. Apply the updated Prisma schema after running the Phase 1 Supabase SQL migration:

```bash
npm run prisma:generate
npm run prisma:push
```

For a migration-managed workflow, use `npm run prisma:migrate` instead of `prisma:push`.

### Sync strategy

MovieMinds never calls provider APIs while rendering a normal catalog page. The PostgreSQL `media` table is the source of truth. A protected sync endpoint imports a requested provider collection, upserts every title by its provider identity (`source + sourceId`), refreshes its genres and streaming availability, then invalidates the catalog cache.

```bash
curl -X POST http://localhost:3000/api/catalog/sync \
  -H "Authorization: Bearer $CATALOG_SYNC_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"collection":"trending","page":1}'
```

Allowed collections are `trending`, `popular`, `top_rated`, and `upcoming`. Schedule this endpoint with a cron service or platform scheduler; it is intentionally separate from page rendering so provider quotas and visitor traffic cannot affect each other.

### Catalog architecture

`Media`, `Genre`, `MediaGenre`, `StreamingPlatform`, and `MediaPlatform` represent the catalog. `CatalogSync` stores sync checkpoints. `Media` indexes support common discovery paths (type/popularity, status/release date, year, language, and country), while the composite provider key prevents duplicate imports. The schema also retains provider data, alternate titles, and platform relations needed by future libraries and recommendation features.

### Search and filtering

The header and Explore search box offer debounced suggestions from `/api/search`; recent searches are stored locally in the browser. Explore uses URL search parameters for all filter state, so results are linkable and recover on refresh. `/api/media`, `/api/media/[id]`, `/api/genres`, and `/api/discover` provide typed local-catalog responses for future clients.

The current similarity strategy prioritizes shared genres, then media type and language, ordered by popularity and rating. It is deliberately isolated in `lib/media/queries.ts` so a future recommendation engine can replace it without changing media pages.

## Phase 3: v0.3 - Personal Library

Phase 3 adds a user-owned tracking layer over the shared catalog. Every library entry has exactly one state (`Watching`, `Completed`, `Plan to watch`, `On hold`, or `Dropped`), episode progress, completion dates, rewatch count, and favorite status. Ratings use half-point values from 0.5 to 10; reviews support spoiler and public/private visibility; wishlists preserve priority and order.

Run the Prisma update before using Phase 3 routes:

```bash
npm run prisma:generate
npm run prisma:push
```

The authenticated API surface is `/api/library`, `/api/wishlist`, `/api/ratings`, and `/api/reviews`, including ownership-checked item routes. Media detail pages use these endpoints directly. `/library` is the personal dashboard, `/stats` uses Recharts for viewing trends, and `/user/[username]` exposes only public-library data and public reviews. Toggle public visibility in Profile settings.

## Phase 4: v0.4.1 - Reviews

Reviews are now a dedicated, server-rendered media feature. Each user can keep one review per title, with optional headline, spoiler protection, visibility, edit timestamps, and their personal rating. The media page fetches reviews in pages of 20 and always highlights the current user’s review.

`POST /api/reviews`, `PUT /api/reviews/[id]`, and `DELETE /api/reviews/[id]` require an authenticated owner. `GET /api/media/[id]/reviews?page=1` is available to visitors and returns public reviews plus the signed-in user’s private review when applicable. The review editor saves unfinished drafts locally in the browser; spoiler text remains hidden until the reader chooses to reveal it.

## Deployment

Deploy the repository to Vercel, configure the three environment variables in Vercel project settings, and add your production `https://your-domain/auth/callback` redirect URL in Supabase. Run the profile SQL migration once in the production Supabase project.
