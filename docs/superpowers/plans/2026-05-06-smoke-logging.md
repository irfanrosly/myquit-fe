# Smoke-Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user-driven smoke logging to MYQuitMate so streak / total smoke-free days / money saved reflect actual user behavior. Floating action button (FAB) on every dashboard page; confirm modal; new `SmokeLog` model; gamification penalty on slip; recent-slip list + 8-week heatmap on progress page.

**Architecture:**
Backend (NestJS 11 + Prisma 7) gains a `SmokeLog` table and a `smoke-log` module. Stats are derived at read time (no denormalized counters). Gamification fires a penalty + streak-badge revoke inside the slip transaction. Frontend (Next.js 16 + shadcn + sonner) mounts a persistent FAB in the dashboard layout, opens a confirm dialog, and renders new stat cards, slip history, and a calendar heatmap.

**Tech Stack:**
- Backend: NestJS 11, Prisma 7 with `@prisma/adapter-pg`, PostgreSQL, Jest (unit + e2e), class-validator
- Frontend: Next.js 16 (App Router, server components), React 19, shadcn UI components (`Dialog` to be added), sonner toasts, lucide-react icons

**Repos / paths:**
- Backend repo root: `/Users/i.rosly/my-quit/my-quit-be`
- Frontend repo root: `/Users/i.rosly/my-quit/my-quit-fe`

Both are independent git repos. Each task's commit happens in the appropriate repo.

---

## File Structure (decomposition)

### Backend (`my-quit-be`)

| File | Role | Status |
| --- | --- | --- |
| `prisma/schema.prisma` | Add `SmokeLog` model + `User.smokeLogs` relation | Modify |
| `prisma/migrations/<ts>_add_smoke_log/migration.sql` | Migration | Create (via CLI) |
| `src/modules/smoke-log/smoke-log.module.ts` | Module wiring | Create |
| `src/modules/smoke-log/smoke-log.controller.ts` | Routes: `POST /smoke-log`, `GET /smoke-log/history`, `GET /smoke-log/heatmap` | Create |
| `src/modules/smoke-log/smoke-log.service.ts` | Insert + history + heatmap | Create |
| `src/modules/smoke-log/smoke-log.service.spec.ts` | Unit tests | Create |
| `src/modules/smoke-log/dto/history-query.dto.ts` | `?days=` validation | Create |
| `src/modules/smoke-log/dto/heatmap-query.dto.ts` | `?from=&to=` validation | Create |
| `src/app.module.ts` | Register `SmokeLogModule` | Modify |
| `src/modules/progress/progress.service.ts` | Add derived stats; replace old fields | Modify |
| `src/modules/progress/progress.service.spec.ts` | Update + add tests | Modify |
| `src/modules/gamification/gamification.service.ts` | Add `applySlipPenalty`; fix streak badge logic | Modify |
| `src/modules/gamification/gamification.service.spec.ts` | Update + add tests | Modify |
| `test/smoke-log.e2e-spec.ts` | End-to-end against running app | Create |

### Frontend (`my-quit-fe`)

| File | Role | Status |
| --- | --- | --- |
| `components/ui/dialog.tsx` | shadcn Dialog | Create (via `npx shadcn add`) |
| `components/smoke-log-fab.tsx` | FAB + confirm dialog (single client component) | Create |
| `components/smoke-history-list.tsx` | Recent slips list | Create |
| `components/smoke-heatmap.tsx` | 8-week calendar heatmap | Create |
| `lib/api/smoke-log.ts` | API client wrappers | Create |
| `lib/utils/relative-time.ts` | "X days ago" / "today" helper | Create |
| `types/index.ts` | Update `Progress` shape; add `SmokeLog` + heatmap/history types | Modify |
| `app/(dashboard)/layout.tsx` | Mount `<SmokeLogFab />` | Modify |
| `app/(dashboard)/dashboard/page.tsx` | New stat cards + last-slip line; drop cravings card | Modify |
| `app/(dashboard)/progress/page.tsx` | Use new fields; append history + heatmap sections | Modify |

---

## Cross-Cutting Conventions

- **Backend commit style** matches existing repo: short imperative subject, optional body. Example: `feat(smoke-log): add prisma model and migration`.
- **All backend services** use `PrismaService` from `src/prisma/prisma.service.ts`. PrismaModule is global (already wired in `app.module.ts`).
- **All HTTP responses** are wrapped by `TransformInterceptor` → `{ data, statusCode, timestamp }`. Frontend `apiClient` already unwraps `data`.
- **JWT guard** is applied at controller class level via `@UseGuards(JwtAuthGuard)`.
- **`@CurrentUser()`** decorator returns `{ id: string }`.
- **TDD discipline:** write a failing test, run it red, implement, run it green, commit. One feature per commit.
- **Run command (backend tests):** `npm test -- <path>` from `my-quit-be`. E2E: `npm run test:e2e`.
- **Run command (backend dev):** `npm run start:dev` from `my-quit-be` (port 3001).
- **Run command (frontend dev):** `npm run dev` from `my-quit-fe` (port 3002 in CORS).

---

## Backend Tasks

---

### Task 1: Add `SmokeLog` Prisma model + run migration

**Files:**
- Modify: `my-quit-be/prisma/schema.prisma` (append after `MoodLog`, before `ActivityLog`)
- Create (via CLI): `my-quit-be/prisma/migrations/<timestamp>_add_smoke_log/migration.sql`

- [ ] **Step 1: Add the model + relation in `schema.prisma`**

In `my-quit-be/prisma/schema.prisma`, inside the `User` model add this line in the relations block (after `stats UserStats?`):

```prisma
smokeLogs     SmokeLog[]
```

Then append a new model after `MoodLog`:

```prisma
model SmokeLog {
  id         String   @id @default(uuid())
  userId     String
  count      Int      @default(1)
  loggedAt   DateTime @default(now())
  loggedDate DateTime @db.Date
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, loggedDate])
  @@index([userId, loggedAt])
}
```

- [ ] **Step 2: Generate and apply migration**

Run from `my-quit-be`:

```bash
npx prisma migrate dev --name add_smoke_log
```

Expected: prompt-free run that prints `Applying migration ...add_smoke_log`, generates Prisma client, and creates `prisma/migrations/<timestamp>_add_smoke_log/migration.sql`.

If the local DB is unreachable, abort and surface the error to the user — do not proceed.

- [ ] **Step 3: Sanity-check generated SQL**

Open the new `migration.sql`. It should contain `CREATE TABLE "SmokeLog"` with `loggedDate DATE` and two indexes. No additional changes expected.

- [ ] **Step 4: Commit**

```bash
cd /Users/i.rosly/my-quit/my-quit-be
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(smoke-log): add SmokeLog model and migration"
```

---

### Task 2: Gamification — add `applySlipPenalty` (TDD)

