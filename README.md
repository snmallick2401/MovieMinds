<div align="center">

# 🎬 MovieMinds

### **Next-Gen Media Discovery, Social Community & Machine Learning Recommendation Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.25-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Security Audit](https://img.shields.io/badge/Security_Audit-0_Vulnerabilities-brightgreen?style=for-the-badge&logo=shield)](https://github.com/snmallick2401/MovieMinds)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

[**🌐 Live Application**](https://movie-minds-i3xt.vercel.app) • [**🤖 AI Microservice**](https://movieminds-mjsb.onrender.com) • [**📚 Swagger API Docs**](https://movieminds-mjsb.onrender.com/docs) • [**📐 Architecture Guide**](./Architecture.md)

</div>

---

## 📌 Overview

**MovieMinds** is a production-grade, full-stack media intelligence, social tracking, and recommendation platform tailored for cinema enthusiasts, anime fans, and TV series aficionados. It brings together a high-performance **Next.js 15 App Router frontend (React 19)** with a **dedicated Python FastAPI Machine Learning microservice** to deliver real-time personalized recommendations, interactive community forums, dynamic watch libraries, and a custom 7-point **Dragon Ball Rating System**.

Engineered from the ground up for high concurrency, sub-100ms response times, zero-vulnerability supply chain resilience, and defense-in-depth perimeter security.

---

## 🚀 Live Deployments

| Component | Provider | Live URL | Description |
| :--- | :--- | :--- | :--- |
| **Frontend & App Router** | Vercel | [movie-minds-i3xt.vercel.app](https://movie-minds-i3xt.vercel.app) | Production Next.js 15.5 deployment with Edge routing |
| **Python ML Engine** | Render | [movieminds-mjsb.onrender.com](https://movieminds-mjsb.onrender.com) | FastAPI scikit-learn recommendation & taste-match service |
| **Interactive API Docs** | Swagger UI | [movieminds-mjsb.onrender.com/docs](https://movieminds-mjsb.onrender.com/docs) | Interactive OpenAPI 3.0 documentation & testing sandbox |
| **Database & Auth** | Supabase | Managed Cloud | Multi-region PostgreSQL 16 with PgBouncer transaction pooling |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Tier (Browser & PWA)"]
        Browser["Modern Browser / Mobile PWA\n(Dark Glassmorphic UI, Optimistic State)"]
    end

    subgraph PerimeterTier ["Perimeter Security & Ingestion Tier"]
        Headers["Perimeter Headers Middleware\n(CSP, HSTS Preload, COOP, CORP, Nosniff)"]
        RateLimiter["In-Memory Sliding-Window Rate Limiters\n(Uploads, Follows, Auth, Sync, Logs)"]
    end

    subgraph AppTier ["Next.js 15 App Router (Vercel Serverless)"]
        RSC["React Server Components (RSC)\n+ Public Landing & Guest Browsing"]
        AuthGuards["Role & Session Access Control\n(Supabase SSR Auth, requireUser)"]
        API["REST API Endpoints & Route Handlers\n(Input Validation with Zod & Regex)"]
        CacheLayer["Multi-Tier Cache\n(unstable_cache + Tag Invalidation)"]
        Logger["Pino Logging Pipeline\n(Deep PII Redaction & Prisma Query Sanitizer)"]
    end

    subgraph DataTier ["Data & Session Tier (Supabase)"]
        SupaAuth["Supabase GoTrue Auth\n(JWT Cookies with Secure/SameSite Flags)"]
        PgBouncer["PgBouncer Transaction Pooler\n(Port 6543, Query Parallelization)"]
        Postgres[("PostgreSQL 16 Database\n(Prisma ORM 6.19 Join Strategy)")]
    end

    subgraph AITier ["ML Microservice Tier (Render)"]
        FastAPI["FastAPI Python 3.11 Service"]
        TFIDF["TF-IDF Vectorizer & Cosine Similarity"]
        TasteMatch["Taste Compatibility Engine\n(Privacy-Gated Social Vector Calculation)"]
    end

    subgraph ExternalCatalog ["External Ingestion Providers"]
        TMDB["TMDB API v3 (Movies & TV Series)"]
        AniList["AniList GraphQL (Anime & Manga)"]
    end

    Browser <--> Headers
    Headers <--> RateLimiter
    RateLimiter <--> RSC
    RateLimiter <--> API
    RSC <--> CacheLayer
    CacheLayer <--> PgBouncer
    API <--> AuthGuards
    AuthGuards <--> PgBouncer
    PgBouncer <--> Postgres
    Browser <--> SupaAuth
    API --> Logger
    RSC <-->|Non-blocking JSON RPC| FastAPI
    FastAPI <--> TFIDF
    FastAPI <--> TasteMatch
    API <-->|Timing-Safe Constant Digest Sync| ExternalCatalog
```

---

## ✨ Key Platform Features

### 1. 🌟 Public Landing Page & Frictionless Guest Browsing
* **Explore Without Logging In:** Guests can freely explore trending titles, search the full catalog, filter by genres/platforms, read reviews, browse discussions, inspect user profiles, and read anime/movie news without requiring an account.
* **Intelligent Hero & Navigation:** Dynamically adapts based on authentication status — displaying onboarding CTAs and platform highlights for visitors, or a personalized stat dashboard for authenticated members.
* **Graceful Feature Gating:** Attempting to rate a title, write a review, reply to a thread, or add to a watchlist smoothly redirects unauthenticated visitors to `/login?next=...`, retaining destination context post-login.

### 2. 🤖 Hybrid Machine Learning Recommendation Microservice
* **Content-Based Cosine Similarity:** Built with Scikit-Learn’s `TfidfVectorizer` and weighted linear kernel similarity across synopsis text, genre distributions, and production metadata.
* **Real-Time Taste Match Affinity:** Calculates compatibility percentages between any two users based on mutual favorites and watch affinity vectors.
* **Fault-Tolerant Fallback Architecture:** Proactively checks AI engine health (`checkAiEngineHealth`) and seamlessly falls back to database-level popularity algorithms if the microservice is temporarily unavailable.

### 3. 🐉 Custom 7-Ball Dragon Ball Rating System
* **Anime-Inspired 7-Point Scale:** Replaced generic 5-star ratings with a custom 7-point Dragon Ball rating system honoring anime culture.
* **3D Glassmorphic Visuals:** Multi-layer amber crystal orbs with silver-etched inactive stars, cascading fill animations (`calc(index * 35ms)`), and radiant outer glow.
* **Half-Ball Precision & Shenron Easter Egg:** Hitboxes supporting `0.5` increment precision, with an animated Shenron summon effect triggered upon rating a title a perfect 7.0.

### 4. 💬 Community Discussions, Reactions & Reputation
* **Deterministic BBCode AST Parser:** Custom $O(N)$ linear-time tokenizer and stack-based AST parser supporting `[b]`, `[i]`, `[u]`, `[s]`, `[quote=Author]`, `[spoiler]`, `[url]`, and `[img]` tags. ReDoS-immune and strictly depth-bounded (`MAX_BBCODE_DEPTH = 10`).
* **Interactive Forum Reactions:** Multi-emoji persistent reactions (`LIKE`, `HEART`, `FIRE`, `LAUGH`, `INSIGHTFUL`) with optimistic client updates and author reputation scoring (+2 for threads, +1 for replies and reactions).
* **Thread Locking & Spoilers:** Moderators can lock threads to disable composers; spoiler tags hide sensitive plot details behind interactive click-to-reveal toggles.

### 5. ⚡ High-Performance Database & Tagged Caching
* **Granular Tag Invalidation:** Leverages Next.js `unstable_cache` with tag-based invalidation (`user-profile`, `trending-now`, `taste-match-${id}`).
* **Relational Query Flattening:** Uses Prisma’s `relationLoadStrategy: "join"` and parameterized batch queries to eliminate N+1 latency bottlenecks.
* **Supabase Keep-Alive Automation:** Automated cron jobs ping the database weekly via GitHub Actions and Vercel Cron to prevent pause on inactivity.

---

## 🛡️ Enterprise Security Architecture (SOC Hardening)

MovieMinds underwent extensive security testing and vulnerability remediation across all application layers, resulting in **0 npm audit vulnerabilities** and robust protection against modern web threats:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             DEFENSE-IN-DEPTH PERIMETER                                   │
│                                                                                          │
│   [ Strict CSP & HSTS ] ──► [ Rate Limiters ] ──► [ Input Validation (Zod/Regex) ]       │
│                                                            │                             │
│   [ Zero-Leak Logging ] ◄── [ Prisma Query Scrubbing ] ◄───┴──► [ BOLA & Privacy Logic ] │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

| Security Identifier | Vulnerability Class | Mitigation & Implementation | Status |
| :--- | :--- | :--- | :---: |
| **VULN-01 & Class 2** | Broken Object-Level Authorization (CWE-639) & PII Leakage | Privacy toggles (`showRatings`, `libraryPublic`, `showActivity`) enforced server-side. Private watchlists/ratings filtered from activity feeds, author review ratings suppressed when private, and email addresses stripped for profile visitors. | **Resolved** |
| **VULN-02** | Perimeter HTTP Security Headers (CWE-1021 / CWE-693) | Canonical [`lib/security/headers.ts`](file:///c:/Dev/Projects/NextJS/MovieMinds/lib/security/headers.ts) injecting strict CSP (`frame-ancestors 'none'`, trusted CDN allowlist), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, 2-year HSTS preload, COOP, CORP, and Permissions-Policy. | **Resolved** |
| **VULN-03** | Denial of Service via Unbounded File Uploads (CWE-400 / CWE-770) | [`lib/validations/uploads.ts`](file:///c:/Dev/Projects/NextJS/MovieMinds/lib/validations/uploads.ts) pre-stream `Content-Length` inspection ($>5\text{MB}$ returns 413), file size bounding, MIME whitelist (`jpeg`, `png`, `webp`, `gif`), and upload rate limiting (20 req/min). | **Resolved** |
| **VULN-04** | Notification Flooding & Denial of Service Loop (CWE-799 / CWE-20) | [`lib/validations/social.ts`](file:///c:/Dev/Projects/NextJS/MovieMinds/lib/validations/social.ts) RFC 4122 UUID validation, self-follow guard, database target user check (preventing Prisma P2003 500 crash), follow notification deduplication, and unfollow cleanup. | **Resolved** |
| **VULN-05 & Class 1** | Sensitive Parameter & PII Exposure in Logs (CWE-532 / CWE-359) | Regex email PII scrubbing across strings and error stacks, Pino logger deep path redaction, and Prisma query parameter sanitization in [`lib/prisma.ts`](file:///c:/Dev/Projects/NextJS/MovieMinds/lib/prisma.ts). | **Resolved** |
| **VULN-06** | Supply Chain Vulnerabilities (CWE-1395) | Enforced npm `overrides` for PostCSS ($\ge 8.5.28$), Sharp ($\ge 0.35.4$), and DeepmergeTS ($\ge 8.0.2$), reducing `npm audit` findings from 6 high-severity issues to **0 vulnerabilities**. | **Resolved** |
| **Side-Channel Defense** | Timing Attack on Ingestion Secret (CWE-208) | Constant-time SHA-256 digest comparison using Node.js `crypto.timingSafeEqual` with minimum 32-character secret length enforcement. | **Resolved** |
| **ReDoS Defense** | Catastrophic Regex Backtracking (CWE-1333) | Linear-time $O(N)$ tokenizer and stack-based AST parser handling 50,000+ unclosed tags in $<2\text{ms}$. | **Resolved** |

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | Next.js 15.5.25 (App Router), React 19.1, Server Components (RSC) |
| **Language & Typing** | TypeScript 5.8 (Strict Mode), Python 3.11.9 |
| **Styling & UI Components** | Tailwind CSS 3.4, Lucide React, Class Variance Authority, Next-Themes |
| **Data Visualization** | Recharts 3.10 |
| **Validation & Schemas** | Zod 4.0 |
| **Backend API & Microservice** | Next.js Route Handlers, Node.js Server Actions, FastAPI, Uvicorn |
| **Machine Learning & Math** | Scikit-Learn, NumPy, Pandas, Pydantic v2 |
| **Database & ORM** | PostgreSQL 16, Prisma ORM 6.19.3, PgBouncer |
| **Authentication** | Supabase Auth SSR (GoTrue, JWT session cookies, Email/Password) |
| **Observability & Logging** | Pino 10.3, Pino-Pretty |
| **External Catalog APIs** | TMDB API v3, AniList GraphQL API |
| **Hosting & CI/CD** | Vercel (Frontend), Render (AI Engine), Supabase Cloud, GitHub Actions |

---

## 📂 Project Structure

```text
MovieMinds/
├── ai-engine/                      # 🤖 Python Machine Learning Microservice
│   ├── main.py                     # FastAPI application & route endpoints
│   ├── recommender.py              # TF-IDF & Cosine Similarity ML engine
│   ├── requirements.txt            # Microservice dependencies
│   └── .python-version             # Python 3.11 runtime pin
├── app/                            # ⚡ Next.js 15 App Router
│   ├── (auth)/                     # Auth pages (login, signup)
│   ├── (main)/                     # Main app layouts & public browsing routes
│   │   ├── community/              # Forums, thread details, composer
│   │   ├── explore/                # Catalog explorer & genre filters
│   │   ├── feed/                   # Social activity feed
│   │   ├── library/                # User watch status & collection
│   │   ├── media/[slug]/           # Media details, cast, reviews, discussions
│   │   ├── news/                   # Anime and movie news
│   │   ├── people/                 # User discovery & reviewers
│   │   ├── profile/                # Authenticated user settings & preferences
│   │   ├── stats/                  # Personal viewing analytics & charts
│   │   └── user/[username]/        # Public profiles & activity timelines
│   ├── api/                        # 31 Serverless API Route Handlers
│   ├── auth/callback/              # Supabase session exchange route
│   ├── globals.css                 # Dark-mode glassmorphism & Tailwind styles
│   └── layout.tsx                  # Root layout & providers
├── components/                     # 🧩 Reusable React 19 UI Components
│   ├── auth/                       # Clean email/password login & registration forms
│   ├── community/                  # BBCode AST parser, thread composer, like button
│   ├── home/                       # Responsive landing hero with guest/auth states
│   ├── layout/                     # AppShell, responsive sidebar, mobile drawer
│   ├── media/                      # RatingBadge, MediaCard, CastCarousel
│   ├── profile/                    # Profile tabs, follow button, stats cards
│   ├── ratings/                    # DragonBallRating modal & analytics
│   ├── reviews/                    # Review cards, forms, and rating stars
│   └── ui/                         # Accessible UI primitives (Button, Dialog, Input)
├── lib/                            # 🛠️ Shared Business Logic & Architecture
│   ├── ai/client.ts                # Non-blocking RPC client connecting Next.js to FastAPI
│   ├── anilist/                    # AniList GraphQL queries & types
│   ├── auth/                       # Supabase auth helpers & requireUser guards
│   ├── community/                  # Discussion actions & database queries
│   ├── media/                      # Media sync, serialization, and ingestion
│   ├── prisma.ts                   # Prisma client singleton with query sanitization
│   ├── security/                   # 🛡️ Security Infrastructure
│   │   ├── credentials.ts          # Class 1/PII scrubbing & secret validation
│   │   └── headers.ts              # Canonical HTTP perimeter headers & CSP
│   ├── tmdb/                       # TMDB API v3 client
│   └── validations/                # 🛡️ Ingestion Schemas & Boundary Guards
│       ├── auth.ts                 # Safe relative redirect verification
│       ├── discussions.ts          # Thread and reply character bounding
│       ├── social.ts               # Follow UUID validation & self-follow guard
│       └── uploads.ts              # File size, MIME whitelist & upload rate limit
├── prisma/                         # 🗄️ Database Schemas & Migrations
│   └── schema.prisma               # PostgreSQL relational schema definition
└── scratch/                        # 🧪 Verification & Security Test Suites
```

---

## ⚙️ Local Development Setup

### Prerequisites
* **Node.js**: `v20.x` or higher
* **Python**: `v3.11.x`
* **PostgreSQL Database** or a free [Supabase](https://supabase.com) project

---

### 1. Clone the Repository
```bash
git clone https://github.com/snmallick2401/MovieMinds.git
cd MovieMinds
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Supabase & Database (Pooled & Direct)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# Media Catalog APIs
TMDB_API_KEY=your-tmdb-v3-api-key
ANILIST_API_URL=https://graphql.anilist.co

# Microservice & Internal Secrets
AI_ENGINE_URL=http://127.0.0.1:8001
CATALOG_SYNC_SECRET=your-minimum-32-char-random-secret-key-12345
LOG_LEVEL=info
```

### 3. Install Dependencies & Setup Database
```bash
# Install Node dependencies with overrides
npm install

# Generate Prisma Client & Sync Schema
npx prisma generate
npx prisma db push
```

### 4. Start Next.js Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 5. Start the Python AI Engine
In a separate terminal:
```bash
cd ai-engine

# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --host 127.0.0.1 --port 8001
```
The AI Engine will be live at `http://127.0.0.1:8001` with Swagger docs at `http://127.0.0.1:8001/docs`.

---

## 🧪 Verification & Security Test Suite

The repository includes automated verification scripts testing all security boundaries and regression gates:

```bash
# Verify 0 supply-chain vulnerabilities
npm audit

# Run strict TypeScript type check (0 errors)
npm run typecheck

# Run ESLint linter (0 errors, 0 warnings)
npm run lint

# Run production build compilation (22 pages / 31 API routes)
npm run build

# Run targeted security test suites:
npx tsx scratch/test-supply-chain.ts         # Supply chain overrides & lockfile verification (VULN-06)
npx tsx scratch/test-credentials-security.ts # Logging PII redaction & Prisma params sanitization (VULN-05)
npx tsx scratch/test-vuln04-follow.ts        # Social follow flood & P2003 crash prevention (VULN-04)
npx tsx scratch/test-vuln03-upload.ts        # 5MB upload size & MIME type validation (VULN-03)
npx tsx scratch/test-security-headers.ts     # CSP, HSTS, X-Frame-Options, and nosniff (VULN-02)
npx tsx scratch/test-class2-privacy.ts       # Activity feed & review rating privacy (Class 2)
npx tsx scratch/test-ratings-privacy.ts      # User ratings access scoping matrix (VULN-01)
npx tsx scratch/test-bbcode-full.ts          # Linear-time BBCode parser ReDoS stress test
```

---

## 👨‍💻 Author

**S N Mallick**
* GitHub: [@snmallick2401](https://github.com/snmallick2401)
* Project Repository: [MovieMinds](https://github.com/snmallick2401/MovieMinds)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
