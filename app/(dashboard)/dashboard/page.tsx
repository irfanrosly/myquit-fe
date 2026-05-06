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
