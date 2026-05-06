# Smoke-Logging Feature — Design Spec

**Date:** 2026-05-06
**Scope:** Add user-driven smoke-event logging to MYQuitMate so the "smoke-free days" metric reflects reality. Floating action button (FAB) on every dashboard page; confirm modal; backend `SmokeLog` model; derived streak/total/money stats; gamification penalty on slip; recent-slip list and calendar heatmap on the progress page.

This spec is the source of truth for the planning phase that follows. It does not include implementation order — that goes in the implementation plan.

---

## 1. Goals & Non-Goals

### Goals

- Let users record every slip with a single confirmation tap.
- Replace the dead-reckoned "days since quitDate" stat with two truthful metrics: **current streak** and **total smoke-free days**.
- Adjust **money saved** to reflect actual logged smokes.
- Apply a small gamification penalty on slip and revoke streak-milestone badges when the streak resets.
- Give the user a recent-slip list and an 8-week heatmap to see patterns.

### Non-Goals (v1)

- No backfill / retroactive entry. Server stamps `now()` on every log.
- No richer per-event metadata (trigger tag, mood) — keep slip logging zero-friction beyond the confirm tap.
- No vape-session analog for `moneySavedActual` when `cigarettesPd` is null — render a dash.
- No client-driven timezone day boundary. Server timezone (UTC) defines `loggedDate`. Revisit if midnight bugs reported.
- No rate limiting on `POST /smoke-log` (mitigated client-side by confirm modal).

---

## 2. User Flow

1. User on any dashboard page sees a bottom-right FAB labelled "Log a smoke" (cigarette icon, muted red/amber).
2. Tap → confirm modal: "Log a slip? Slip ≠ failure. Honesty helps." Buttons: `Cancel` / `Yes, I smoked`.
3. Confirm → `POST /smoke-log`. Server creates row, applies penalty, returns updated stats.
4. Modal closes. Toast: "Logged. Streak reset. You're still on the path. 💪"
5. Dashboard server component re-fetches via `router.refresh()`. Stat cards update.

---

## 3. Data Model

New Prisma model. Additive migration; no changes to existing models in this section.

```prisma
model SmokeLog {
  id         String   @id @default(uuid())
  userId     String
  count      Int      @default(1)            // smokes in this event
  loggedAt   DateTime @default(now())        // exact timestamp
  loggedDate DateTime @db.Date               // server-day bucket
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, loggedDate])
  @@index([userId, loggedAt])
}
```

Add to `User`:

```prisma
smokeLogs SmokeLog[]
```

**Notes**

- One row per tap. `count` defaulted to 1 — leaves room for a future "log multiple" UI without a schema change.
- `loggedDate` is computed server-side from `loggedAt` at insert time (NOT a generated column — done in service to keep Prisma 7 schema portable). Used by heatmap and slip-day counting.
- No backfill: client cannot supply `loggedAt` or `loggedDate`.

---

## 4. API

New module: `src/modules/smoke-log/` (controller + service + DTOs + module). Follows existing module pattern (PrismaModule import, JWT guard, TransformInterceptor wrap).

### Endpoints

```
POST   /smoke-log
  body: {}
  resp data: {
    id: string,
    loggedAt: ISO string,
    loggedDate: "YYYY-MM-DD",
    count: 1,
    currentStreak: number,
    totalSmokeFreeDays: number,
    totalPoints: number
  }

GET    /smoke-log/history?days=14
  query: days int 1..365 (default 14)
  resp data: { items: [{ id, loggedAt, count }, ...] }

GET    /smoke-log/heatmap?from=YYYY-MM-DD&to=YYYY-MM-DD
  query: from, to ISO date strings (max 365-day range)
  resp data: { days: [{ date: "YYYY-MM-DD", count: number }] }
```

### Modified

```
GET    /progress
  resp data adds:
    currentStreak: number
    totalSmokeFreeDays: number
    lastSlipAt: ISO string | null
    moneySavedActual: number
  resp data removes:
    daysSmokeFreee  (replaced by currentStreak; also fixes the typo)
    moneySaved      (replaced by moneySavedActual)
```

All endpoints JWT-guarded; all responses wrapped by `TransformInterceptor`.

### DTOs

- No body for `POST /smoke-log`.
- Query DTOs for `history` and `heatmap` validated with class-validator: `@IsInt()`, `@Min`, `@Max`, `@IsDateString`.

---

## 5. Compute Logic

