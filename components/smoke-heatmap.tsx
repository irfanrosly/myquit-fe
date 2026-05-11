import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SmokeHeatmapDay } from '@/types';

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

type CellState = 'pre' | 'clean' | 'slip' | 'future';

interface Cell {
  key: string;
  date: Date;
  state: CellState;
  count: number;
  isToday: boolean;
}

function buildCells(
  slipMap: Map<string, number>,
  today: Date,
  quit: Date,
  weeks: number,
): Cell[] {
  const todayDow = today.getUTCDay();
  const daysBack = (weeks - 1) * 7 + todayDow;
  const gridStart = new Date(today);
  gridStart.setUTCDate(today.getUTCDate() - daysBack);

  const todayKey = dateKey(today);
  const cells: Cell[] = [];
  const quitInPast = quit <= today;

  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + i);
    const key = dateKey(d);
    const isFuture = d > today;
    const count = slipMap.get(key) ?? 0;

    let state: CellState = 'clean';
    if (isFuture) state = 'future';
    else if (quitInPast && d < quit) state = 'pre';
    else if (count > 0) state = 'slip';

    cells.push({ key, date: d, state, count, isToday: key === todayKey });
  }

  return cells;
}

function computeStats(cells: Cell[]) {
  const active = cells.filter((c) => c.state !== 'future');
  const cleanDays = active.filter((c) => c.state === 'clean').length;
  const slipDays = active.filter((c) => c.state === 'slip').length;

  let streak = 0;
  let longestStreak = 0;
  for (const c of active) {
    if (c.state === 'clean') {
      streak++;
      if (streak > longestStreak) longestStreak = streak;
    } else {
      streak = 0;
    }
  }

  return { cleanDays, slipDays, longestStreak };
}

const STATE_BG: Record<CellState, string> = {
  pre: 'bg-pre-quit-day',
  clean: 'bg-clean-day',
  slip: 'bg-slip-day',
  future: 'bg-pre-quit-day opacity-25',
};

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

  const quit = new Date(quitDate);
  quit.setUTCHours(0, 0, 0, 0);

  const cells = buildCells(slipMap, today, quit, weeks);
  const { cleanDays, slipDays, longestStreak } = computeStats(cells);
  const hasFuture = cells.some((c) => c.state === 'future');

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-base">Smoke-Free Calendar</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stats bar */}
        <div className="flex gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-3 py-1 text-xs">
            <span className="text-brand-green font-semibold">{cleanDays}</span>
            <span className="text-muted-foreground">clean</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-amber/10 px-3 py-1 text-xs">
            <span className="text-brand-amber font-semibold">{slipDays}</span>
            <span className="text-muted-foreground">slips</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-3 py-1 text-xs">
            <span className="text-brand-green font-semibold">{longestStreak}d</span>
            <span className="text-muted-foreground">best streak</span>
          </span>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1">
          {DOW_LABELS.map((label) => (
            <div key={label} className="text-center text-[10px] text-muted-foreground font-medium pb-0.5">
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c) => (
            <div
              key={c.key}
              title={
                c.state === 'future'
                  ? undefined
                  : `${c.key}${c.state === 'slip' ? ` · ${c.count} cig${c.count !== 1 ? 's' : ''}` : ''}`
              }
              className={cn(
                'aspect-square rounded',
                STATE_BG[c.state],
                c.isToday && 'ring-2 ring-white/50 ring-offset-[2px] ring-offset-background',
              )}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span><span className="inline-block w-3 h-3 rounded bg-clean-day align-middle mr-1" />clean</span>
          <span><span className="inline-block w-3 h-3 rounded bg-slip-day align-middle mr-1" />slip</span>
          <span><span className="inline-block w-3 h-3 rounded bg-pre-quit-day align-middle mr-1" />pre-quit</span>
          {hasFuture && (
            <span><span className="inline-block w-3 h-3 rounded bg-pre-quit-day opacity-25 align-middle mr-1" />future</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
