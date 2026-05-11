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

  const lastSlipText = relativeDays(progress?.lastSlipAt ?? null);

  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl px-6 py-6 overflow-hidden glass-card">
        <div className="absolute inset-0 [background:var(--gradient-hero)] pointer-events-none" />
        <div className="relative z-10">
          <p className="text-muted-foreground text-sm">Welcome back,</p>
          <h1 className="font-sans text-xl font-semibold text-foreground">{user?.name}</h1>
          <div className="mt-4 flex items-end gap-2">
            <span className="font-serif-display text-7xl text-brand-green leading-none glow-green">
              {progress?.currentStreak ?? 0}
            </span>
            <div className="mb-2">
              <p className="text-foreground/80 text-base font-medium">day streak</p>
              <p className="text-muted-foreground text-xs">{lastSlipText}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Smoke-Free Days"
          value={String(progress?.totalSmokeFreeDays ?? 0)}
          subtitle="days"
          variant="success"
        />
        <StatCard
          label="Money Saved"
          value={progress?.moneySavedActual !== null && progress?.moneySavedActual !== undefined
            ? formatRM(progress.moneySavedActual)
            : '—'}
          subtitle="actual"
          variant="energy"
        />
        <StatCard
          label="Total Points"
          value={String(stats?.totalPoints ?? 0)}
          subtitle="keep earning!"
          variant="energy"
          className="col-span-2"
        />
      </div>

      <div>
        <h2 className="font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="flex flex-col gap-3">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} className="block">
              <Card className="glass-card-energy hover:shadow-lg hover:shadow-brand-amber/20 transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <span className="font-medium text-foreground">{a.label}</span>
                  <span className="text-xs text-brand-amber font-semibold">{a.desc}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