**Files:**
- Modify: `my-quit-be/src/modules/gamification/gamification.service.ts`
- Modify: `my-quit-be/src/modules/gamification/gamification.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

In `my-quit-be/src/modules/gamification/gamification.service.spec.ts`, expand `mockPrisma`:

```ts
const mockPrisma = {
  userStats: { findUnique: jest.fn(), update: jest.fn() },
  badge: { findMany: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn() },
  quitPlan: { findUnique: jest.fn() },
  moodLog: { count: jest.fn() },
  smokeLog: { findFirst: jest.fn(), aggregate: jest.fn(), groupBy: jest.fn() },
  $transaction: jest.fn(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
};
```

Append these test cases inside the `describe('GamificationService', ...)` block:

```ts
describe('applySlipPenalty', () => {
  it('decrements totalPoints by 2 and clamps at zero', async () => {
    mockPrisma.userStats.findUnique.mockResolvedValue({ totalPoints: 1 });
    mockPrisma.userStats.update.mockResolvedValue({});
    mockPrisma.badge.deleteMany.mockResolvedValue({ count: 0 });

    await service.applySlipPenalty('user1');

    expect(mockPrisma.userStats.update).toHaveBeenCalledWith({
      where: { userId: 'user1' },
      data: { totalPoints: 0 },
    });
  });

  it('subtracts the full 2 when balance permits', async () => {
    mockPrisma.userStats.findUnique.mockResolvedValue({ totalPoints: 30 });
    mockPrisma.userStats.update.mockResolvedValue({});
    mockPrisma.badge.deleteMany.mockResolvedValue({ count: 0 });

    await service.applySlipPenalty('user1');

    expect(mockPrisma.userStats.update).toHaveBeenCalledWith({
      where: { userId: 'user1' },
      data: { totalPoints: 28 },
    });
  });

  it('deletes only streak-milestone badges', async () => {
    mockPrisma.userStats.findUnique.mockResolvedValue({ totalPoints: 100 });
    mockPrisma.userStats.update.mockResolvedValue({});
    mockPrisma.badge.deleteMany.mockResolvedValue({ count: 3 });

    await service.applySlipPenalty('user1');

    expect(mockPrisma.badge.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user1',
        badgeKey: {
          in: [
            'streak_1', 'streak_3', 'streak_7', 'streak_14',
            'streak_30', 'streak_60', 'streak_90', 'streak_180', 'streak_365',
          ],
        },
      },
    });
  });

  it('handles missing UserStats row by treating points as zero', async () => {
    mockPrisma.userStats.findUnique.mockResolvedValue(null);
    mockPrisma.userStats.update.mockResolvedValue({});
    mockPrisma.badge.deleteMany.mockResolvedValue({ count: 0 });

    await service.applySlipPenalty('user1');

    expect(mockPrisma.userStats.update).toHaveBeenCalledWith({
      where: { userId: 'user1' },
      data: { totalPoints: 0 },
    });
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
cd /Users/i.rosly/my-quit/my-quit-be
npm test -- gamification.service.spec
```

Expected: FAIL with `service.applySlipPenalty is not a function`.

- [ ] **Step 3: Implement `applySlipPenalty`**

In `my-quit-be/src/modules/gamification/gamification.service.ts`, near the top below the existing `ALL_BADGES` constant, add:

```ts
const STREAK_BADGE_KEYS = [
  'streak_1', 'streak_3', 'streak_7', 'streak_14',
  'streak_30', 'streak_60', 'streak_90', 'streak_180', 'streak_365',
];
```

Inside the `GamificationService` class, append:

```ts
async applySlipPenalty(userId: string): Promise<void> {
  const stats = await this.prisma.userStats.findUnique({ where: { userId } });
  const current = stats?.totalPoints ?? 0;
  const next = Math.max(0, current - 2);

  await this.prisma.$transaction([
    this.prisma.userStats.update({
      where: { userId },
      data: { totalPoints: next },
    }),
    this.prisma.badge.deleteMany({
      where: { userId, badgeKey: { in: STREAK_BADGE_KEYS } },
    }),
  ]);
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
npm test -- gamification.service.spec
```

Expected: PASS, all four new tests green plus the existing five.

- [ ] **Step 5: Commit**

```bash
git add src/modules/gamification/gamification.service.ts \
        src/modules/gamification/gamification.service.spec.ts
git commit -m "feat(gamification): add applySlipPenalty method"
```

---

### Task 3: Gamification — drive streak badges off `currentStreak`, not days-since-quit (TDD)

**Why:** Current `checkAndAwardBadges` awards `streak_30` based on `floor((now - quitDate)/86400)`. After a slip, the user must re-earn streak badges; the current logic would re-award them immediately. Switch the streak category to use the actual current smoke-free streak (derived from `SmokeLog`).

**Files:**
- Modify: `my-quit-be/src/modules/gamification/gamification.service.ts`
- Modify: `my-quit-be/src/modules/gamification/gamification.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Append inside the `describe('GamificationService', ...)` block:

```ts
describe('checkAndAwardBadges streak category', () => {
  it('uses time since last slip when slips exist', async () => {
    const quitDate = new Date();
    quitDate.setDate(quitDate.getDate() - 30);

    const lastSlip = new Date();
    lastSlip.setDate(lastSlip.getDate() - 2);

    mockPrisma.quitPlan.findUnique.mockResolvedValue({
      quitDate, cigarettesPd: 0, pricePerPack: 0, cigsPerPack: 20,
    });
    mockPrisma.userStats.findUnique.mockResolvedValue({ totalPoints: 0, cravingsManaged: 0 });
    mockPrisma.badge.findMany.mockResolvedValue([]);
    mockPrisma.moodLog.count.mockResolvedValue(0);
    mockPrisma.smokeLog.findFirst.mockResolvedValue({ loggedAt: lastSlip });
    mockPrisma.badge.createMany.mockResolvedValue({ count: 0 });

    const result = await service.checkAndAwardBadges('user1');

    // Days-since-quit would be 30 → would award streak_30. Streak from last slip
    // is only ~2 days → should award streak_1 only.
    expect(result).toContain('streak_1');
    expect(result).not.toContain('streak_30');
  });

  it('falls back to days-since-quit when no slips exist', async () => {
    const quitDate = new Date();
    quitDate.setDate(quitDate.getDate() - 7);

    mockPrisma.quitPlan.findUnique.mockResolvedValue({
      quitDate, cigarettesPd: 0, pricePerPack: 0, cigsPerPack: 20,
    });
    mockPrisma.userStats.findUnique.mockResolvedValue({ totalPoints: 0, cravingsManaged: 0 });
    mockPrisma.badge.findMany.mockResolvedValue([]);
    mockPrisma.moodLog.count.mockResolvedValue(0);
    mockPrisma.smokeLog.findFirst.mockResolvedValue(null);
    mockPrisma.badge.createMany.mockResolvedValue({ count: 0 });

    const result = await service.checkAndAwardBadges('user1');

    expect(result).toContain('streak_1');
    expect(result).toContain('streak_7');
    expect(result).not.toContain('streak_14');
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
npm test -- gamification.service.spec
```

Expected: FAIL — first test will award `streak_30`.

- [ ] **Step 3: Update `checkAndAwardBadges` to use `currentStreak`**

In `my-quit-be/src/modules/gamification/gamification.service.ts`, replace the body of `checkAndAwardBadges` from `const [plan, stats, earnedBadges, totalLogged]` through the loop with:

```ts
async checkAndAwardBadges(userId: string): Promise<string[]> {
  const [plan, stats, earnedBadges, totalLogged, lastSlip] = await Promise.all([
    this.prisma.quitPlan.findUnique({ where: { userId } }),
    this.prisma.userStats.findUnique({ where: { userId } }),
    this.prisma.badge.findMany({ where: { userId }, select: { badgeKey: true } }),
    this.prisma.moodLog.count({ where: { userId } }),
    this.prisma.smokeLog.findFirst({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      select: { loggedAt: true },
    }),
  ]);

  if (!plan) return [];

  const earnedKeys = new Set(earnedBadges.map((b) => b.badgeKey));

  const now = Date.now();
  const quit = new Date(plan.quitDate).getTime();
  const daysSinceQuit = Math.max(0, Math.floor((now - quit) / 86400000));
  const currentStreak = lastSlip
    ? Math.max(0, Math.floor((now - new Date(lastSlip.loggedAt).getTime()) / 86400000))
    : daysSinceQuit;

  const pricePerPack = Number(plan.pricePerPack ?? 0);
  const dailyCost = (pricePerPack / (plan.cigsPerPack ?? 20)) * (plan.cigarettesPd ?? 0);
  const moneySaved = currentStreak * dailyCost;

  const cravingsManaged = stats?.cravingsManaged ?? 0;
  const newBadges: string[] = [];

  for (const badge of ALL_BADGES) {
    if (earnedKeys.has(badge.key)) continue;

    let earned = false;
    if (badge.category === 'streak') earned = currentStreak >= badge.threshold;
    if (badge.category === 'savings') earned = moneySaved >= badge.threshold;
    if (badge.category === 'cravings') earned = cravingsManaged >= badge.threshold;
    if (badge.category === 'logging') earned = totalLogged >= badge.threshold;

    if (earned) newBadges.push(badge.key);
  }

  if (newBadges.length > 0) {
    await this.prisma.badge.createMany({
      data: newBadges.map((key) => ({ userId, badgeKey: key })),
      skipDuplicates: true,
    });
  }

  return newBadges;
}
```

Note: `moneySaved` for badge purposes now uses `currentStreak` so savings milestones don't re-award post-slip while the user is still rebuilding. This is intentionally conservative.

- [ ] **Step 4: Update existing `checkAndAwardBadges returns empty array when no quit plan` test**

The existing test mocks `mockPrisma.quitPlan.findUnique.mockResolvedValue(null)` — that path returns early before touching `smokeLog`, so it still passes. But ensure the existing mock object has `smokeLog: { findFirst: jest.fn() }` (already added in Task 2). No edit needed.

- [ ] **Step 5: Run tests, verify they pass**

```bash
npm test -- gamification.service.spec
```

Expected: PASS, all tests green.

- [ ] **Step 6: Commit**

```bash
git add src/modules/gamification/gamification.service.ts \
        src/modules/gamification/gamification.service.spec.ts
git commit -m "fix(gamification): drive streak badges off current streak, not quit date"
```

---

### Task 4: SmokeLog DTOs

**Files:**
- Create: `my-quit-be/src/modules/smoke-log/dto/history-query.dto.ts`
- Create: `my-quit-be/src/modules/smoke-log/dto/heatmap-query.dto.ts`

- [ ] **Step 1: Create `history-query.dto.ts`**

```ts
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class HistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 14;
}
```

- [ ] **Step 2: Create `heatmap-query.dto.ts`**

```ts
import { IsDateString } from 'class-validator';

export class HeatmapQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/smoke-log/dto
git commit -m "feat(smoke-log): add query DTOs"
```

---

### Task 5: SmokeLog service — `create()` (TDD)

**Files:**
- Create: `my-quit-be/src/modules/smoke-log/smoke-log.service.ts`
- Create: `my-quit-be/src/modules/smoke-log/smoke-log.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `my-quit-be/src/modules/smoke-log/smoke-log.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { SmokeLogService } from './smoke-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';

const mockPrisma = {
  smokeLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  userStats: { findUnique: jest.fn() },
  quitPlan: { findUnique: jest.fn() },
};

const mockGamification = {
  applySlipPenalty: jest.fn(),
};

describe('SmokeLogService', () => {
  let service: SmokeLogService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SmokeLogService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GamificationService, useValue: mockGamification },
      ],
    }).compile();
    service = module.get<SmokeLogService>(SmokeLogService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a SmokeLog row with server-stamped timestamp and date', async () => {
      const inserted = {
        id: 'log-1',
        userId: 'user1',
        count: 1,
        loggedAt: new Date('2026-05-06T10:00:00Z'),
        loggedDate: new Date('2026-05-06T00:00:00Z'),
        createdAt: new Date(),
      };
      mockPrisma.smokeLog.create.mockResolvedValue(inserted);
      mockGamification.applySlipPenalty.mockResolvedValue(undefined);
      mockPrisma.userStats.findUnique.mockResolvedValue({ totalPoints: 8 });
      mockPrisma.smokeLog.findFirst.mockResolvedValue(inserted);
      mockPrisma.smokeLog.aggregate.mockResolvedValue({ _sum: { count: 1 } });
      mockPrisma.smokeLog.groupBy.mockResolvedValue([{ loggedDate: inserted.loggedDate }]);
      mockPrisma.quitPlan.findUnique.mockResolvedValue({
        quitDate: new Date('2026-04-26'),
        cigarettesPd: 10, pricePerPack: 15, cigsPerPack: 20,
      });

      const result = await service.create('user1');

      expect(mockPrisma.smokeLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user1',
          count: 1,
          loggedAt: expect.any(Date),
          loggedDate: expect.any(Date),
        }),
      });
      expect(mockGamification.applySlipPenalty).toHaveBeenCalledWith('user1');
      expect(result).toMatchObject({
        id: 'log-1',
        count: 1,
        totalPoints: 8,
      });
      expect(result.currentStreak).toBeGreaterThanOrEqual(0);
      expect(result.totalSmokeFreeDays).toBeGreaterThanOrEqual(0);
    });

    it('uses today (UTC midnight) for loggedDate', async () => {
      const inserted = {
        id: 'log-2', userId: 'user1', count: 1,
        loggedAt: new Date(), loggedDate: new Date(), createdAt: new Date(),
      };
      mockPrisma.smokeLog.create.mockResolvedValue(inserted);
      mockGamification.applySlipPenalty.mockResolvedValue(undefined);
      mockPrisma.userStats.findUnique.mockResolvedValue({ totalPoints: 0 });
      mockPrisma.smokeLog.findFirst.mockResolvedValue(inserted);
      mockPrisma.smokeLog.aggregate.mockResolvedValue({ _sum: { count: 1 } });
      mockPrisma.smokeLog.groupBy.mockResolvedValue([{ loggedDate: inserted.loggedDate }]);
      mockPrisma.quitPlan.findUnique.mockResolvedValue({
        quitDate: new Date(), cigarettesPd: 0, pricePerPack: 0, cigsPerPack: 20,
      });

      await service.create('user1');

      const calledArgs = mockPrisma.smokeLog.create.mock.calls[0][0].data;
      const date: Date = calledArgs.loggedDate;
      expect(date.getUTCHours()).toBe(0);
      expect(date.getUTCMinutes()).toBe(0);
      expect(date.getUTCSeconds()).toBe(0);
    });
  });
});
```

- [ ] **Step 2: Create the service skeleton so the test file imports**

Create `my-quit-be/src/modules/smoke-log/smoke-log.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class SmokeLogService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}
}
```

- [ ] **Step 3: Run tests, verify they fail**

```bash
cd /Users/i.rosly/my-quit/my-quit-be
npm test -- smoke-log.service.spec
```

Expected: FAIL with `service.create is not a function`.

- [ ] **Step 4: Implement `create()`**

Append to `SmokeLogService`:

```ts
async create(userId: string) {
  const now = new Date();
  const loggedDate = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
  ));

  const log = await this.prisma.smokeLog.create({
    data: { userId, count: 1, loggedAt: now, loggedDate },
  });

  await this.gamification.applySlipPenalty(userId);

  const [stats, plan, lastSlip, sumAgg, distinctDays] = await Promise.all([
    this.prisma.userStats.findUnique({ where: { userId } }),
    this.prisma.quitPlan.findUnique({ where: { userId } }),
    this.prisma.smokeLog.findFirst({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      select: { loggedAt: true },
    }),
    this.prisma.smokeLog.aggregate({
      where: { userId },
      _sum: { count: true },
    }),
    this.prisma.smokeLog.groupBy({
      by: ['loggedDate'],
      where: { userId },
    }),
  ]);

  const currentStreak = computeCurrentStreak(plan?.quitDate ?? null, lastSlip?.loggedAt ?? null);
  const daysSinceQuit = computeDaysSinceQuit(plan?.quitDate ?? null);
  const totalSmokeFreeDays = Math.max(0, daysSinceQuit - distinctDays.length);

  return {
    id: log.id,
    loggedAt: log.loggedAt,
    loggedDate: log.loggedDate,
    count: log.count,
    currentStreak,
    totalSmokeFreeDays,
    totalPoints: stats?.totalPoints ?? 0,
  };
}
```

Then at the bottom of the file (outside the class), add the helpers:

```ts
function computeDaysSinceQuit(quitDate: Date | null): number {
  if (!quitDate) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(quitDate).getTime()) / 86400000));
}

