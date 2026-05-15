# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Express + Vite, port 5000)
npm run build        # Vite client build + esbuild server bundle → dist/
npm run start        # Run production build
npm run check        # TypeScript type check (tsc --noEmit)
npm run db:push      # Apply schema changes directly (emergency only — prefer migrations)
npm run db:generate  # Generate a new drizzle-kit migration from schema changes
npm run db:migrate   # Apply pending migrations to Neon
npm run db:seed      # Seed question data
npm run db:seed-admin # Seed admin user
```

**No test runner is configured.** `npm run check` is the only automated correctness check.

The dev server has **no file watcher for server code** — after any change to `server/` or `shared/schema.ts`, stop and restart `npm run dev` manually for changes to take effect. Frontend (Vite HMR) hot-reloads automatically.

## Architecture

### Monorepo layout

```
shared/         TypeScript types + Drizzle schema shared by both sides
server/         Express API (auth, routes, storage, gameState, scoring, db)
client/src/     React SPA (components, hooks, lib)
migrations/     drizzle-kit SQL migrations (source of truth for schema history)
```

`@shared/*` and `@/*` path aliases are wired in both `vite.config.ts` and `tsconfig.json`.

### Single-process server

`server/index.ts` runs one Node process that serves both the API and the Vite dev middleware (or static files in prod). Session state lives in an in-memory store (`memorystore`) — **not suitable for multi-instance deployment without swapping to `connect-pg-simple`**.

### Database

Neon serverless PostgreSQL via HTTP driver (`drizzle-orm/neon-http`). Schema source of truth is `shared/schema.ts`. Schema changes should go through `npm run db:generate` → `npm run db:migrate`. The ORM instance is exported from `server/db.ts` and used exclusively via `server/storage.ts`.

**Column type gotcha:** `games.totalTime` and `games.score` are `integer` columns. `state.totalTime` in the frontend accumulates as a float (TICK_TIMER adds 0.1s). Always `Math.round()` before writing these columns.

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

**After completing a competitive game**, the finalize effect in `useGameState.tsx` invalidates `['/api/users']` and `['/api/leaderboard']` so ProfileScreen and LeaderboardScreen show fresh data without logout.

### Rate limiters

Three limiters in `server/routes.ts`:
- `authLimiter` — 10 req / 15 min (auth endpoints)
- `gamesLimiter` — 120 req / 60 s (game sync + profile reads)
- `friendsLimiter` — 60 req / 60 s (friends + leaderboard)

### Key schema notes

- `games.status`: `'abandoned'` (default on creation) | `'completed'` (set by `POST /api/games/:id/complete`). Stats queries always filter `WHERE status = 'completed'`.
- `games` is capped at 100 rows per user (`enforceUserGameCap` in storage, called on every `createGame`). Eviction prefers oldest-abandoned first, then oldest-completed as fallback.
- `friendships.status`: `'pending'` | `'accepted'` | `'blocked'` (blocked not yet implemented in UI).
- Drizzle `sum()` and `max()` aggregates return `string | null` — always coerce with `Number(value ?? 0)`.

### Server-authoritative game flow (competitive mode)

The competitive game flow is fully server-side. The client never computes correctness or scores:

1. `POST /api/games` — creates the game row, selects questions server-side (Fisher-Yates), returns `{ gameId, question, totalQuestions }`. Questions are stored as `chosenQuestionIds` on the game row.
2. `POST /api/games/:id/answer { questionIndex, selectedAnswer }` — idempotent per `(gameId, questionIndex)`. Server compares against DB answer, stamps `questionTimings`, increments `currentQuestionIndex`, returns `{ isCorrect, correctAnswer, explanation, currentScore, wrongAnswersSoFar, gameOver }`.
3. `GET /api/games/:id/next-question` — returns the next question without answer/explanation, stamped with `servedAt`.
4. `POST /api/games/:id/complete` — derives all stats from `questionTimings` via `deriveGameState()`, computes `score` via `computeMatchScore()`, marks `status = 'completed'`.

Practice mode uses the old `/api/questions/:section` endpoint and never touches the `games` table.

### Scoring

Two pure functions in `server/scoring.ts`:

**Match score** (`computeMatchScore`) — computed at completion, stored in `games.score`:
```
score = base × correct
      + Σ speedBonus (per correct answer: base × 0.5 × (maxTime − elapsed) / maxTime)
      + floor(maxStreak / 5) × 25
      − wrongAnswers × base × 0.3
```
`base` is difficulty-tiered: Easy = 10, Medium = 20, Expert = 40.

**User rating** (`computeRating`) — rolling window over the last 30 completed games (no DB column; computed on-the-fly in `getFriendsLeaderboard`):
```
rating = Σ(score × difficultyMultiplier × 0.92^i) / Σ(0.92^i)   (i=0 = newest)
```
Difficulty multipliers: Easy 1.0, Medium 1.5, Expert 2.5. Recent improvement shows within a few games; old lucky games age out.

**Game state derivation** (`server/gameState.ts` → `deriveGameState`) — pure function from `questionTimings` + questions → all denormalized fields (`correctAnswers`, `wrongAnswers`, `maxStreak`, `categoryPerformance`, etc.). This is the single source of truth; client-reported counts are ignored.

### Category radar (ProfileScreen)

`getUserStats()` in storage returns `categoryBreakdown` (all-time) and `categoryBreakdownRecent` (last 10 completed games), both as `Record<string, { correct, total, accuracy }>`. The `<CategoryRadar />` component in `client/src/components/CategoryRadar.tsx` renders these two layers as a Recharts `RadarChart`.

### Environment variables required

`DATABASE_URL`, `SESSION_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `TURNSTILE_SECRET_KEY` (plus the public Turnstile key on the frontend via Vite env).
