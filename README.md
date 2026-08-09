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

## Deployment

Deploy the repository to Vercel, configure the three environment variables in Vercel project settings, and add your production `https://your-domain/auth/callback` redirect URL in Supabase. Run the profile SQL migration once in the production Supabase project.
