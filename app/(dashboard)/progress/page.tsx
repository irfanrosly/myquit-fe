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
      <div className="relative rounded-2xl px-5 py-5 overflow-hidden glass-card-success">
        <div className="absolute inset-0 [background:var(--gradient-hero)] pointer-events-none" />
        <div className="relative z-10">
          <p className="text-muted-foreground text-sm font-medium">Current Streak</p>
          <span className="font-serif-display text-5xl font-normal text-brand-green leading-none glow-green">{streak}</span>
          <p className="text-muted-foreground text-sm mt-1">days smoke-free</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Current Streak" value={String(streak)} subtitle="days" variant="success" />
        <StatCard label="Total Smoke-Free" value={String(progress.totalSmokeFreeDays)} subtitle="days" variant="success" />
        <StatCard
          label="Money Saved"
          value={progress.moneySavedActual !== null ? formatRM(progress.moneySavedActual) : '—'}
          variant="energy"
        />
        <StatCard label="Cigarettes Avoided" value={String(cigarettesAvoided)} variant="energy" />
        <StatCard label="Cravings Managed" value={String(stats.cravingsManaged ?? 0)} variant="neutral" />
        <StatCard label="Total Points" value={String(stats.totalPoints)} variant="energy" />
      </div>

      <Card className="glass-card-success">
        <CardHeader><CardTitle className="text-base">Next Milestone</CardTitle></CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{prevMilestone} days</span>
            <span>{nextMilestone} days</span>
          </div>
          <Progress value={milestoneProgress} className="h-3" />
          <p className="text-sm text-brand-green font-semibold mt-2 text-center">
            {Math.max(0, nextMilestone - streak)} days to go!
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card-energy">
        <CardHeader><CardTitle className="text-base">Savings Projection</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">This month (30 days)</span><span className="font-semibold text-brand-amber">{formatRM(monthlySavings)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">This year (365 days)</span><span className="font-semibold text-brand-amber">{formatRM(annualSavings)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Daily saving</span><span className="font-semibold text-brand-amber">{formatRM(dailyCost)}</span></div>
        </CardContent>
      </Card>

      <SmokeHistoryList items={history.items} />
      <SmokeHeatmap days={heatmap.days} quitDate={progress.quitDate} />
    </div>
  );
}
