# CLAUDE.md — Panini World Cup 2026 Sticker Trader
 
## Project Overview
 
A personal web app for me and my friends to register, track, and trade Panini stickers for the FIFA World Cup 2026. Users can mark which stickers they own, which they need, and find trading matches with other registered users.
 
**This is a private, personal project. It will not be published or shared publicly.** It is acceptable to replicate the visual style, colors, logos, and branding of official Panini / FIFA World Cup 2026 materials to make the app feel authentic.
 
---
 
## Tech Stack
 
| Layer          | Choice                      | Notes                                           |
| -------------- | --------------------------- | ----------------------------------------------- |
| Framework      | Next.js 16 (App Router)     | React 19, SSR + Server Actions                  |
| Language       | TypeScript 5 (strict)       | No `any` unless truly necessary                 |
| Styling        | Tailwind CSS v4             | Theme via `@theme` in `globals.css`; Panini palette |
| Database       | PostgreSQL (Neon serverless)| Prisma 6 with `@prisma/adapter-neon` over Neon's WebSocket driver |
| ORM            | Prisma 6                    | `engineType = "client"` (WASM queryCompiler, **no native engine**); client at `src/generated/prisma/` |
| Auth           | NextAuth.js v4              | Credentials provider (**unique name** + bcrypt password — no email) |
| Hosting        | Vercel                      | Auto-deploy on push to `main`; env vars set in Vercel dashboard |
| Images         | Wikimedia URLs              | Stored in `Sticker.imagePath`; image route 302-redirects — no local image storage |
| Package Mgr    | pnpm 11                     | `pnpm-workspace.yaml` for build script allow-list |
| Scraper        | Python 3 (requests)         | Wikipedia API — see Image Pipeline below        |
 
---
 
## Architecture Rules
 
### Code Quality
 
- **DRY strictly.** Before writing a new component, helper, or API handler, search the codebase for existing implementations that do the same thing. Reuse or extend — never duplicate.
- **Single source of truth.** Constants (team lists, sticker IDs, group mappings) live in one shared file and are imported everywhere. Never hardcode the same value in two places.
- **Small, focused files.** One component per file, one route handler per file. If a file exceeds ~200 lines, split it.
- **Name things clearly.** Prefer `StickerCard`, `useTradeOffers`, `getAvailableTrades` over vague names like `Card`, `useData`, `getStuff`.
### Project Structure
 
```
src/
  app/              # Next.js App Router pages & layouts
  components/       # Reusable UI components
    ui/             # Generic primitives (Button, Modal, Badge…)
    stickers/       # Sticker-specific components
    trades/         # Trade-specific components
  lib/              # Shared utilities, constants, helpers
    db.ts           # Prisma client singleton (instantiated with the Neon adapter)
    constants.ts    # Sticker data, team lists, groups
    utils.ts        # Pure helper functions
  hooks/            # Custom React hooks
  types/            # Shared TypeScript types & interfaces
prisma/
  schema.prisma     # Database schema
  seed.ts           # Seeds 980 stickers from data/stickers_list.txt
  migrations/       # SQL migrations (Postgres)
scripts/
  fetch_all_image_urls.py   # Resolve Wikimedia image URLs → data/image_urls.json (no downloads)
  fetch_team_logos.py       # Federation/association logo URLs for team-logo stickers
  import_image_urls.ts      # Write data/image_urls.json into Sticker.imagePath
  check_image_urls.ts       # Diagnostic: count populated imagePaths in the DB
data/
  stickers_list.txt  # List of all Stickers and their description (i.e. player name - country)
  image_urls.json    # Generated map { stickerId: wikimediaUrl } (gitignored)

```

Images are **not** stored in the repo. Each sticker's `imagePath` holds a
Wikimedia URL; `GET /api/stickers/[id]/image` redirects to it (or returns an
uncached placeholder SVG when no URL is set).
 
Do not deviate from this structure without updating the table above.
 