function computeCurrentStreak(quitDate: Date | null, lastSlipAt: Date | null): number {
  const ref = lastSlipAt ?? quitDate;
  if (!ref) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(ref).getTime()) / 86400000));
}
```

- [ ] **Step 5: Run tests, verify they pass**

```bash
npm test -- smoke-log.service.spec
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/smoke-log/smoke-log.service.ts \
        src/modules/smoke-log/smoke-log.service.spec.ts
git commit -m "feat(smoke-log): add service create() with slip penalty"
```

---

### Task 6: SmokeLog service — `getHistory()` (TDD)

**Files:**
- Modify: `my-quit-be/src/modules/smoke-log/smoke-log.service.ts`
- Modify: `my-quit-be/src/modules/smoke-log/smoke-log.service.spec.ts`

- [ ] **Step 1: Add the failing test**

Append a new `describe` inside the same suite:

```ts
describe('getHistory', () => {
  it('returns recent logs ordered by loggedAt desc, capped at days window', async () => {
    const items = [
      { id: 'a', loggedAt: new Date('2026-05-06T10:00Z'), count: 1 },
      { id: 'b', loggedAt: new Date('2026-05-04T08:00Z'), count: 2 },
    ];
    mockPrisma.smokeLog.findMany.mockResolvedValue(items);

    const result = await service.getHistory('user1', 14);

    expect(mockPrisma.smokeLog.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user1',
        loggedAt: { gte: expect.any(Date) },
      },
      orderBy: { loggedAt: 'desc' },
      select: { id: true, loggedAt: true, count: true },
    });
    expect(result).toEqual({ items });
  });

  it('defaults to 14 days when no value provided', async () => {
    mockPrisma.smokeLog.findMany.mockResolvedValue([]);
    await service.getHistory('user1');
    const call = mockPrisma.smokeLog.findMany.mock.calls[0][0];
    const gte: Date = call.where.loggedAt.gte;
    const diffDays = (Date.now() - gte.getTime()) / 86400000;
    expect(diffDays).toBeGreaterThan(13);
    expect(diffDays).toBeLessThan(15);
  });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
