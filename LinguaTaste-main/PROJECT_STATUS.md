# LinguaTaste — Taste-Matched Language Immersion
## Hackathon Project Status & Roadmap Report

### 1. Executive Summary
**LinguaTaste** solves the primary cause of language learning dropout: generic, boring content (e.g., textbook dialogues, nursery rhymes, or clichéd pop songs). By utilizing **Qloo's Cultural Taste Graph**, LinguaTaste maps a learner's existing media passions (favorite bands, directors, anime, true crime podcasts, authors) directly into target-language media with equivalent cultural DNA, and then calibrates each recommendation to the learner's exact **CEFR language proficiency level (A1–C2)**.

Cultural grounding is the core engine, not decoration: without Qloo's cross-domain taste graph, recommendations collapse into generic cliches (e.g. recommending "Despacito" to every Spanish learner or "Doraemon" to every Japanese learner).

---

### 2. What Has Been Done Till Now

#### A. Architecture & Foundation
- [x] Initialized Next.js 15+ App Router with TypeScript and Tailwind CSS.
- [x] Installed dependencies: `@anthropic-ai/sdk`, `zustand`, `lucide-react`, `framer-motion`, `clsx`, `tailwind-merge`.
- [x] Created `.env.example` defining `QLOO_API_KEY` and `ANTHROPIC_API_KEY`.

#### B. Qloo API Client & Cultural Grounding (`lib/qloo.ts`)
- [x] Configured endpoint target: `https://hackathon.api.qloo.com` with `X-Api-Key` authentication.
- [x] Mapped URN entity types: `urn:entity:movie`, `urn:entity:tv_show`, `urn:entity:artist`, `urn:entity:book`, `urn:entity:podcast`.
- [x] Configured language-to-country filters (Japanese: JP; Spanish: ES, MX, AR, CO, etc.; Korean: KR; French: FR, CA, etc.; German: DE, AT; Italian: IT; Mandarin: CN, TW; Portuguese: BR, PT).
- [x] Implemented in-memory caching with TTL to avoid redundant API rate limits during rapid exploration.

#### C. Agentic Tool Suite & Pipeline (`lib/agent.ts`)
- [x] **Tool 1: `search_entities`**: Resolves free-text user media seeds into canonical Qloo entities.
- [x] **Tool 2: `get_taste_profile`**: Extracts deep taste tags and affinity weights across domains.
- [x] **Tool 3: `recommend_by_taste`**: Queries Qloo Insights API filtered by target language/country codes with explainability enabled.
- [x] **Tool 4: `estimate_difficulty`**: Blends linguistic heuristics with LLM difficulty scoring (1-10) and CEFR alignment curves. Computes composite score: `0.6 * taste_affinity + 0.4 * difficulty_fit`.
- [x] **Tool 5: `build_weekly_plan`**: Schedules 7-day immersion sessions based on user's target weekly study hours, generates pre-teach vocabulary, active learning challenges, and time allocation.
- [x] **Tool 6: `record_feedback`**: Adjusts affinity and difficulty weights based on user feedback (thumbs up/down, too hard/too easy).
- [x] **Benchmark Mode: `generateLLMOnlyRecommendations`**: Produces baseline generic LLM suggestions to prove Qloo's superiority in the side-by-side comparison tab.

#### D. API Routes
- [x] `/api/search`: Entity search endpoint with type filtering.
- [x] `/api/analyze`: Main agent orchestration pipeline (resolves seeds -> taste profile -> recommendations -> difficulty scoring).
- [x] `/api/plan`: Generates the structured weekly immersion calendar.
- [x] `/api/feedback`: Processes learner ratings and recalculates candidate scores.
- [x] `/api/compare`: Executes parallel Qloo vs. Generic LLM runs for side-by-side evaluation.

#### E. State Management (`lib/store.ts`)
- [x] Persistent Zustand store (`taste-immersion-store`) holding user profile, taste profile, candidate recommendations, weekly calendar, feedback history, and live agent execution logs.

---

### 3. What Has Been Completed In This Session

#### A. Artwork Resolution Engine (`lib/artwork.ts`, `app/api/artwork/route.ts`)
- [x] Implemented multi-tier artwork resolver:
  - **Film/TV**: (1) Qloo entity image if present, (2) TMDB Search API (`/3/search/movie`, `/3/search/tv`) with fuzzy title matching + year filtering + TMDB `/3/configuration` base URLs (`w342` for cards, `w780` for high-res).
  - **Books**: Open Library Covers API (`/b/isbn/{ISBN}-L.jpg`, `/b/olid/{OLID}-L.jpg`) falling back to Google Books API thumbnail.
  - **Music**: iTunes Search API (`600x600` artwork) falling back to Deezer API (`picture_xl`).
  - **Universal Fallback**: Dynamic SVG gradient card with title and media icon (guarantees zero broken images).
