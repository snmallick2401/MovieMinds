# MovieMinds — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved / In Production  
**Last Updated:** August 2026  
**Author:** Product & Engineering Team  

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
**MovieMinds** is an all-in-one cinematic tracking, recommendation, and social discovery platform. It unifies global cinema, television, anime, and documentaries into a unified, high-performance web experience. By combining multi-source catalog synchronization (TMDb and AniList) with machine-learning-powered recommendation models and rich community interactions, MovieMinds serves as the ultimate companion for cinephiles, anime enthusiasts, and casual viewers alike.

### 1.2 Core Value Proposition
- **Unified Catalog**: Seamlessly browse movies, TV series, anime, OVAs, and documentaries in one place without switching apps.
- **Deep Tracking**: Track watch statuses, episodes, re-watches, custom ratings, and wishlists with granular control.
- **AI-Powered Discovery**: Item-to-item semantic similarity, personalized recommendations, and user-to-user taste compatibility matching.
- **Social & Community**: Follow fellow cinephiles, share reviews with spoiler protection, participate in threaded discussions, and stay updated via activity feeds.
- **Where to Watch**: Instant access to regional streaming availability (Netflix, Prime Video, Disney+, Apple TV+, etc.).

---

## 2. Target Audience & User Personas

### 2.1 Target Market
1. **Avid Cinephiles & TV Bingers**: Users who watch multiple shows/movies weekly and need a central hub to organize their collection and review titles.
2. **Anime & International Media Fans**: Viewers who consume Japanese animation, OVAs, and international cinema that standard movie apps frequently neglect.
3. **Casual Viewers Looking for Recommendations**: Users overwhelmed by choice across streaming services seeking high-confidence recommendations.
4. **Community Contributors & Reviewers**: Enthusiasts who want to write detailed critiques, discuss cinematic theories, and connect with like-minded fans.

### 2.2 User Personas

| Persona | Motivation | Pain Points Solved | Key Features Used |
| :--- | :--- | :--- | :--- |
| **Alex (The Dedicated Tracker)** | Tracks 50+ anime and TV seasons annually; wants clean progress logging. | Spreadsheets are tedious; generic apps miss anime details or episode counts. | Personal Library, Episode Progress, Status Tabs, Re-watch Counter. |
| **Samantha (The Film Critic)** | Writes in-depth spoiler-free & spoiler-tagged reviews; loves analyzing trends. | Review sections lack formatting and community engagement; ratings lack granularity. | 0.5–10.0 Ratings, Markdown Reviews, Discussion Forums, Profile Showcases. |
| **Jordan (The Casual Streamer)** | Wants to find what to watch tonight and where it is currently streaming. | "Streaming paralysis"; jumping between 5 different streaming apps to find availability. | AI Recommendations, Trending Row, "Where to Watch" Platform Badges. |
| **Marcus & Elena (Social Cinephiles)** | Enjoy sharing viewing habits and seeing what friends are watching. | Disconnected social media apps; no way to measure taste alignment with friends. | Follow System, Activity Feed, User-to-User Taste Match (AI). |

---

## 3. Detailed Feature Specifications

### 3.1 Authentication & User Profiles
- **Authentication**: Secure email/password login and registration powered by Supabase Auth with server-side session cookies.
- **Profile Customization**:
  - Display Name, unique `@username`, and Bio (up to 500 chars).
  - Custom Profile Banner URL and Avatar URL.
  - Accent Color picker for personal profile theming.
  - Favorite Genres, Favorite Creators, and Preferred Streaming Services tags.
  - Privacy toggles: public/private library, toggle visibility for ratings, reviews, stats, activity, and favorites.
- **Reputation System**: Community reputation score earned through discussions, helpful reviews, and engagement.

### 3.2 Multi-Source Catalog & Exploration Engine
- **Data Ingestion**: Dual-source synchronization:
  - **TMDb**: Mainstream feature films, television series, documentaries.
  - **AniList**: Anime TV series, anime movies, and OVAs with episode metadata.