npm test -- smoke-log.service.spec
```

Expected: FAIL — `getHistory is not a function`.

- [ ] **Step 3: Implement `getHistory`**

Append to `SmokeLogService`:

```ts
async getHistory(userId: string, days = 14) {
  const since = new Date(Date.now() - days * 86400000);
  const items = await this.prisma.smokeLog.findMany({
    where: { userId, loggedAt: { gte: since } },
    orderBy: { loggedAt: 'desc' },
    select: { id: true, loggedAt: true, count: true },
  });
  return { items };
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm test -- smoke-log.service.spec
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/smoke-log/smoke-log.service.ts \
        src/modules/smoke-log/smoke-log.service.spec.ts
git commit -m "feat(smoke-log): add getHistory()"
```

---

### Task 7: SmokeLog service — `getHeatmap()` (TDD)

**Files:**
- Modify: `my-quit-be/src/modules/smoke-log/smoke-log.service.ts`
- Modify: `my-quit-be/src/modules/smoke-log/smoke-log.service.spec.ts`

- [ ] **Step 1: Add the failing test**

```ts
describe('getHeatmap', () => {
  it('returns one row per slip-day with summed counts', async () => {
    mockPrisma.smokeLog.groupBy.mockResolvedValue([
      { loggedDate: new Date('2026-05-04'), _sum: { count: 2 } },
      { loggedDate: new Date('2026-05-06'), _sum: { count: 1 } },
    ]);

    const result = await service.getHeatmap('user1', '2026-05-01', '2026-05-07');

    expect(mockPrisma.smokeLog.groupBy).toHaveBeenCalledWith({
      by: ['loggedDate'],
      where: {
        userId: 'user1',
        loggedDate: { gte: expect.any(Date), lte: expect.any(Date) },
      },
      _sum: { count: true },
      orderBy: { loggedDate: 'asc' },
    });
    expect(result).toEqual({
      days: [
        { date: '2026-05-04', count: 2 },
        { date: '2026-05-06', count: 1 },
      ],
    });
  });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
npm test -- smoke-log.service.spec
```

Expected: FAIL — `getHeatmap is not a function`.

- [ ] **Step 3: Implement `getHeatmap`**

Append to `SmokeLogService`:

```ts
async getHeatmap(userId: string, from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const rows = await this.prisma.smokeLog.groupBy({
    by: ['loggedDate'],
    where: {
      userId,
      loggedDate: { gte: fromDate, lte: toDate },
    },
    _sum: { count: true },
    orderBy: { loggedDate: 'asc' },
  });

  const days = rows.map((r) => ({
    date: toIsoDate(r.loggedDate),
    count: r._sum.count ?? 0,
  }));

  return { days };
}
```

Add helper at file bottom:

```ts
function toIsoDate(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm test -- smoke-log.service.spec
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/smoke-log/smoke-log.service.ts \
        src/modules/smoke-log/smoke-log.service.spec.ts
git commit -m "feat(smoke-log): add getHeatmap()"
```

---

### Task 8: SmokeLog controller + module + AppModule wiring

**Files:**
- Create: `my-quit-be/src/modules/smoke-log/smoke-log.controller.ts`
- Create: `my-quit-be/src/modules/smoke-log/smoke-log.module.ts`
- Modify: `my-quit-be/src/app.module.ts`

- [ ] **Step 1: Create the controller**

```ts
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SmokeLogService } from './smoke-log.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HistoryQueryDto } from './dto/history-query.dto';
import { HeatmapQueryDto } from './dto/heatmap-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('smoke-log')
export class SmokeLogController {
  constructor(private smokeLog: SmokeLogService) {}

  @Post()
  create(@CurrentUser() user: { id: string }) {
    return this.smokeLog.create(user.id);
  }

  @Get('history')
  getHistory(@CurrentUser() user: { id: string }, @Query() q: HistoryQueryDto) {
    return this.smokeLog.getHistory(user.id, q.days);
  }

  @Get('heatmap')
  getHeatmap(@CurrentUser() user: { id: string }, @Query() q: HeatmapQueryDto) {
    return this.smokeLog.getHeatmap(user.id, q.from, q.to);
  }
}
```

(`@Body()` import retained even if unused — leave for now; remove if linter complains.) Actually drop the `Body` import — not used:

```ts
import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
```

- [ ] **Step 2: Create the module**

`my-quit-be/src/modules/smoke-log/smoke-log.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { SmokeLogController } from './smoke-log.controller';
import { SmokeLogService } from './smoke-log.service';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [GamificationModule],
  controllers: [SmokeLogController],
  providers: [SmokeLogService],
  exports: [SmokeLogService],
})
export class SmokeLogModule {}
```

- [ ] **Step 3: Register in `AppModule`**

Edit `my-quit-be/src/app.module.ts`. Add import:

```ts
import { SmokeLogModule } from './modules/smoke-log/smoke-log.module';
```

Add `SmokeLogModule` to the `imports` array, between `CravingToolkitModule` and `AdminModule`.

- [ ] **Step 4: Boot smoke check**

```bash
cd /Users/i.rosly/my-quit/my-quit-be
npm run build
```

Expected: build succeeds, no TS errors.

- [ ] **Step 5: Commit**

```bash
git add src/modules/smoke-log/smoke-log.controller.ts \
        src/modules/smoke-log/smoke-log.module.ts \
        src/app.module.ts
git commit -m "feat(smoke-log): wire controller and module"
```

---

### Task 9: Progress service — `currentStreak` + `totalSmokeFreeDays` + `lastSlipAt` + `moneySavedActual` (TDD)

**Why combined:** All four read from the same upstream data and are added to one method (`getProgress`). One commit keeps the migration of `/progress` response shape atomic.

**Files:**
- Modify: `my-quit-be/src/modules/progress/progress.service.ts`
- Modify: `my-quit-be/src/modules/progress/progress.service.spec.ts`

- [ ] **Step 1: Update the existing test to match the new shape**

Replace `my-quit-be/src/modules/progress/progress.service.spec.ts` with:

```ts
import { Test } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  quitPlan: { findUnique: jest.fn() },
  smokeLog: {
    findFirst: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
};

describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ProgressService>(ProgressService);
    jest.clearAllMocks();
  });

  it('throws NotFoundException when no quit plan exists', async () => {
    mockPrisma.quitPlan.findUnique.mockResolvedValue(null);
    await expect(service.getProgress('user1')).rejects.toThrow(NotFoundException);
  });

  it('returns full smoke-free streak when no slips exist', async () => {
    const quitDate = new Date();
    quitDate.setDate(quitDate.getDate() - 10);
    mockPrisma.quitPlan.findUnique.mockResolvedValue({
      quitDate, cigarettesPd: 10, pricePerPack: 15, cigsPerPack: 20,
    });
    mockPrisma.smokeLog.findFirst.mockResolvedValue(null);
    mockPrisma.smokeLog.aggregate.mockResolvedValue({ _sum: { count: 0 } });
    mockPrisma.smokeLog.groupBy.mockResolvedValue([]);

    const result = await service.getProgress('user1');

    expect(result.currentStreak).toBe(10);
    expect(result.totalSmokeFreeDays).toBe(10);
    expect(result.lastSlipAt).toBeNull();
    expect(result.moneySavedActual).toBeCloseTo(75, 0);
  });

  it('resets currentStreak after a slip and subtracts logged cigs from money saved', async () => {
    const quitDate = new Date();
    quitDate.setDate(quitDate.getDate() - 10);
    const lastSlip = new Date();
    lastSlip.setDate(lastSlip.getDate() - 2);

    mockPrisma.quitPlan.findUnique.mockResolvedValue({
      quitDate, cigarettesPd: 10, pricePerPack: 15, cigsPerPack: 20,
    });
    mockPrisma.smokeLog.findFirst.mockResolvedValue({ loggedAt: lastSlip });
    mockPrisma.smokeLog.aggregate.mockResolvedValue({ _sum: { count: 4 } });
    mockPrisma.smokeLog.groupBy.mockResolvedValue([
      { loggedDate: new Date() }, { loggedDate: lastSlip },
    ]);

    const result = await service.getProgress('user1');

    // currentStreak ~ 2 (since last slip 2 days ago)
    expect(result.currentStreak).toBeGreaterThanOrEqual(1);
    expect(result.currentStreak).toBeLessThanOrEqual(2);
    // total days since quit = 10, slip days = 2, → 8 smoke-free
    expect(result.totalSmokeFreeDays).toBe(8);
    expect(result.lastSlipAt).toEqual(lastSlip);
    // baseline cigs = 10 days * 10 cigs = 100 ; logged = 4 ; avoided = 96
    // pricePerCig = 15/20 = 0.75 ; saved = 96 * 0.75 = 72
    expect(result.moneySavedActual).toBeCloseTo(72, 0);
  });

  it('returns null moneySavedActual when plan lacks pricing or cigarettesPd', async () => {
    const quitDate = new Date();
    quitDate.setDate(quitDate.getDate() - 5);
    mockPrisma.quitPlan.findUnique.mockResolvedValue({
      quitDate, cigarettesPd: null, pricePerPack: null, cigsPerPack: 20,
    });
    mockPrisma.smokeLog.findFirst.mockResolvedValue(null);
    mockPrisma.smokeLog.aggregate.mockResolvedValue({ _sum: { count: 0 } });
    mockPrisma.smokeLog.groupBy.mockResolvedValue([]);

    const result = await service.getProgress('user1');

    expect(result.moneySavedActual).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
npm test -- progress.service.spec
```

Expected: FAIL — old service still returns `daysSmokeFreee`/`moneySaved`, not the new shape.

- [ ] **Step 3: Replace `progress.service.ts`**

Overwrite `my-quit-be/src/modules/progress/progress.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async getProgress(userId: string) {
    const plan = await this.prisma.quitPlan.findUnique({ where: { userId } });
    if (!plan) throw new NotFoundException('No quit plan found');

    const [lastSlip, sumAgg, distinctDays] = await Promise.all([
      this.prisma.smokeLog.findFirst({
        where: { userId },
        orderBy: { loggedAt: 'desc' },
        select: { loggedAt: true },
      }),
      this.prisma.smokeLog.aggregate({
        where: { userId },
        _sum: { count: true },
      }),
      this.prisma.smokeLog.groupBy({
        by: ['loggedDate'],
        where: { userId },
      }),
    ]);

    const now = Date.now();
    const quit = new Date(plan.quitDate).getTime();
    const daysSinceQuit = Math.max(0, Math.floor((now - quit) / 86400000));

    const currentStreak = lastSlip
      ? Math.max(0, Math.floor((now - new Date(lastSlip.loggedAt).getTime()) / 86400000))
      : daysSinceQuit;

    const totalSmokeFreeDays = Math.max(0, daysSinceQuit - distinctDays.length);

    const cigsPerPack = plan.cigsPerPack ?? 20;
    const pricePerPack = plan.pricePerPack !== null && plan.pricePerPack !== undefined
      ? Number(plan.pricePerPack)
      : null;
    const cigarettesPd = plan.cigarettesPd ?? null;

    let moneySavedActual: number | null = null;
    let dailyCost: number | null = null;
    if (pricePerPack !== null && cigarettesPd !== null) {
      const pricePerCig = pricePerPack / cigsPerPack;
      const baselineCigs = daysSinceQuit * cigarettesPd;
      const loggedCigs = sumAgg._sum.count ?? 0;
      const avoided = Math.max(0, baselineCigs - loggedCigs);
      moneySavedActual = parseFloat((avoided * pricePerCig).toFixed(2));
      dailyCost = parseFloat((pricePerCig * cigarettesPd).toFixed(2));
    }

    return {
      currentStreak,
      totalSmokeFreeDays,
      lastSlipAt: lastSlip?.loggedAt ?? null,
      moneySavedActual,
      quitDate: plan.quitDate,
      cigarettesPd,
      dailyCost,
    };
  }
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
npm test -- progress.service.spec
```

Expected: PASS, all four tests green.

- [ ] **Step 5: Commit**

```bash
git add src/modules/progress/progress.service.ts \
        src/modules/progress/progress.service.spec.ts
git commit -m "feat(progress): replace days/moneySaved with streak/total/actual fields"
```

---

### Task 10: Backend e2e — POST/GET smoke-log + new /progress shape

**Files:**
- Create: `my-quit-be/test/smoke-log.e2e-spec.ts`

**Pattern:** This e2e spec follows `test/app.e2e-spec.ts`. It bootstraps the full Nest app against the real database. **Pre-requisite:** the test DB is migrated (Task 1 already did this for dev — `npm run test:e2e` will use the same DB unless the project sets a separate `DATABASE_URL_TEST`; check `test/jest-e2e.json` for env-loading specifics before running. If the existing e2e suite already runs against dev DB, this one follows suit.)

- [ ] **Step 1: Read the existing e2e to mirror its setup**

```bash
cat test/app.e2e-spec.ts
cat test/jest-e2e.json
```

Note the bootstrap pattern (likely `Test.createTestingModule({ imports: [AppModule] })` with `app.init()`), how authentication is acquired, and how DB cleanup is done. Mirror it.

- [ ] **Step 2: Write the e2e spec**

Create `my-quit-be/test/smoke-log.e2e-spec.ts`. Use the same auth helper pattern as `app.e2e-spec.ts`. Skeleton:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('SmokeLog (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookies: string[];
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    // Register + login a fresh user, store cookies, capture userId.
    const email = `smoke-${Date.now()}@test.local`;
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Password123!', name: 'Smoke Tester' })
      .expect(201);
    cookies = reg.headers['set-cookie'];
    userId = reg.body.data.user.id;

    // Create a quit plan dated 10 days ago.
    const quitDate = new Date();
    quitDate.setDate(quitDate.getDate() - 10);
    await prisma.quitPlan.create({
      data: {
        userId,
        quitDate,
        cigsPerPack: 20,
        pricePerPack: 15 as unknown as number,
        cigarettesPd: 10,
      },
    });
    await prisma.userStats.create({ data: { userId, totalPoints: 50 } });
  });

  afterAll(async () => {
    await prisma.smokeLog.deleteMany({ where: { userId } });
    await prisma.badge.deleteMany({ where: { userId } });
    await prisma.userStats.deleteMany({ where: { userId } });
    await prisma.quitPlan.deleteMany({ where: { userId } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('POST /smoke-log creates row, decrements points, returns updated stats', async () => {
    const res = await request(app.getHttpServer())
      .post('/smoke-log')
      .set('Cookie', cookies)
      .expect(201);

    expect(res.body.data).toMatchObject({
      count: 1,
      totalPoints: 48,
    });
    expect(res.body.data.currentStreak).toBeLessThan(2);
    expect(res.body.data.totalSmokeFreeDays).toBe(9);
  });

  it('GET /smoke-log/history returns the inserted log', async () => {
    const res = await request(app.getHttpServer())
      .get('/smoke-log/history?days=14')
      .set('Cookie', cookies)
      .expect(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].count).toBe(1);
  });

  it('GET /smoke-log/heatmap returns one slip-day', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await request(app.getHttpServer())
      .get(`/smoke-log/heatmap?from=${today}&to=${today}`)
      .set('Cookie', cookies)
      .expect(200);
    expect(res.body.data.days).toEqual([{ date: today, count: 1 }]);
  });

  it('GET /progress reflects slip in currentStreak and moneySavedActual', async () => {
    const res = await request(app.getHttpServer())
      .get('/progress')
      .set('Cookie', cookies)
      .expect(200);
    const p = res.body.data;
    expect(p.totalSmokeFreeDays).toBe(9);
    expect(p.currentStreak).toBeLessThan(2);
    expect(p.lastSlipAt).not.toBeNull();
    expect(p.moneySavedActual).toBeCloseTo(74.25, 1); // (10*10 - 1) * 0.75
  });
});
```

If the existing e2e uses different request shapes (e.g. different login endpoint), adapt the auth setup to match it.

- [ ] **Step 3: Run e2e**

```bash
npm run test:e2e -- smoke-log
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add test/smoke-log.e2e-spec.ts
git commit -m "test(smoke-log): add e2e for slip endpoints and progress"
```

---

## Frontend Tasks

All frontend commands run from `/Users/i.rosly/my-quit/my-quit-fe`. There is no FE test framework; verification for frontend tasks is by browser interaction against the running backend (`npm run start:dev` in `my-quit-be`) plus `npm run dev` in `my-quit-fe`.

---

### Task 11: Add shadcn `Dialog` component

**Files:**
- Create: `my-quit-fe/components/ui/dialog.tsx`

- [ ] **Step 1: Install via shadcn CLI**

```bash
cd /Users/i.rosly/my-quit/my-quit-fe
npx shadcn@latest add dialog
```

Expected: prompts answered with defaults; writes `components/ui/dialog.tsx` and adds any missing radix dependency to `package.json`.

If the CLI fails (project uses base-ui rather than radix), fall back to creating the file manually using the official shadcn `dialog` source for `style: base-nova` from the shadcn registry.

- [ ] **Step 2: Verify import works**

```bash
npx tsc --noEmit
```

Expected: 0 type errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/dialog.tsx package.json package-lock.json
git commit -m "feat(ui): add shadcn dialog"
```

---

### Task 12: Update FE types + API client + utility

**Files:**
- Modify: `my-quit-fe/types/index.ts`
- Create: `my-quit-fe/lib/api/smoke-log.ts`
- Modify: `my-quit-fe/lib/api/progress.ts` (only if `Progress` type rename causes import drift — adjust imports)
- Create: `my-quit-fe/lib/utils/relative-time.ts`

- [ ] **Step 1: Update `types/index.ts`**

Replace the `Progress` interface with:

```ts
export interface Progress {
  currentStreak: number;
  totalSmokeFreeDays: number;
  lastSlipAt: string | null;
  moneySavedActual: number | null;
  quitDate: string;
  cigarettesPd: number | null;
  dailyCost: number | null;
}
```

Append:

```ts
export interface SmokeLogCreateResponse {
  id: string;
  loggedAt: string;
  loggedDate: string;
  count: number;
  currentStreak: number;
  totalSmokeFreeDays: number;
  totalPoints: number;
}

export interface SmokeLogHistoryItem {
  id: string;
  loggedAt: string;
  count: number;
}

export interface SmokeLogHistory {
  items: SmokeLogHistoryItem[];
}

export interface SmokeHeatmapDay {
  date: string;
  count: number;
}

export interface SmokeHeatmap {
  days: SmokeHeatmapDay[];
}
```

- [ ] **Step 2: Create `lib/api/smoke-log.ts`**

```ts
import { apiGet, apiPost } from './client';
import { SmokeLogCreateResponse, SmokeLogHistory, SmokeHeatmap } from '@/types';

export const smokeLogApi = {
  create: () => apiPost<SmokeLogCreateResponse>('/smoke-log'),
  history: (days = 14) => apiGet<SmokeLogHistory>(`/smoke-log/history?days=${days}`),
  heatmap: (from: string, to: string) =>
    apiGet<SmokeHeatmap>(`/smoke-log/heatmap?from=${from}&to=${to}`),
};
```

- [ ] **Step 3: Create `lib/utils/relative-time.ts`**

```ts
export function relativeDays(iso: string | null): string {
  if (!iso) return 'No slips logged yet.';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days <= 0) return 'Last slip: today';
  if (days === 1) return 'Last slip: 1 day ago';
  return `Last slip: ${days} days ago`;
}
```

- [ ] **Step 4: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. Dashboard and progress pages will still error on the old field names — these get fixed in Task 14 and Task 16. If `npx tsc --noEmit` fails on those two files specifically, that is expected; resolve in those tasks. **If errors appear elsewhere, stop and investigate.**

- [ ] **Step 5: Commit**

```bash
git add types/index.ts lib/api/smoke-log.ts lib/utils/relative-time.ts
git commit -m "feat(types): update Progress + add SmokeLog types and api client"
```

---

### Task 13: Build `<SmokeLogFab />` (FAB + confirm dialog)

**Files:**
- Create: `my-quit-fe/components/smoke-log-fab.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Cigarette } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { smokeLogApi } from '@/lib/api/smoke-log';

