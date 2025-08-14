<div align="center">
	<h1>AI Course Generator</h1>
	<p>Create structured, multi‑level courses with AI in minutes – with resilient chapter video curation and manual refinement tools.</p>
</div>

Built with Next.js App Router, Drizzle (Neon Postgres), Clerk auth, TailwindCSS + shadcn/ui, Gemini API, and a hardened YouTube search layer featuring caching + graceful quota fallbacks.

## ✨ Core Features
* Next.js 15 App Router (hybrid server / client components)
* Auth & user dashboard via Clerk
* Drizzle ORM + Neon serverless Postgres storage
* AI (Gemini) powered: course outline, level‑aware chapter expansion (Beginner / Intermediate / Advanced)
* Dynamic per‑chapter YouTube video candidates (auto + manual + force search)
* Resilient YouTube layer: query normalization, duplicate suppression, localStorage cross‑chapter de‑duplication, optional secondary API key, and hardcoded programming fallbacks on quota (403) exhaustion
* In‑UI fallback badge when quota fallback list is used
* TailwindCSS + shadcn/radix component library, dark mode
* Jobs page (optional external API)

## 🆕 Recent Enhancements
| Area | Improvement |
|------|-------------|
| Course Generation | Added Level selection (Beginner / Intermediate / Advanced) that increases depth, complexity, examples, and terminology in prompts. |
| Video System | Multi‑query diversified search per programming chapter; cached & normalized queries; fallback to shortened query on 403; secondary key support; persistent usedVideoIds to reduce repetition across chapters. |
| Fallback Resilience | Hardcoded programming fallback video sets appear (with badge) if all API attempts return 403 or zero results; prevents empty UX during quota outages. |
| UX | Manual Search, Force Search, Replace/Next buttons for chapter videos. Automatic first candidate selection prevents flicker. |
| Cleanup | Removed legacy Health category and course Duration field from UI and prompts. |

## 🧠 How It Works (High Level)
1. User creates a course: chooses Category (no Health), Topic, and Level.
2. AI (Gemini) generates a structured outline; Level modifies depth and complexity instructions.
3. For each chapter, when opened in the Start view, the app composes diversified search queries (especially for programming topics) and calls the YouTube Data API.
4. Results are filtered (remove shorts/reactions/trailers) and de‑duplicated across chapters using a localStorage key: `usedVideoIds:<courseId>`.
5. If API returns 403 (quota) or no viable results, a shortened query retry runs; if still empty and intent is programming, a curated fallback list is injected (displayed with a yellow “Fallback” badge).
6. User can: Replace/Next (cycle / search), Manual Search (custom query), Force Search (contextual query rebuild), or Direct API Test (diagnostics).
7. Selecting a candidate persists the chosen videoId to the chapter row in the database.

> Note: Fallback videos are currently defined inline in `app/course/[courseId]/start/_components/ChapterContent.js` and cover common programming themes (JS, Python, React, general). Extend or externalize as needed.

## 📦 Requirements
* Node.js >= 18.18
* Neon Postgres database (or any Postgres supported by Drizzle; update connection string)
* Accounts / keys: Clerk, Gemini (Google AI), Firebase (for storage), YouTube Data API v3
* (Optional) Jobs API provider credentials

## 🚀 Quick Start
1) Install dependencies
```bash
npm install
```

2) Environment variables (create `.env.local`)
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Database (Neon)
NEXT_PUBLIC_DB_CONNECTION_STRING=postgresql://user:pass@ep-xxxxx.neon.tech/db?sslmode=require

# AI + Integrations
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_YOUTUBE_API_KEY=your_primary_youtube_key
NEXT_PUBLIC_YOUTUBE_API_KEY_ALT=your_secondary_youtube_key   # optional, tried after 403
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key

# Site
NEXT_PUBLIC_HOST_NAME=http://localhost:3000

# Optional jobs provider (used by pages/api/jobs)
JOBS_API_BASE_URL=https://example-jobs-api.com/v1
JOBS_API_KEY=your_jobs_api_key
JOBS_API_HOST=example-jobs-api.com
```

3) Ensure DB tables
* Schema lives in `configs/schema.js`.
* If migrations report “No changes” but `chapters` is missing, run the helper:
```bash
node scripts/create_chapters_table.mjs
```

4) Run the app
```bash
npm run dev
```
Dev server starts on http://localhost:3000 (or the next available port).

## ☁️ Deployment (Vercel)
1) Push your repo to GitHub
2) Import project in Vercel
3) Add environment variables in Vercel Project Settings → Environment Variables

Required
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- NEXT_PUBLIC_DB_CONNECTION_STRING
- GEMINI_API_KEY (server-only)
- NEXT_PUBLIC_GEMINI_API_KEY (optional)
- NEXT_PUBLIC_GEMINI_MODEL=gemini-1.5-flash
- NEXT_PUBLIC_GEMINI_FALLBACK_MODEL=gemini-1.5-flash-8b
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_YOUTUBE_API_KEY
- NEXT_PUBLIC_YOUTUBE_API_KEY_ALT (optional)
- NEXT_PUBLIC_HOST_NAME=https://YOUR-PROJECT.vercel.app

Optional (Jobs page)
- JOBS_API_BASE_URL
- JOBS_API_KEY
- JOBS_API_HOST

4) Clerk & Firebase allowlists
* Clerk Dashboard → Applications → (your app): add your Vercel domain to Allowed Origins/Redirect URLs
* Firebase Console → Authentication → Settings → Authorized domains: add your Vercel domain

5) Deploy (Vercel runs `next build`)
6) Smoke test
* `/` (landing)
* `/dashboard` (auth redirect)
* `/create-course` (AI generation – verify Level selection present)
* `/dashboard` → select a course → start → open a chapter (ensure video candidates or fallback badge)
* `/dashboard/jobs` (if JOBS_* configured)

## 🛠 Notes & Internals
* Dark mode toggled via `app/_components/ThemeToggle` (Tailwind `dark` class).
* Video Search Logic: `configs/service.js` (normalization, caching, 403 retry & status tracking) + `ChapterContent.js` (query diversification, fallback injection, dedupe, UI controls).
* Local De‑duplication: stored as `localStorage['usedVideoIds:<courseId>']`.
* Fallback Badge appears if hardcoded list used (quota or zero results) – still allows manual / force search later.
* Health category & duration field intentionally removed for clarity and generation focus.
* Jobs widgets use proxy endpoint (`pages/api/jobs`). Provide `JOBS_*` envs or widget will show a hint.

## 📜 Scripts
* `npm run dev` – start dev server
* `npm run build` – production build
* `npm run start` – production server
* `npm run db:push` – push Drizzle schema
* `npm run db:studio` – open Drizzle Studio

## 🔧 Customization Tips
| Goal | Where |
|------|-------|
| Add more fallback video sets | Edit `PROGRAMMING_FALLBACKS` inside `ChapterContent.js` (consider extracting to config) |
| Change query diversification | Adjust arrays in `runSearch` (same file) |
| Add new course categories | Update category lists in generation prompts & query classification logic |
| Persist video usage server‑side | Add a table (e.g., `video_usage`) and sync on select instead of/in addition to localStorage |

## ⚠️ Quota & Fallback Behavior
If the YouTube API returns 403 (quota exceeded), the UI automatically supplies curated programming videos so learning flow continues. Provide a secondary key via `NEXT_PUBLIC_YOUTUBE_API_KEY_ALT` to reduce fallback frequency. Non‑programming categories simply show “no video” until quota resets (extend fallback logic if desired).

## 📄 License
MIT