### Data Modeling Guidelines
 
- Every sticker has a unique identifier following the real Panini numbering scheme (e.g. `FWC 1`, `GER 5`).
- Users have a **collection** (stickers they own, with quantity). **There is no wishlist** — any sticker a user does not own (`ownedQty = 0`) is implicitly "needed".
- A user can own duplicates — track quantity, not just presence. A duplicate is `ownedQty > 1`.
- A **trade** is a proposal from one user to another: "I give you stickers X, Y; you give me A, B." Either side may be empty (a one-way **gift** or **wish request**). Status: `PENDING → ACCEPTED | REJECTED | CANCELLED`.
- Trade matches exclude stickers already committed in a `PENDING`/`ACCEPTED` trade between the two users (only a `CANCELLED` trade frees them again).
- When a trade is `ACCEPTED`, each party can apply it once to their collection (`initiatorApplied` / `receiverApplied` flags) to move the stickers.
### API & Data Fetching
 
- Use Next.js Server Actions or Route Handlers for mutations.
- Validate all input on the server with Zod schemas. Define each schema once in `types/` and reuse it for both client-side forms and server-side validation.
- Return consistent response shapes: `{ success: true, data }` or `{ success: false, error }`.
### Styling & Theming
 
- Panini color palette is defined in `src/app/globals.css` under `@theme` (Tailwind v4 approach — no `tailwind.config.ts`).
- Fonts: Inter (body) + Barlow Condensed (display headings) via `next/font/google`. CSS vars: `--font-inter`, `--font-barlow-condensed`.
- Use `font-display` Tailwind class for headings.
- Sticker cards should visually resemble real Panini stickers — rounded corners, subtle gloss/shine effect, player silhouette placeholder.
- Keep the UI mobile-friendly; most users will check trades on their phones.
- there should be an option to show a grand overview of all stickers with an easy option to click to check / uncheck whether one has the sticker, add to the quantity of this sticker
- an option to add new players
- users shall be able to check other users for a trading overview, i.e. what stickers do I own / need that the other needs / owns 
---
 
## Development Workflow
 
- Local env lives in `.env.local` (gitignored): `DATABASE_URL` (Neon pooled), `DIRECT_URL` (Neon direct, used by migrations), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. See `.env.example`.
- Run `pnpm dev` for local development.
- After a schema change: write the migration SQL and apply with **`pnpm prisma migrate deploy`** (the sandboxed/non-interactive environment cannot run `migrate dev`), then `pnpm prisma generate`.
- Run `pnpm lint` and `pnpm typecheck` before committing. Fix all errors — do not suppress with `eslint-disable` or `@ts-ignore` unless there is a documented reason.

## Image Pipeline

1. `scripts/.venv/bin/python scripts/fetch_all_image_urls.py` — resolve Wikimedia URLs into `data/image_urls.json` (resumable, saves after each hit). `fetch_team_logos.py` does the same for team-logo stickers (federation → association → team query order).
2. `pnpm tsx scripts/import_image_urls.ts` — write those URLs into `Sticker.imagePath` in the DB. Safe to re-run; no redeploy needed (the image route reads `imagePath` at request time).

## Deployment (Vercel + Neon)

- Push to `main` → Vercel auto-builds (`prisma generate && next build`).
- Vercel env vars: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
- The Neon adapter + `engineType = "client"` means **no native Prisma engine binary** is bundled — the WASM queryCompiler ships base64-embedded in JS, which is what makes serverless deploys work. Do not revert to the default (library) engine.
---
 
## What NOT To Do
 
- **Do not install packages without asking first.** Discuss the need, check if an existing dependency already covers it.
- **Do not create mock/placeholder data inline.** Put seed data in `prisma/seed.ts`.
- **Do not add authentication complexity beyond what's needed.** This is a friends-only app — keep it simple.
- **Do not over-abstract early.** Build the feature, then extract shared patterns on the second use.
 