- [x] In-memory TTL caching keyed by entity ID with batch resolution endpoint (`POST /api/artwork`).
- [x] Remote pattern configuration in `next.config.ts` for all media CDNs.

#### B. Availability & "Where to Consume" Engine (`lib/availability.ts`, `app/api/availability/route.ts`)
- [x] Implemented 3-tier link hierarchy:
  - **Tier 1**: Direct deep link to exact title/artist on the platform (via Watchmode or Spotify/Deezer APIs).
  - **Tier 2**: Aggregator-level verified link (TMDB/JustWatch provider page, Open Library reading view).
  - **Tier 3**: Pre-filled search URL on platform (e.g. `"Search on Kindle"`, `"Search on Spotify"`).
- [x] Regional watch providers for Film/TV (TMDB `/watch/providers` powered by JustWatch) grouped by `stream` (flatrate), `rent`, and `buy`.
- [x] Book reading & acquisition links (Open Library, Google Books, Kindle/Amazon, Bookshop.org, Libby library borrowing).
- [x] Music listening links (Spotify, Apple Music, YouTube Music, Deezer).
- [x] In-memory caching with batch resolution endpoint (`POST /api/availability`).

#### C. Rich Platform Icon Library (`lib/platformIcons.tsx`)
- [x] Built inline SVG icon components for Netflix, Prime Video, Disney+, Hulu, Max, Apple TV+, Spotify, Apple Music, YouTube Music, Deezer, YouTube, Kindle, Libby, Bookshop.org, Open Library, and generic fallback.
- [x] Added official TMDB logo component for legal attribution compliance.

#### D. Interactive UI & Filtering Integration (`app/page.tsx`)
- [x] **Region Selector**: Onboarding country picker (US, GB, CA, AU, JP, ES, FR, DE, IT, KR, MX, BR) auto-initialized from browser locale and persisted in Zustand store.
- [x] **My Active Subscriptions**: Toggle pills for Netflix, Prime Video, Disney+, Hulu, Max, Apple TV+, Spotify, Apple Music, and YouTube Premium.
- [x] **Ranking Boost**: Items available on user's active subscriptions receive an automatic **+15% composite ranking boost**.
- [x] **"Available to Me" Filter**: One-click toggle hides all content not accessible on the user's active subscriptions or free/web platforms.
- [x] **Candidate Card Artwork**: Lazy-loaded posters with fixed aspect ratios (`2:3` for movies/shows/books, `1:1` for music) preventing layout shifts, source badge, and subscription badge.
- [x] **"Where to Consume" Platform Row**: Stream / Rent / Buy platform badges with icons and deep links opening in new tabs (`rel="noopener noreferrer"`), plus YouTube trailer fallback if not available in region.
- [x] **7-Day Immersion Calendar**: Session cards display mini poster thumbnail and exact platform action: *"Tue: Episode 1 on Netflix [icon, link]"*.
- [x] **Compliance Attributions**: Footer displays official TMDB logo with required disclaimer (*"This product uses the TMDB API but is not endorsed or certified by TMDB"*) and JustWatch attribution.

#### E. Test Suite & Verification (`lib/__tests__/artwork.test.ts`)
- [x] Built test suite covering fuzzy title matching (`normTitle`, `titlesMatch`), punctuation/contraction handling, and link tier preference logic (`bestTier`, `filterByTierPreference`).
- [x] Added `npm test` script using Node 22 native test runner — **20/20 unit tests pass (0 failures)**.
- [x] Verified full production bundle with `npm run build` (Turbopack + Next.js 16.4 App Router, 0 errors).

#### F. Documentation
- [x] Updated `README.md` with environment variables, API & media type table, link tier matrix, and compliance rules.
- [x] Created `DEMO_SCRIPT.md` walking judges through the 3-minute pitch, 1-click persona load, and "click the icon and land on the platform" moment.

---

### 4. What Has Yet To Be Done (Optional Future Scope)
- [ ] Connect a live HTML5 audio preview player for recommended music tracks directly inside the card.
- [ ] Export 7-day schedule to `.ics` calendar format for Apple Calendar / Google Calendar import.
- [ ] Add user-configurable TMDB API token input in the settings modal for judges with personal API keys.
