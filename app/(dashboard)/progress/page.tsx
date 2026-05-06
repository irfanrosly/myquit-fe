import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/stat-card';
import { formatRM } from '@/lib/utils/format-currency';

async function getProgressData() {
  const cookieStore = await cookies();
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const headers = { Cookie: cookieStore.toString() };

  const [progressRes, statsRes] = await Promise.all([
    fetch(`${API}/progress`, { headers, cache: 'no-store' }),
    fetch(`${API}/gamification/stats`, { headers, cache: 'no-store' }),
  ]);

  if (!progressRes.ok) redirect('/dashboard');
  const [progress, stats] = await Promise.all([
    progressRes.json().then((r: { data: unknown }) => r.data),
    statsRes.json().then((r: { data: unknown }) => r.data),
  ]);
  return { progress, stats };
}

const MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365];

export default async function ProgressPage() {
  const { progress, stats } = await getProgressData() as {
    progress: { daysSmokeFreee: number; moneySaved: number; dailyCost: number; cigarettesPd: number };
    stats: { totalPoints: number };
  };

  const nextMilestone = MILESTONES.find((m) => m > progress.daysSmokeFreee) ?? 365;
  const prevMilestone = MILESTONES.filter((m) => m <= progress.daysSmokeFreee).at(-1) ?? 0;
  const milestoneProgress = nextMilestone === prevMilestone
    ? 100
    : Math.round(((progress.daysSmokeFreee - prevMilestone) / (nextMilestone - prevMilestone)) * 100);

  const monthlySavings = progress.dailyCost * 30;
  const annualSavings = progress.dailyCost * 365;
  const cigarettesAvoided = progress.daysSmokeFreee * (progress.cigarettesPd ?? 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">Progress</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Days Smoke-Free" value={String(progress.daysSmokeFreee)} />
        <StatCard label="Money Saved" value={formatRM(progress.moneySaved)} />
        <StatCard label="Cigarettes Avoided" value={String(cigarettesAvoided)} />
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
            {nextMilestone - progress.daysSmokeFreee} days to go!
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Savings Projection</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">This month (30 days)</span><span className="font-semibold text-green-600">{formatRM(monthlySavings)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">This year (365 days)</span><span className="font-semibold text-green-600">{formatRM(annualSavings)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Daily saving</span><span className="font-semibold text-green-600">{formatRM(progress.dailyCost)}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
