# MovieMinds

MovieMinds is a unified media recommendation and community platform for movies, anime, television, documentaries, and other visual media. It establishes a complete account system, responsive application shell, and dark-first design system.

## Project Documentation

This repository contains comprehensive documentation guiding the development, architecture, and design of MovieMinds. Please refer to the following documents for detailed information:

- [**Product Requirements Document (PRD)**](./PRD.md): Outlines the features, functional requirements, and target audience.
- [**Architecture**](./Architecture.md): Details the technical stack, database schema, data flow, and infrastructure (Next.js, Prisma, PostgreSQL, Supabase, Python AI Engine).
- [**Development Rules**](./rules.md): Coding standards, best practices, and conventions for contributing to the codebase.
- [**Project Phases**](./phases.md): The roadmap breaking down development milestones from v0.1.0 through advanced future features.
- [**Design System**](./design.md): Color themes, typography, and component guidelines ensuring a consistent dark-first UI.

## v0.6.0 - Performance Hardening & Scale Readiness

MovieMinds `0.6.0` marks the completion of Phase 7 optimizations, achieving massive performance improvements:
- Deep Next.js caching optimization with statically declared `unstable_cache`.
- PostgreSQL query reduction using `relationLoadStrategy: "join"` and parameterized `$queryRaw` batching.
- Resilience hardening against Supabase pooler timeouts using Try/Catch boundaries and in-memory fallbacks.
- Non-blocking provider metadata hydration via React `after()` hooks.
- Complete system documentation mapping for scaling and team expansion.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in your Supabase URL, anon key, and PostgreSQL connection string. (Also verify `DATABASE_URL` uses the pooler endpoint and includes `&connect_timeout=20`).
2. In Supabase Dashboard, enable **Email** and **Google** providers under Authentication. Add `http://localhost:3000/auth/callback` to Authentication → URL Configuration → Redirect URLs.
3. Open Supabase SQL Editor and run [`supabase/migrations/0001_create_profiles.sql`](./supabase/migrations/0001_create_profiles.sql). This is essential: it keeps auth identities and public profiles synchronized.
4. Install dependencies and prepare the Prisma client:

```bash
npm install
npm run prisma:generate
npm run prisma:push
```

5. Start the Next.js application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if 3000 is occupied). Sign up using email/password or Google; protected routes will redirect unauthenticated users to `/login`.

### Running the Python AI Engine

MovieMinds features an advanced Python **FastAPI + Machine Learning** microservice running alongside the Next.js App Router for personalized recommendations, semantic similarity, and taste matching.

1. Navigate to the `ai-engine` folder and install dependencies:
```bash
cd ai-engine
pip install -r requirements.txt
```

2. Start the FastAPI microservice:
```bash
# On Windows (PowerShell)
.\run.ps1

# Or with Uvicorn directly
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

The microservice will be live at `http://127.0.0.1:8001` with interactive Swagger docs at `http://127.0.0.1:8001/docs`.

## Useful commands

```bash
npm run dev             # development server
npm run typecheck       # strict TypeScript check
npm run lint            # ESLint
npm run format:check    # Prettier verification
npm run prisma:generate # generate Prisma Client
npm run prisma:push     # sync schema during local prototyping
```

## Deployment

Deploy the repository to Vercel, configure the three environment variables in Vercel project settings, and add your production `https://your-domain/auth/callback` redirect URL in Supabase. Run the profile SQL migration once in the production Supabase project. Ensure your production `DATABASE_URL` utilizes the Supabase connection pooler strings.
