import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { KpiCard } from '@/components/admin/kpi-card';
import { AdminCharts } from '@/components/admin/admin-charts';
import { UsersTable } from '@/components/admin/users-table';

interface AdminStats {
  totalUsers: number;
  activeQuitPlans: number;
  avgDaysSmokeFreee: number;
  totalCravingsManaged: number;
  totalBadges: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  onboardingDone: boolean;
  createdAt: string;
  quitDate: string | null;
  avgMood: number | null;
  avgCraving: number | null;
  totalPoints: number;
  cravingsManaged: number;
  badgeCount: number;
}

interface ChartData {
  registrationByWeek: { week: string; count: number }[];
  activityBreakdown: { breathing: number; distraction: number };
  moodTrend: { date: string; avgMood: number; avgCraving: number }[];
  badgeDistribution: { key: string; count: number }[];
}

async function fetchAdminData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) redirect('/login');

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const headers = { Cookie: cookieStore.toString() };

  const [statsRes, usersRes, chartsRes] = await Promise.all([
    fetch(`${API}/admin/stats`,      { headers, cache: 'no-store' }),
    fetch(`${API}/admin/users`,      { headers, cache: 'no-store' }),
    fetch(`${API}/admin/chart-data`, { headers, cache: 'no-store' }),
  ]);

  if (!statsRes.ok || !usersRes.ok || !chartsRes.ok) redirect('/login');

  const [{ data: stats }, { data: users }, { data: charts }] = await Promise.all([
    statsRes.json()  as Promise<{ data: AdminStats }>,
    usersRes.json()  as Promise<{ data: AdminUser[] }>,
    chartsRes.json() as Promise<{ data: ChartData }>,
  ]);

  return { stats, users, charts };
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function AdminPage() {
  const { stats, users, charts } = await fetchAdminData();

  return (
    <main className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-sm text-gray-400 mt-0.5">{todayLabel()}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard
          label="Total Users"
          value={stats.totalUsers}
          trend="↑ 8 this month"
          trendUp={true}
          accentColor="teal"
          icon="👤"
        />
        <KpiCard
          label="Active Quit Plans"
          value={stats.activeQuitPlans}
          trend="↑ 3 this week"
          trendUp={true}
          accentColor="green"
          icon="🎯"
        />
        <KpiCard
          label="Avg Days Smoke-Free"
          value={stats.avgDaysSmokeFreee}
          trend="across all users"
          accentColor="indigo"
          icon="📅"
        />
        <KpiCard
          label="Cravings Managed"
          value={stats.totalCravingsManaged}
          trend="↑ 12 today"
          trendUp={true}
          accentColor="orange"
          icon="💪"
        />
        <KpiCard
          label="Total Badges"
          value={stats.totalBadges}
          trend="awarded to date"
          accentColor="red"
          icon="🏅"
        />
      </div>

      {/* Charts */}
      <AdminCharts
        registrationByWeek={charts.registrationByWeek}
        activityBreakdown={charts.activityBreakdown}
        moodTrend={charts.moodTrend}
        badgeDistribution={charts.badgeDistribution}
      />

      {/* Users table */}
      <UsersTable users={users} />
    </main>
  );
}