All derived at read time from `SmokeLog` + `QuitPlan`. No denormalized streak counters in v1.

### `currentStreak` (whole days)

```
lastLog = MAX(SmokeLog.loggedAt WHERE userId)
seconds = (lastLog ? now - lastLog : now - quitDate)
streak  = max(0, floor(seconds / 86400))
```

Slip resets streak to 0 the moment it is logged.

### `totalSmokeFreeDays` (cumulative)

```
totalDaysSinceQuit = floor((now - quitDate) / 86400)
slipDays           = COUNT(DISTINCT loggedDate WHERE userId)
totalSmokeFreeDays = max(0, totalDaysSinceQuit - slipDays)
```

### `lastSlipAt`

```
lastSlipAt = MAX(SmokeLog.loggedAt WHERE userId)  // null if no logs
```

### `moneySavedActual`

```
plan         = user.quitPlan
pricePerCig  = plan.pricePerPack / plan.cigsPerPack
baselineCigs = totalDaysSinceQuit * plan.cigarettesPd
loggedCigs   = SUM(SmokeLog.count) WHERE userId
avoided      = max(0, baselineCigs - loggedCigs)
moneySavedActual = avoided * pricePerCig
```

If `pricePerPack`, `cigsPerPack`, or `cigarettesPd` is null → return `null`. UI renders dash.

### Service ownership

- `progress.service.ts` — extended with the four methods above. Each takes `userId` and returns its own scalar; `getProgress(userId)` composes them.
- `smoke-log.service.ts` — owns log insertion + history + heatmap queries.
- All methods unit-testable with mocked Prisma.

---

## 6. Gamification on Slip

`SmokeLogService.create(userId)` runs a single Prisma `$transaction`:

1. Insert `SmokeLog` row.
2. Decrement `UserStats.totalPoints` by 2, clamped to ≥ 0. Implementation: read current `totalPoints`, compute `next = max(0, current - 2)`, then `update` with the absolute value (keeps everything in Prisma; no raw SQL needed).
3. Delete every `Badge` row for this user whose `badgeKey` is in the streak-milestone set:

   ```ts
   const STREAK_BADGE_KEYS = ['streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_60', 'streak_90'];
   ```

4. Return the inserted row + recomputed `currentStreak`, `totalSmokeFreeDays`, `totalPoints`.

**Re-earning streak badges**

Audit `gamification.service.ts` for the existing badge-award path. It must re-fire when the user rebuilds streak. If today's logic only awards on activity-log events, add a re-check trigger keyed on `currentStreak` boundaries. Acceptable simplification for v1: re-check on the dashboard read path (`GET /progress`) — award any streak badge the user qualifies for that they don't yet hold.

`UserStats.cravingsManaged` is untouched — different metric (toolkit usage).

---

## 7. Frontend

### `<SmokeLogFab />`

- File: `components/smoke-log-fab.tsx`.
- Mounted in `app/(dashboard)/layout.tsx` so it persists across all dashboard subpages.
- Position: `fixed bottom-20 right-4 z-40` (clears bottom-nav at h-16).
- 56×56 circular button. Icon: cigarette (lucide `Cigarette`). Background: muted red/amber (e.g., `bg-amber-500 hover:bg-amber-600`). Slip ≠ success — visually distinct from green primary.
- `aria-label="Log a smoke"`.

### `<SmokeLogConfirmDialog />`

- shadcn `<Dialog>`.
- Title: "Log a slip?"
- Body: "Slip ≠ failure. Honesty helps."
- Actions: `Cancel` (ghost) / `Yes, I smoked` (destructive variant).
- Confirm path: client `fetch('/api/smoke-log', { method: 'POST' })` (or whichever proxy pattern the FE already uses for authenticated calls — match `proxy.ts` setup).
- Loading state on confirm button (spinner). Disable both buttons while pending.
- Success: close modal, show toast, `router.refresh()`.
- Error: show error toast, leave modal open, show retry.

If the combined component stays under ~150 lines, keep FAB + dialog in one file. Split if it grows.

### Dashboard (`app/(dashboard)/dashboard/page.tsx`)

Replace stat grid (per Q9-A):

```
┌──────────────┬───────────────────┐
│ Current      │ Total Smoke-      │
│ Streak       │ Free Days         │
│   12 days    │   45 days         │
├──────────────┼───────────────────┤
│ Money Saved  │ Total Points      │
│  RM 84.00    │   320             │
├──────────────┴───────────────────┤
│ Last slip: 12 days ago           │  text-xs text-gray-500
└──────────────────────────────────┘
```

