<div align="center">

# 🎬 MovieMinds

### **Next-Gen Media Discovery, Community Platform & AI Recommendation Microservice**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[**🌐 Live Application**](https://movie-minds-i3xt.vercel.app) • [**🤖 AI Microservice**](https://movieminds-mjsb.onrender.com) • [**📚 Swagger API Docs**](https://movieminds-mjsb.onrender.com/docs) • [**📐 Architecture**](./Architecture.md)

</div>

---

## 📌 Overview

**MovieMinds** is a production-grade, full-stack media intelligence and social tracking ecosystem designed for cinema enthusiasts, anime fans, and TV show aficionados. It seamlessly integrates a **Next.js 15 Server Components frontend** with a **dedicated Python FastAPI Machine Learning microservice** to deliver real-time personalized recommendations, interactive community forums, dynamic watch libraries, and a custom 7-point **Dragon Ball Rating System**.

Built from the ground up for high throughput, sub-100ms response times, and resilient caching against third-party API rate limits (TMDB & AniList).

---

## 🚀 Live Deployments

| Component | Platform | URL |
| :--- | :--- | :--- |
| **Full-Stack Next.js App** | Vercel | [https://movie-minds-i3xt.vercel.app](https://movie-minds-i3xt.vercel.app) |
| **Python ML AI Engine** | Render | [https://movieminds-mjsb.onrender.com](https://movieminds-mjsb.onrender.com) |
| **Interactive API Docs** | Swagger UI | [https://movieminds-mjsb.onrender.com/docs](https://movieminds-mjsb.onrender.com/docs) |
| **PostgreSQL & Auth** | Supabase | Multi-region pooled Postgres with PgBouncer |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Tier"]
        Browser["Modern Browser / Mobile PWA\n(Dark-First Glassmorphic UI)"]
    end

    subgraph AppTier ["Next.js 15 App Router (Vercel)"]
        RSC["React Server Components (RSC)\n+ Static/Dynamic SSR Pages"]
        Middleware["Auth Session & Route Guard Middleware"]
        API["REST API Endpoints & Route Handlers"]
        CacheLayer["Multi-tier Cache (unstable_cache + In-Memory)"]
    end

    subgraph DataTier ["Data & Auth Tier (Supabase)"]
        SupaAuth["Supabase GoTrue (OAuth & Password Auth)"]
        PgBouncer["PgBouncer Transaction Pooler (Port 6543)"]
        Postgres[("PostgreSQL Database\n(Prisma ORM with Joined Relations)")]
    end

    subgraph AITier ["Machine Learning Microservice (Render)"]
        FastAPI["FastAPI Python 3.11 Microservice"]
        Recommender["TF-IDF Vectorizer + Cosine Similarity Engine"]
        TasteMatcher["User Taste Compatibility Matrix"]
    end

    subgraph ExternalServices ["External Catalog Providers"]
        TMDB["TMDB API v3 (Movies & TV Series)"]
        AniList["AniList GraphQL API (Anime & OVAs)"]
    end

    Browser <--> Middleware
    Middleware <--> RSC
    RSC <--> CacheLayer
    CacheLayer <--> PgBouncer
    API <--> PgBouncer
    PgBouncer <--> Postgres
    Browser <--> SupaAuth
    RSC <-->|Non-blocking JSON RPC| FastAPI
    API <-->|Catalog Sync & Ingestion| ExternalServices
    FastAPI <--> Recommender
    FastAPI <--> TasteMatcher
```

---

## ✨ Key Engineering Features

### 1. 🤖 Hybrid Machine Learning Recommendation Microservice
* **Content-Based & Affinity Modeling:** Powered by Scikit-Learn's `TfidfVectorizer` and weighted cosine similarity algorithms analyzing genres, plot synopses, user ratings, and watch progress.
* **Real-Time Taste Match Scoring:** Computes instant social affinity percentages between any two user profiles based on shared favorites and interaction matrices.
* **Fault-Tolerant Fallback Architecture:** Features automatic health check pinging (`checkAiEngineHealth`) that smoothly fails over to database-level popularity algorithms if the ML microservice is unreachable.

### 2. 🐉 Interactive 7-Ball Dragon Ball Rating System
* **7-Point Scale:** Replaced generic 5/10 star systems with a custom 7-point Dragon Ball scale honoring anime & cinema culture.
* **3D Glassmorphic Components:** High-contrast slate crystal base with silver-etched stars in inactive states, cascading sequential fills (`calc(index * 35ms)`), and radiant amber glow (`box-shadow: 0 0 16px rgba(255, 150, 0, 0.45)`).
* **Shenron 7.0 Easter Egg:** Dynamic CSS summon animation triggered when a title receives a perfect 7.0 rating.
* **Half-Ball Precision & Idempotent Migrations:** Built-in precision hitboxes supporting `0.5` increments backed by database scale watermarks.

### 3. ⚡ High-Performance Database & Caching (Phase 7 Optimization)
* **Tag-Based Cache Invalidation:** Multi-tier Next.js `unstable_cache` layer with granular tag revalidation (`user-profile`, `trending-now`, `taste-match`).
* **Relational Query Flattening:** Utilizes Prisma's `relationLoadStrategy: "join"` and parameterized `$queryRaw` batching to eliminate N+1 latency bottlenecks.
* **Connection Pool Hardening:** Configured with PgBouncer connection timeouts, in-memory circuit breakers, and async metadata hydration via React `after()` hooks.

### 4. 🧭 SEO-First Slug Routing & Canonical Redirects
* **Search Engine Optimized URLs:** Transitions media detail URLs from database CUIDs to readable slugs (e.g. `/media/spider-man-no-way-home`).
* **Zero Broken Links:** Dual-lookup resolver supporting permanent 308 redirects from legacy IDs to canonical slugs.

### 5. 💬 Rich Community & Social Network
* **Interactive Discussion Threads:** Nested reply chains, BBCode text parser (`[b]`, `[i]`, `[quote]`, `[spoiler]`), and dynamic user mentions.
* **Emoji Reaction Engine:** Optimistic UI state updates for post reactions (`LIKE`, `HEART`, `FIRE`, `LAUGH`, `INSIGHTFUL`).
* **Personalized User Profiles:** Dynamic watch timeline, stats distribution charts (Recharts), favorite creators, and public library toggles.

### 6. 📺 "Where to Watch" Streaming Aggregator
* Displays direct streaming links for Netflix, Disney+, Prime Video, Apple TV+, and region-specific providers with high-contrast badge enclosures.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | Next.js 15.5 (App Router), React 19, Server Components (RSC) |
| **Language & Typing** | TypeScript 5.8 (Strict Mode), Python 3.11 |
| **Styling & UI** | Tailwind CSS 3.4, Lucide Icons, Class Variance Authority, Next-Themes |
| **Data Visualization** | Recharts 3.10 |
| **Backend & Microservice** | Node.js Server Actions, FastAPI, Uvicorn |
| **Machine Learning** | Scikit-Learn, NumPy, Pandas, Pydantic v2 |
| **Database & ORM** | PostgreSQL 16, Prisma ORM 6.19, PgBouncer |
| **Authentication** | Supabase Auth (GoTrue, JWT, Google OAuth, Email/Password) |
| **External APIs** | TMDB API v3, AniList GraphQL API |
| **Infrastructure & CI/CD** | Vercel (Frontend & Serverless), Render (AI Web Service), Supabase Cloud |

---

## 📂 Project Structure

```text
MovieMinds/
├── ai-engine/                      # 🤖 Python Machine Learning Microservice
│   ├── main.py                     # FastAPI server & route handlers
│   ├── recommender.py              # TF-IDF & Cosine Similarity ML engine
│   ├── requirements.txt            # Microservice dependencies
│   └── .python-version             # Python 3.11.9 runtime pin
├── app/                            # ⚡ Next.js 15 App Router
│   ├── (auth)/                     # Auth routes (login, signup, callback)
│   ├── (main)/                     # Main app layout (feed, explore, library, stats, profile)
│   │   ├── media/[slug]/           # Dynamic media overview, cast, & community pages
│   │   └── user/[username]/        # Public social profile & activity views
│   ├── api/                        # Next.js Serverless API endpoints
│   ├── globals.css                 # Global Tailwind styles & dark variables
│   └── layout.tsx                  # Root layout & providers
├── components/                     # 🧩 Reusable React 19 UI Components
│   ├── auth/                       # Login & signup forms
│   ├── community/                  # Forum composer, BBCode parser, post cards
│   ├── icons/                      # DragonBall SVG & themed graphics
│   ├── layout/                     # AppShell, Navigation, Santoryu Mobile Menu
│   ├── media/                      # RatingBadge, MediaCard, CastCarousel
│   ├── ratings/                    # DragonBallRating modal & analytics cards
│   └── ui/                         # Accessible primitives (Button, Input, Avatar)
├── lib/                            # 🛠️ Shared Business Logic & Utilities
│   ├── ai/client.ts                # RPC client connecting Next.js to FastAPI
│   ├── anilist/                    # AniList GraphQL client
│   ├── auth/                       # Supabase server/client authentication helpers
│   ├── media/                      # Media queries, serializers, and sync pipelines
│   ├── prisma.ts                   # Prisma client singleton
│   └── tmdb/                       # TMDB API v3 client
├── prisma/                         # 🗄️ Database Schemas & Migrations
│   └── schema.prisma               # Prisma relational data model
└── scripts/                        # 🔧 Data maintenance & backfill CLI scripts
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
Create a `.env.local` file in the project root:
```env
# Supabase & Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# Media Catalog APIs
TMDB_API_KEY=your-tmdb-api-key
ANILIST_API_URL=https://graphql.anilist.co

# Microservice & Security
AI_ENGINE_URL=http://127.0.0.1:8001
CATALOG_SYNC_SECRET=your-secure-random-secret
```

### 3. Install Dependencies & Setup Database
```bash
# Install Node dependencies
npm install

# Generate Prisma Client & Push Schema
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

# Create & activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --host 127.0.0.1 --port 8001
```
The AI Engine will be live at `http://127.0.0.1:8001` with interactive API docs at `http://127.0.0.1:8001/docs`.

---

## 🧪 Testing & Code Quality

```bash
# Run strict TypeScript type checking
npm run typecheck

# Run ESLint validation
npm run lint

# Format code with Prettier
npm run format

# Run local production build check
npm run build
```

---

## 👨‍💻 Author

**S N Mallick**
* GitHub: [@snmallick2401](https://github.com/snmallick2401)
* Project Repository: [MovieMinds](https://github.com/snmallick2401/MovieMinds)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