export function SmokeLogFab() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function confirm() {
    setSubmitting(true);
    try {
      await smokeLogApi.create();
      setOpen(false);
      toast.success("Logged. Streak reset. You're still on the path. 💪");
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? 'Could not log. Try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Log a smoke"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition-colors hover:bg-amber-600 active:bg-amber-700"
      >
        <Cigarette className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a slip?</DialogTitle>
            <DialogDescription>
              Slip ≠ failure. Honesty helps you understand your patterns.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirm}
              disabled={submitting}
            >
              {submitting ? 'Logging…' : 'Yes, I smoked'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors in this file. Pre-existing errors from Task 14/16 may still surface.

- [ ] **Step 3: Commit**

```bash
git add components/smoke-log-fab.tsx
git commit -m "feat(fe): add SmokeLogFab with confirm dialog"
```

---

### Task 14: Mount FAB in dashboard layout + update dashboard page

**Files:**
- Modify: `my-quit-fe/app/(dashboard)/layout.tsx`
- Modify: `my-quit-fe/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Mount the FAB**

Replace `my-quit-fe/app/(dashboard)/layout.tsx` with:

```tsx
import { BottomNav } from '@/components/bottom-nav';
import { SmokeLogFab } from '@/components/smoke-log-fab';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        {children}
      </div>
      <SmokeLogFab />
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Rewrite the dashboard page to use the new shape**

Replace `my-quit-fe/app/(dashboard)/dashboard/page.tsx` with:

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { formatRM } from '@/lib/utils/format-currency';
import { relativeDays } from '@/lib/utils/relative-time';

async function getDashboardData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) redirect('/login');

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const headers = { Cookie: cookieStore.toString() };

  const [progressRes, statsRes, userRes] = await Promise.all([
    fetch(`${API}/progress`, { headers, cache: 'no-store' }),
    fetch(`${API}/gamification/stats`, { headers, cache: 'no-store' }),
    fetch(`${API}/users/me`, { headers, cache: 'no-store' }),
  ]);

  if (progressRes.status === 404) return { noQuitPlan: true } as const;

  const [progress, stats, user] = await Promise.all([
    progressRes.json().then((r: { data: unknown }) => r.data),
    statsRes.json().then((r: { data: unknown }) => r.data),
    userRes.json().then((r: { data: unknown }) => r.data),
  ]);

  return { progress, stats, user, noQuitPlan: false } as const;
}