- **Multi-Dimensional Filtering & Search**:
  - Search by Title, Original Title, and Alternative Titles (case-insensitive substring and full-text).
  - Filter by Media Type (`MOVIE`, `TV`, `ANIME`, `ANIME_MOVIE`, `OVA`, `DOCUMENTARY`).
  - Filter by Genre (multi-select: Action, Drama, Sci-Fi, Thriller, Romance, etc.).
  - Filter by Release Status (`RELEASED`, `AIRING`, `FINISHED`, `UPCOMING`).
  - Filter by Streaming Platform availability (Netflix, Prime Video, Disney+, Hulu, etc.).
  - Filter by Year Range (From / To) and Runtime buckets (<90 min, 90–120 min, >150 min).
  - Sort options: Popularity, Community Rating, Newest Release Date, Recently Added.

### 3.3 Media Detail & Cinematic Experience
- **Hero & Metadata Display**: High-resolution backdrop art, official poster, year, runtime, original language, country of origin, and content ratings.
- **Cast & Crew**:
  - Horizontal snap carousel featuring actor circular profile avatars, character roles, voice actor tags, and director/crew credits.
  - Automatic non-blocking background hydration via Next.js `after()` for instant initial render.
- **"Where to Watch" Providers**: Streaming platform badges with direct links to streaming providers.
- **Similar Titles**: ML-based semantic similarity recommendations displayed in responsive grid cards.

### 3.4 Personal Library & Watchlist
- **Status Lifecycle**:
  - `WATCHING`: In-progress shows/movies with live episode/progress trackers.
  - `COMPLETED`: Finished media with completion dates.
  - `PLAN_TO_WATCH`: Backlog items ready for future viewing.
  - `ON_HOLD`: Temporarily paused media.
  - `DROPPED`: Discontinued media.
- **Entry Attributes**:
  - Granular Episode Progress counter (increments up to total `episodeCount`).
  - Re-watch Counter (`watchCount`).
  - Start Date (`startedAt`) & Completion Date (`completedAt`).
  - Favorite toggle (`favorite: true/false`).
- **Wishlist**: Separate priority-ordered queue (`priority`, custom notes, position ordering).

### 3.5 Granular Ratings & In-Depth Reviews
- **10-Point Rating System**: 0.5 to 10.0 scale with 0.5 increments.
- **Bayesian Weighted Rating**: Global Bayesian average formula prevents titles with a single 10/10 rating from dominating top-rated charts.
- **Rating Distribution Visualizer**: Interactive 20-bucket rating histogram on media detail pages.
- **Review System**:
  - Rich text body with spoiler warning flag (`spoiler: boolean`).
  - Visibility control (`PUBLIC` / `PRIVATE`).
  - Upvotes / likes on reviews (`likeCount`).

### 3.6 AI Recommendation Engine & Social Matching
- **Personalized Recommendations**: Machine learning engine analyzes user watch history, ratings, and favorite genres against the active candidate catalog.
- **Semantic Similarity**: Item-to-item similarity factoring in shared genres, narrative synopsis embeddings, and audience appeal.
- **Taste Compatibility Match**: Calculates a percentage compatibility score between two users with shared genre highlights and similarity breakdown.
- **Graceful Fallbacks**: Algorithmic heuristic fallback triggers automatically when the AI microservice is offline.

### 3.7 Community Discussions & Forums
- **Channel Categories**: General Discussion, Movie Recommendations, TV Discussions, Anime Hub, Spoilers & Theories, News.
- **Thread Capabilities**: Thread title, body (markdown supported), pin status, locked status, view counter, and participant counter.
- **Thread Watching**: Notification alerts when new replies occur in watched threads.
- **Reactions**: Post-level emoji/reaction support.
- **User Mentions**: `@username` mention detection and automatic notification dispatch.

### 3.8 Social Graph & Activity Feed
- **Follow System**: Unidirectional follow/unfollow relationships between users.
- **Activity Feed**: Aggregated chronological feed of actions performed by followed users:
  - Added media to library / changed status.
  - Rated a movie or series.
  - Published a review.
  - Created a discussion thread.

### 3.9 Notifications Center
- **Categorized In-App Notifications**:
  - `MENTION`: Tagged in a review or discussion.
  - `FOLLOW`: New follower alerts.
  - `REPLY`: Direct response to a thread or review.
  - `SYSTEM` / `MEDIA_UPDATE`: Release reminders or catalog updates.
