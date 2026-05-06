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