export default async function DashboardPage() {
  const data = await getDashboardData() as {
    progress?: {
      currentStreak: number;
      totalSmokeFreeDays: number;
      lastSlipAt: string | null;
      moneySavedActual: number | null;
    };
    stats?: { totalPoints: number };
    user?: { name: string };
    noQuitPlan: boolean;
  };

  if (data.noQuitPlan) redirect('/onboarding/profile');

  const { progress, stats, user } = data;

  const quickActions = [
    { href: '/craving-toolkit/breathing', label: '🫁 Breathing Exercise', desc: '+5 pts' },
    { href: '/craving-toolkit/distraction', label: '🎯 Distraction Tasks', desc: '+3 pts' },
    { href: '/craving-toolkit/mood', label: '📝 Log Mood', desc: '+2 pts' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-gray-500 text-sm">Welcome back,</p>
        <h1 className="text-2xl font-bold text-gray-800">{user?.name} 👋</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Current Streak"
          value={String(progress?.currentStreak ?? 0)}
          subtitle="days"
        />
        <StatCard
          label="Total Smoke-Free Days"
          value={String(progress?.totalSmokeFreeDays ?? 0)}
          subtitle="days"
        />
        <StatCard
          label="Money Saved"
          value={progress?.moneySavedActual !== null && progress?.moneySavedActual !== undefined
            ? formatRM(progress.moneySavedActual)
            : '—'}
          subtitle="actual"
        />
        <StatCard
          label="Total Points"
          value={String(stats?.totalPoints ?? 0)}
          subtitle="keep earning!"
        />
      </div>

      <p className="text-xs text-gray-500 -mt-2">
        {relativeDays(progress?.lastSlipAt ?? null)}
      </p>

      <div>
        <h2 className="font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="space-y-2">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <span className="font-medium text-gray-700">{a.label}</span>
                  <span className="text-xs text-green-600 font-medium">{a.desc}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: only `app/(dashboard)/progress/page.tsx` errors remain (Task 16 fixes).

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/layout.tsx app/(dashboard)/dashboard/page.tsx
git commit -m "feat(fe): mount FAB and update dashboard to new progress shape"
```

---

### Task 15: Build `<SmokeHistoryList />` and `<SmokeHeatmap />`

**Files:**
- Create: `my-quit-fe/components/smoke-history-list.tsx`
- Create: `my-quit-fe/components/smoke-heatmap.tsx`

- [ ] **Step 1: Create the history list component**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmokeLogHistoryItem } from '@/types';

function formatItem(iso: string): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString('en-MY', { weekday: 'short' });
  const date = d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
  return `${weekday}, ${date} · ${time}`;
}

export function SmokeHistoryList({ items }: { items: SmokeLogHistoryItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Slips</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No slips. Keep going.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between border-b last:border-b-0 pb-2 last:pb-0">
                <span className="text-gray-600">{formatItem(item.loggedAt)}</span>
                <span className="text-gray-500">{item.count} cig{item.count === 1 ? '' : 's'}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create the heatmap component**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmokeHeatmapDay } from '@/types';

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function SmokeHeatmap({
  days,
  weeks = 8,
  quitDate,
}: {
  days: SmokeHeatmapDay[];
  weeks?: number;
  quitDate: string;
}) {
  const slipMap = new Map(days.map((d) => [d.date, d.count]));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (weeks * 7 - 1));

  const cells: { key: string; date: Date; state: 'pre' | 'clean' | 'slip'; count: number }[] = [];
  const quit = new Date(quitDate);
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = dateKey(d);
    const count = slipMap.get(key) ?? 0;
    let state: 'pre' | 'clean' | 'slip' = 'clean';
    if (d < quit) state = 'pre';
    else if (count > 0) state = 'slip';
    cells.push({ key, date: d, state, count });
  }

  const colors: Record<typeof cells[number]['state'], string> = {
    pre: 'bg-gray-200',
    clean: 'bg-green-500',
    slip: 'bg-red-500',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Smoke-Free Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c) => (
            <div
              key={c.key}
              title={`${c.key}${c.state === 'slip' ? ` · ${c.count} cigs` : ''}`}
              className={`aspect-square rounded ${colors[c.state]}`}
            />
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-gray-500">
          <span><span className="inline-block w-3 h-3 rounded bg-green-500 align-middle mr-1" /> clean</span>
          <span><span className="inline-block w-3 h-3 rounded bg-red-500 align-middle mr-1" /> slip</span>
          <span><span className="inline-block w-3 h-3 rounded bg-gray-200 align-middle mr-1" /> pre-quit</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: only `app/(dashboard)/progress/page.tsx` errors remain (Task 16 fixes).

- [ ] **Step 4: Commit**

```bash
git add components/smoke-history-list.tsx components/smoke-heatmap.tsx
git commit -m "feat(fe): add slip history and heatmap components"
```

---

### Task 16: Update progress page to use new shape + render history + heatmap

**Files:**
- Modify: `my-quit-fe/app/(dashboard)/progress/page.tsx`

- [ ] **Step 1: Rewrite the progress page**

Replace `my-quit-fe/app/(dashboard)/progress/page.tsx` with:

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/stat-card';
import { formatRM } from '@/lib/utils/format-currency';
import { SmokeHistoryList } from '@/components/smoke-history-list';
import { SmokeHeatmap } from '@/components/smoke-heatmap';
import { SmokeLogHistoryItem, SmokeHeatmapDay } from '@/types';

async function getProgressData() {
  const cookieStore = await cookies();
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const headers = { Cookie: cookieStore.toString() };

  const today = new Date();
  const eightWeeksAgo = new Date(today);
  eightWeeksAgo.setDate(today.getDate() - 55);
  const fromIso = eightWeeksAgo.toISOString().slice(0, 10);
  const toIso = today.toISOString().slice(0, 10);

  const [progressRes, statsRes, historyRes, heatmapRes] = await Promise.all([
    fetch(`${API}/progress`, { headers, cache: 'no-store' }),
    fetch(`${API}/gamification/stats`, { headers, cache: 'no-store' }),
    fetch(`${API}/smoke-log/history?days=14`, { headers, cache: 'no-store' }),
    fetch(`${API}/smoke-log/heatmap?from=${fromIso}&to=${toIso}`, { headers, cache: 'no-store' }),
  ]);

  if (!progressRes.ok) redirect('/dashboard');

  const [progress, stats, history, heatmap] = await Promise.all([
    progressRes.json().then((r: { data: unknown }) => r.data),
    statsRes.json().then((r: { data: unknown }) => r.data),
    historyRes.json().then((r: { data: unknown }) => r.data),
    heatmapRes.json().then((r: { data: unknown }) => r.data),
  ]);
  return { progress, stats, history, heatmap };
}

const MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365];

export default async function ProgressPage() {
  const { progress, stats, history, heatmap } = await getProgressData() as {
    progress: {
      currentStreak: number;
      totalSmokeFreeDays: number;
      lastSlipAt: string | null;
      moneySavedActual: number | null;
      dailyCost: number | null;
      cigarettesPd: number | null;
      quitDate: string;
    };
    stats: { totalPoints: number; cravingsManaged: number };
    history: { items: SmokeLogHistoryItem[] };
    heatmap: { days: SmokeHeatmapDay[] };
  };

  const streak = progress.currentStreak;
  const nextMilestone = MILESTONES.find((m) => m > streak) ?? 365;
  const prevMilestone = MILESTONES.filter((m) => m <= streak).at(-1) ?? 0;
  const milestoneProgress = nextMilestone === prevMilestone
    ? 100
    : Math.round(((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100);

  const dailyCost = progress.dailyCost ?? 0;
  const monthlySavings = dailyCost * 30;
  const annualSavings = dailyCost * 365;
  const cigarettesAvoided = progress.totalSmokeFreeDays * (progress.cigarettesPd ?? 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">Progress</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Current Streak" value={String(streak)} subtitle="days" />
        <StatCard label="Total Smoke-Free" value={String(progress.totalSmokeFreeDays)} subtitle="days" />
        <StatCard
          label="Money Saved"
          value={progress.moneySavedActual !== null ? formatRM(progress.moneySavedActual) : '—'}
        />
        <StatCard label="Cigarettes Avoided" value={String(cigarettesAvoided)} />
        <StatCard label="Cravings Managed" value={String(stats.cravingsManaged ?? 0)} />
        <StatCard label="Total Points" value={String(stats.totalPoints)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Next Milestone</CardTitle></CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{prevMilestone} days</span>
            <span>{nextMilestone} days</span>
          </div>
          <Progress value={milestoneProgress} className="h-3" />
          <p className="text-sm text-gray-600 mt-2 text-center">
            {Math.max(0, nextMilestone - streak)} days to go!
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Savings Projection</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">This month (30 days)</span><span className="font-semibold text-green-600">{formatRM(monthlySavings)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">This year (365 days)</span><span className="font-semibold text-green-600">{formatRM(annualSavings)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Daily saving</span><span className="font-semibold text-green-600">{formatRM(dailyCost)}</span></div>
        </CardContent>
      </Card>

      <SmokeHistoryList items={history.items} />
      <SmokeHeatmap days={heatmap.days} quitDate={progress.quitDate} />
    </div>
  );
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Build the FE**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/progress/page.tsx
git commit -m "feat(fe): wire history list and heatmap into progress page"
```

---

### Task 17: End-to-end manual verification in browser

This task is non-automated. It runs the actual app and verifies the user-visible flow.

- [ ] **Step 1: Start backend**

```bash
cd /Users/i.rosly/my-quit/my-quit-be
npm run start:dev
```

Wait for `Nest application successfully started` on `:3001`.

- [ ] **Step 2: Start frontend (separate terminal)**

```bash
cd /Users/i.rosly/my-quit/my-quit-fe
npm run dev
```

Wait for `Ready` message. Open the URL it prints.

- [ ] **Step 3: Verify each item below**

Sign in (or register a new user, run through onboarding, set a quit date in the past so streak > 0).

Confirm each:

1. Dashboard shows `Current Streak`, `Total Smoke-Free Days`, `Money Saved`, `Total Points` cards.
2. "Last slip" line under the grid says `No slips logged yet.` initially.
3. Bottom-right FAB is visible and does not overlap bottom-nav.
4. Tap FAB → modal opens. Title is `Log a slip?`.
5. Tap Cancel → modal closes; nothing changes.
6. Tap FAB → modal opens → Tap `Yes, I smoked` → modal closes; toast appears; stats refresh: `Current Streak` = 0, `Total Smoke-Free Days` decreased by 1, `Total Points` decreased by 2, "Last slip" shows `today`.
7. Navigate to `Badges` — any prior streak badges (`streak_1`, etc.) are gone (assuming user had any).
8. Navigate to `Progress` — `Recent Slips` shows the slip just logged. `Smoke-Free Calendar` shows red cell for today, green for prior days, gray for pre-quit days.
9. Tap FAB on each of `/dashboard`, `/progress`, `/badges`, `/craving-toolkit`, `/profile` — FAB persists on all.

If any of these fail, surface the failure and stop.

- [ ] **Step 4: Stop dev servers and commit any nit fixes**

If a small UI or copy fix is needed mid-verification (e.g. the FAB collides with safe-area on a specific device), make and commit it now with a focused message:

```bash
git add <files>
git commit -m "fix(fe): <specific issue>"
```

Otherwise, no commit.

---

## Self-Review

Re-read the spec section-by-section against this plan:

- §3 Data model → Task 1 ✓
- §4 API endpoints → Tasks 5–8 (services) + 8 (controller) ✓
- §4 `/progress` modifications → Task 9 ✓
- §5 Compute logic → Task 9 (progress) + Task 5 (snapshot returned by `create`) ✓
- §6 Gamification penalty + revoke → Task 2 ✓; streak badge fix → Task 3 ✓
- §7 FE FAB + dialog → Task 13 ✓; mount → Task 14 ✓; dashboard → Task 14 ✓; progress page → Task 16 ✓; history list → Task 15 ✓; heatmap → Task 15 ✓
- §8 Architecture → covered by file structure section above ✓
- §9 Testing → backend covered by Tasks 2,3,5,6,7,9,10; frontend by Task 17 manual verification (no FE test framework in repo) ✓
- §10 Open risks → flagged in spec, no plan changes needed ✓
- §11 Migration & rollout → Task 1 (migration), shape change ships in Task 9 + 14 + 16 in coordinated commits ✓

No gaps. No placeholders. Type names consistent (`SmokeLog`, `SmokeLogCreateResponse`, `SmokeLogHistoryItem`, `SmokeHeatmapDay`, `Progress`).

---

## Done When

- All 17 tasks completed and committed.
- Backend: `npm test` and `npm run test:e2e` both pass.
- Frontend: `npm run build` succeeds and manual verification (Task 17) completes.
- Both repos have a clean `git status` other than uncommitted dev artifacts that already existed before the work began.
