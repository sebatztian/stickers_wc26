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
| Database       | SQLite (via Prisma 6)       | File: `panini_wc26.db`; swap for Postgres later |
| ORM            | Prisma 6                    | Generated client at `src/generated/prisma/`     |
| Auth           | NextAuth.js v4              | Credentials provider (email + bcrypt password)  |
| Package Mgr    | pnpm 11                     | `pnpm-workspace.yaml` for build script allow-list |
| Scraper        | Python 3 (requests)         | `scripts/scrape_images.py` — Wikipedia API      |
 
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
    db.ts           # Prisma client singleton
    constants.ts    # Sticker data, team lists, groups
    utils.ts        # Pure helper functions
  hooks/            # Custom React hooks
  types/            # Shared TypeScript types & interfaces
prisma/
  schema.prisma     # Database schema
data/
  stickers_list.txt  # List of all Stickers and their respective description (i.e. player name - country)
  pictures/
    ALG/
      ALG1    # picture of player fetched by taking the first accessible photo when checking the sticker description
      ...
    ...

```
 
Do not deviate from this structure without updating the table above.
 
### Data Modeling Guidelines
 
- Every sticker has a unique identifier following the real Panini numbering scheme (e.g. `FWC 1`, `GER 5`).
- Users have a **collection** (stickers they own) and a **wishlist** (stickers they need).
- A user can own duplicates — track quantity, not just presence.
- A **trade** is a proposal from one user to another: "I give you stickers X, Y; you give me A, B." It has a status: `pending → accepted | rejected | cancelled`.
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
 
- Run `pnpm dev` for local development.
- Run `pnpm prisma migrate dev` after any schema change.
- Run `pnpm lint` and `pnpm typecheck` before committing. Fix all errors — do not suppress with `eslint-disable` or `@ts-ignore` unless there is a documented reason.
---
 
## What NOT To Do
 
- **Do not install packages without asking first.** Discuss the need, check if an existing dependency already covers it.
- **Do not create mock/placeholder data inline.** Put seed data in `prisma/seed.ts`.
- **Do not add authentication complexity beyond what's needed.** This is a friends-only app — keep it simple.
- **Do not over-abstract early.** Build the feature, then extract shared patterns on the second use.
 
