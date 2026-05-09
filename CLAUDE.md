# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Express + Vite, port 5000)
npm run build        # Vite client build + esbuild server bundle → dist/
npm run start        # Run production build
npm run check        # TypeScript type check (tsc --noEmit)
npm run db:push      # Apply schema changes to Neon (no migration files)
npm run db:seed      # Seed question data
npm run db:seed-admin # Seed admin user
```

**No test runner is configured.** `npm run check` is the only automated correctness check.

The dev server has **no file watcher for server code** — after any change to `server/` or `shared/schema.ts`, stop and restart `npm run dev` manually for changes to take effect. Frontend (Vite HMR) hot-reloads automatically.

## Architecture

### Monorepo layout

```
shared/       TypeScript types + Drizzle schema shared by both sides
server/       Express API (auth, routes, storage, db)
client/src/   React SPA (components, hooks, lib)
```

`@shared/*` and `@/*` path aliases are wired in both `vite.config.ts` and `tsconfig.json`.

### Single-process server

`server/index.ts` runs one Node process that serves both the API and the Vite dev middleware (or static files in prod). Session state lives in an in-memory store (`memorystore`) — **not suitable for multi-instance deployment without swapping to `connect-pg-simple`**.

### Database

Neon serverless PostgreSQL via HTTP driver (`drizzle-orm/neon-http`). Schema source of truth is `shared/schema.ts`. Changes are pushed directly with `npm run db:push` — no migration files are used or generated. The ORM instance is exported from `server/db.ts` and used exclusively via `server/storage.ts`.

**Column type gotcha:** `games.totalTime` and `games.finalScore` are `integer` columns. `state.totalTime` in the frontend accumulates as a float (TICK_TIMER adds 0.1s). Always `Math.round()` before writing these columns.

### Storage layer

All database access goes through `server/storage.ts`. `IStorage` is the interface; `PostgresStorage` is the only implementation. Routes only import the singleton `storage` — they never call `db` directly.

### Authentication

Passport local strategy (`server/auth.ts`) accepts email **or** username. Login requires `isEmailVerified === true`. Sessions are cookie-based (7-day, httpOnly, `credentials: "include"` on all client fetches). The `req.user` object is the full `User` row minus password; cast it as `User` from `@shared/schema` in route handlers.

Email verification uses a 6-digit OTP hashed with bcrypt, stored in the `email_verifications` table, and sent via Resend. Resend is also used for OTP resend.

Registration requires a Cloudflare Turnstile CAPTCHA token verified server-side.

### Screen-based navigation (no router)

The frontend is a single-page app with no URL routing. Navigation is a Redux-like reducer inside `useGameState` (`client/src/hooks/useGameState.tsx`). The entire app renders one screen at a time based on `state.currentScreen`.

Current screens: `mode → welcome → game → feedback → result`, plus `profile`, `friends`, `leaderboard`.

`SET_SCREEN` always clears `state.viewingUserId` (so navigating to `profile` via the header always shows self). `VIEW_USER` is the action for viewing a friend's profile — it sets both `viewingUserId` and `currentScreen: 'profile'` atomically.

### Data fetching

TanStack Query with `staleTime: Infinity` by default (queries never auto-refetch). All mutations must manually call `queryClient.invalidateQueries(...)` for dependent queries. `apiRequest()` in `client/src/lib/queryClient.ts` is the fetch wrapper for mutations; `getQueryFn()` is the factory for query functions.

**On logout**, `queryClient.clear()` is called (in `useAuth.tsx`) to wipe all cached data so the next user starts with a clean cache. After adding features that cache user-specific data, verify the logout path clears it.

### Rate limiters

Two limiters in `server/routes.ts`:
- `authLimiter` — 10 req / 15 min (auth endpoints)
- `gamesLimiter` — 120 req / 60 s (game sync + profile reads)
- `friendsLimiter` — 60 req / 60 s (friends + leaderboard)

### Key schema notes

- `games.status`: `'abandoned'` (default on creation) | `'completed'` (set by `/api/games/:id/complete`). Stats queries always filter `WHERE status = 'completed'`.
- `games` is capped at 100 rows per user (`enforceUserGameCap` in storage, called on every `createGame`).
- `friendships.status`: `'pending'` | `'accepted'` | `'blocked'` (blocked not yet implemented in UI).
- Drizzle `sum()` and `max()` aggregates return `string | null` — always coerce with `Number(value ?? 0)`.

### Leaderboard mastery score formula

```ts
Math.round((accuracyRate * Math.sqrt(totalGames)) * 10 + (maxStreakEver * 50))
```

`accuracyRate` is a percentage (0–100), not a fraction. Computed server-side in `getFriendsLeaderboard`.

### Environment variables required

`DATABASE_URL`, `SESSION_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `TURNSTILE_SECRET_KEY` (plus the public Turnstile key on the frontend via Vite env).
