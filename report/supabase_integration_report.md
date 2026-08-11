# MovieMinds: Supabase Integration & Architecture Report

This report provides a detailed breakdown of how **Supabase** is integrated, configured, and utilized within the **MovieMinds** application architecture.

---

## Executive Summary

Supabase serves as the core backend infrastructure provider for MovieMinds, handling two critical foundational pillars:
1. **Authentication & Session Management**: Utilizing Supabase Auth (`@supabase/ssr`) for cookie-based SSR session handling, user identity, and route protection.
2. **Database Hosting & Infrastructure**: Hosting the PostgreSQL database that powers the application, connected via Prisma ORM using dual connection strategies (PgBouncer Pooler & Direct PostgreSQL connections).

---

## 1. Authentication & Session Management (`Supabase Auth`)

MovieMinds uses `@supabase/ssr` to achieve seamless, secure Server-Side Rendered authentication across Next.js 15 App Router components, API routes, and Middleware.

### A. Client & Server Integration
- **Browser Client (`lib/supabase/client.ts`)**: Uses `createBrowserClient` to handle client-side operations such as user login, signup, password resets, and sign-out.
- **Server Client (`lib/supabase/server.ts`)**: Uses `createServerClient` with Next.js `cookies()` to inspect user sessions securely inside Server Components and Server Actions.
- **Auth Callback Handler (`app/auth/callback/route.ts`)**: Exchanges auth code grants for session cookies during authentication flows.

### B. Route Protection via Middleware (`middleware.ts`)
- The Next.js middleware intercepts all incoming HTTP requests.
- It instantiates a Supabase server client, calls `supabase.auth.getUser()`, and validates authentication state.
- **Protected Routes** (`/`, `/explore`, `/library`, `/community`, `/profile`): Unauthenticated users are automatically redirected to `/login?next=<path>`.
- **Guest-Only Routes** (`/login`, `/signup`): Authenticated users are automatically redirected to the dashboard (`/`).

### C. Identity Linkage with Application Database
- The primary key of the custom user profile table (`profiles.id`) uses `@db.Uuid` and is explicitly mapped 1:1 with Supabase Auth's `auth.users.id`.
- When a user registers, their Supabase Auth `UUID` becomes the primary key across all relational user data (`user_library`, `user_ratings`, `reviews`, `watch_history`, `wishlists`, `user_favorites`, `activities`).

---

## 2. Database Hosting & Connection Architecture (`Supabase PostgreSQL`)

MovieMinds uses Supabase Cloud as its managed PostgreSQL database provider. Database access is managed using **Prisma ORM** with a specialized dual-connection pattern.

### A. Dual Connection String Setup (`.env` / `.env.local`)
1. **Pooled Connection (`DATABASE_URL`)**:
   - **Port**: `6543` (Supabase PgBouncer / Transaction Pooler).
   - **URL Format**: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5`
   - **Purpose**: Used for runtime application queries (Next.js server components, API routes, background sync tasks).
   - **Pool Limits**: Strict `connection_limit=5` configured to ensure Next.js HMR and parallel SSR queries never exceed Supabase Free Tier session limits (`pool_size: 15`), preventing `EMAXCONNSESSION` database errors.

2. **Direct Connection (`DIRECT_URL`)**:
   - **Port**: `5432` (Direct PostgreSQL connection).
   - **URL Format**: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
   - **Purpose**: Used exclusively by Prisma CLI (`prisma db push`, `prisma migrate`, `prisma studio`) to execute DDL statements and schema modifications without going through PgBouncer.

---

## 3. Database Schema & Data Models (`prisma/schema.prisma`)

All data stored in Supabase PostgreSQL is structured around the following domain modules:

| Domain Area | Tables in Supabase Postgres | Functionality |
| :--- | :--- | :--- |
| **Users & Auth** | `profiles` | User profiles, bio, avatar, preferences, privacy settings linked to Supabase Auth. |
| **Catalog & Media** | `media`, `genres`, `media_genres` | Movies, TV Shows, Anime metadata from TMDb & AniList. |
| **Cast & Crew** | `people`, `media_people` | Actors, Directors, Voice Actors (Seiyū), and Crew relationships. |
| **Streaming** | `streaming_platforms`, `media_platforms` | Global streaming availability links (Netflix, Hulu, Crunchyroll, etc.). |
| **User Library** | `user_library`, `watch_history`, `wishlists` | Episode progress, status (Watching, Completed), watch history, wishlists. |
| **Social & Ratings** | `user_ratings`, `reviews`, `activities`, `user_favorites` | User 1-10 star ratings, reviews, taste profile calculation data, activity feeds. |
| **Sync System** | `catalog_syncs` | System logs tracking automated TMDb/AniList background ingestion progress. |

---

## 4. Key Security & Best Practices Implemented

1. **Environment Variable Separation**: Public credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are exposed safely to the browser, while database credentials (`DATABASE_URL`, `DIRECT_URL`) remain isolated on the server side.
2. **Session Cookie Management**: Automatic cookie refreshing in Next.js Middleware prevents expired session token issues during continuous browsing.
3. **Connection Throttle Guards**: Reduced connection pool limits (`connection_limit=5`) prevent connection starvation across serverless functions and development server restarts.