- Drop "Cravings Managed" card from the dashboard grid (move detail to `/progress`).
- "Last slip" line:
  - `lastSlipAt` null → "No slips logged yet."
  - Same calendar day as today → "Last slip: today".
  - Otherwise → "Last slip: N days ago" with a small relative-time helper.
- `formatRM(moneySavedActual ?? 0)` for money card.
- Type updates: dashboard component's `data` shape adopts new `/progress` fields. Drop `daysSmokeFreee` and `moneySaved` references.

### Progress page (`app/(dashboard)/progress/page.tsx`)

Append two sections:

**Recent Slips (Q10)**

- Component: `components/smoke-history-list.tsx`.
- Source: `GET /smoke-log/history?days=14`.
- List up to 14 most recent entries: `<weekday>, <date> · <HH:mm> · <count> cig(s)`.
- Empty state: "No slips. Keep going."

**Smoke-Free Calendar (Q10)**

- Component: `components/smoke-heatmap.tsx`.
- Source: `GET /smoke-log/heatmap?from=<8 weeks ago>&to=<today>`.
- Render 8×7 grid (weeks × weekdays). Cells:
  - Pre-quit days (date < `quitPlan.quitDate`): gray.
  - Clean days: green.
  - Slip days: red. Cell click → popover with `count`.
- Legend underneath.

---

## 8. Architecture Notes

- Each new unit has one clear purpose:
  - `SmokeLogService` → log lifecycle + slip-history reads.
  - `ProgressService` (extended) → derived stats from logs + plan.
  - `GamificationService` (existing) → point + badge mutation.
  - `<SmokeLogFab />` + `<SmokeLogConfirmDialog />` → user-facing trigger.
  - `<SmokeHistoryList />`, `<SmokeHeatmap />` → presentation only.
- Communication: HTTP boundaries (FE → BE), NestJS DI (BE service-to-service), Prisma (BE → DB).
- Files focused: no service exceeds existing patterns. If `progress.service.ts` grows past ~200 lines after the additions, split derived-stat helpers into `progress.compute.ts`.

---

## 9. Testing

### Backend (Jest)

- Unit: each compute method (`currentStreak`, `totalSmokeFreeDays`, `lastSlipAt`, `moneySavedActual`) with mocked Prisma — no logs, one log, multiple logs same day, slip today vs slip yesterday, missing plan fields.
- Unit: `applySlipPenalty` decrements & clamps; deletes streak badges only; leaves non-streak badges alone.
- Integration / e2e: `POST /smoke-log` creates row, decrements points, revokes badges, returns updated stats. `GET /smoke-log/history` and `/heatmap` happy-path + range edge.
- Edge: user with no `QuitPlan` → 404 (consistent with `/progress`); points already 0 → stays 0.

### Frontend

- FAB renders on dashboard layout pages, not on auth/onboarding routes.
- Modal cancel does not call API.
- Confirm path: success toast + router refresh; error path: error toast + modal stays open.
- Dashboard renders new card shape with mock `/progress` payload (existing test pattern).

---

## 10. Open Risks / Flags

- **Timezone:** Server `now()` defines day boundaries. Users in Asia/KL may see "yesterday" entries near midnight UTC. Acceptable for v1; revisit if reported.
- **Badge re-award path:** Depends on existing `gamification.service.ts` award trigger. Audit during implementation; spec assumes a re-check on `/progress` read is acceptable if today's logic doesn't already cover it.
- **Money math edge cases:** Vape-only users with null `cigarettesPd` get a dashed money card. Future ticket can add vape-session math.
- **Dashboard stat removal:** Dropping "Cravings Managed" from dashboard grid is intentional (visual hierarchy). Ensure it remains visible somewhere on `/progress`.
- **No rate limit:** Confirm modal is the only spam guard. If abuse appears, add server-side throttle (e.g., max 30 logs/day).

---

## 11. Migration & Rollout

- Single Prisma migration adds the `SmokeLog` table and indexes. No backfill needed (no existing data).
- `/progress` response field rename (`daysSmokeFreee` → `currentStreak`, `moneySaved` → `moneySavedActual`) ships in the same release as the FE update — small blast radius (only dashboard + progress page consume them today).
- No feature flag. Ship behind normal release.
