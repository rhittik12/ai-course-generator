# AI Course Generator

Create engaging courses with AI in minutes. Built with Next.js App Router, Drizzle ORM (Neon Postgres), Clerk auth, TailwindCSS, and shadcn/ui.

## Features
- Next.js 15 App Router, server and client components
- Clerk authentication with protected dashboard
- Drizzle ORM + Neon serverless Postgres
- Gemini API for course and chapter generation
- YouTube API for video curation per chapter
- TailwindCSS design system, dark mode toggle, shadcn/radix components

## Requirements
- Node.js >= 18.18
- A Neon Postgres database
- Accounts/keys: Clerk, Google Gemini, Firebase (Storage), YouTube Data API v3

## Quick start
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
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key

# Site
NEXT_PUBLIC_HOST_NAME=http://localhost:3000

# Optional jobs provider (used by pages/api/jobs)
JOBS_API_BASE_URL=https://example-jobs-api.com/v1
JOBS_API_KEY=your_jobs_api_key
JOBS_API_HOST=example-jobs-api.com
```

3) Ensure DB tables
- Schema is defined in `configs/schema.js`.
- If migrations report “No changes” but `chapters` is missing, run the helper:
```bash
node scripts/create_chapters_table.mjs
```

4) Run the app
```bash
npm run dev
```
Dev server starts on http://localhost:3000 (or the next available port).

## Deployment (Vercel)
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
- NEXT_PUBLIC_HOST_NAME=https://YOUR-PROJECT.vercel.app

Optional (Jobs page)
- JOBS_API_BASE_URL
- JOBS_API_KEY
- JOBS_API_HOST

4) Clerk & Firebase allowlists
- Clerk Dashboard → Applications → (your app): add your Vercel domain to Allowed Origins/Redirect URLs
- Firebase Console → Authentication → Settings → Authorized domains: add your Vercel domain

5) Deploy (Vercel runs `next build`)
6) Smoke test
- / (landing)
- /dashboard (sign-in)
- /create-course (AI generate via app/api/ai/generate-course)
- /dashboard/jobs (ensure JOBS_* envs or you’ll see a config hint)

## Notes
- Dark mode is toggled by `app/_components/ThemeToggle` and Tailwind `dark` class.
- Google One Tap is rendered on the client via `app/_components/GoogleOneTapClient` to avoid hydration issues.
- Jobs widgets use an internal proxy (`pages/api/jobs`). Set `JOBS_*` envs to enable.

## Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run start` – start production server
- `npm run db:push` – push Drizzle schema (if you maintain migrations)
- `npm run db:studio` – open Drizzle Studio

## License
MIT