- **Notification Grouping**: Consolidates repetitive events (e.g. "User A and 3 others liked your post").
- **Read / Unread Management**: Mark individual as read, mark all read, badge counter in navigation bar.

### 3.10 In-Depth Personal Analytics (`/stats`)
- **Total Time Watched**: Converted into cumulative hours.
- **Media Type Breakdown**: Interactive donut chart (Movies vs TV vs Anime vs Documentaries).
- **Genre Distribution**: Bar chart of top 5 most-watched genres.
- **Monthly Activity Trends**: Timeline chart displaying watch velocity over months.
- **Rating Distribution Chart**: User's personal rating curve compared against global community averages.

---

## 4. System Architecture & Technical Stack

### 4.1 Frontend & Application Layer
- **Framework**: Next.js 15.4.2 (App Router, Server Components, React 19.1.0).
- **Styling**: Tailwind CSS, Class Variance Authority (`cva`), `lucide-react` icons.
- **Theme**: Dark Mode & Light Mode support via `next-themes`.
- **Charts**: `recharts` for interactive viewing analytics.

### 4.2 Backend & Data Layer
- **Database**: PostgreSQL hosted on Supabase with PgBouncer connection pooling.
- **ORM**: Prisma ORM 6.12+ utilizing parameterized queries, composite index targeting, and `relationLoadStrategy: "join"` where optimal.
- **Deferred Jobs**: Next.js `after()` API for non-blocking asynchronous metadata hydration.
- **Caching**: Multi-tier caching via `unstable_cache` and React `cache()`.

### 4.3 AI & Machine Learning Microservice
- **Runtime**: Python FastAPI / ML microservice running on `http://127.0.0.1:8001`.
- **Endpoints**:
  - `/recommend/user`: User-to-catalog personalized scoring.
  - `/recommend/similar`: Item-to-item semantic similarity.
  - `/recommend/taste-match`: Profile-to-profile affinity matrix.

---

## 5. Non-Functional Requirements (NFRs)

| Category | Requirement | Implementation Strategy |
| :--- | :--- | :--- |
| **Performance** | Warm response times < 2s in production. | Server Components, narrow selects, non-blocking `after()` sync, multi-layer caching. |
| **Connection Stability** | Zero `P2024` connection timeouts on Supabase. | Sequential connection safety, connection pool limit bounds (`pool=20`), composite index lookups. |
| **Security** | Robust Auth & Data Isolation. | Supabase RLS, Row-level UUID profile linkage, Server-only secrets, sanitized user input. |
| **Responsiveness** | Fluid UI across Mobile, Tablet, and Desktop. | Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`), touch-friendly carousels. |
| **SEO & Discoverability** | Dynamic metadata, OpenGraph tags, semantic HTML. | Next.js `generateMetadata()` on media routes, semantic HTML5 structure. |

---

## 6. Success Metrics & Key Performance Indicators (KPIs)

1. **User Engagement**:
   - Average number of titles logged per active user per month (> 10).
   - Average daily active users (DAU) engaging with Activity Feed & Discussions (> 35%).
2. **Recommendation Accuracy**:
   - Click-through rate (CTR) on "Recommended For You" carousel (> 20%).
3. **Platform Performance**:
   - 95th percentile server response time < 800ms in production.
   - 0% connection pool exhaustion errors under peak load.
4. **Community Health**:
   - Monthly active discussion threads created and positive reaction ratios.

---

## 7. Release Roadmap

- **Phase 1–3 (Foundations & Core)**: Database schema, multi-source ingestion, auth, library tracking, basic detail pages *(Complete)*.
- **Phase 4–6 (Social & Database Optimization)**: Activity feeds, discussions, follow system, Prisma query squashing *(Complete)*.
- **Phase 7 (Performance Forensics & Production Hardening)**: Non-blocking deferred hydration, narrow selects, COUNT(*) elimination, 5-run benchmark validation *(Complete)*.
- **Phase 8 (Future Enhancements)**:
  - Native iOS & Android companion applications.
  - Custom user-curated public watchlists / tier lists.
  - Calendar view for upcoming episode releases.
  - Webhook integration for Discord / Slack watch parties.
