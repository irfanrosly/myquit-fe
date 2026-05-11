import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { UserDetailCharts } from '@/components/admin/user-detail-charts';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  onboardingDone: boolean;
  createdAt: string;
  quitDate: string | null;
  currentStreak: number;
  totalSmokeFreeDays: number;
  slipDays: number;
  totalPoints: number;
  cravingsManaged: number;
  badgeCount: number;
  smokeLogs: { date: string; count: number }[];
  moodLogs: { date: string; mood: number; craving: number }[];
  badges: { badgeKey: string; earnedAt: string }[];
}

async function fetchUserDetail(id: string): Promise<UserDetail | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) redirect('/login');

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${API}/admin/users/${id}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  });

  if (res.status === 404) return null;
  if (!res.ok) redirect('/login');

  const { data } = (await res.json()) as { data: UserDetail };
  return data;
}

const AVATAR_COLORS = [
  '#0d9488', '#059669', '#6366f1', '#d97706', '#0284c7',
  '#9333ea', '#db2777', '#16a34a', '#ea580c', '#0891b2',
];

function getInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type StatusType = 'Admin' | 'Active' | 'Onboarding' | 'New';

function getStatus(user: UserDetail): StatusType {
  if (user.role === 'ADMIN') return 'Admin';
  if (!user.onboardingDone) return 'New';
  if (user.quitDate) return 'Active';
  return 'Onboarding';
}

const STATUS_STYLES: Record<StatusType, string> = {
  Active:     'bg-green-100 text-green-700',
  Onboarding: 'bg-yellow-100 text-yellow-700',
  New:        'bg-teal-100 text-teal-700',
  Admin:      'bg-purple-100 text-purple-700',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatBadgeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent: 'teal' | 'amber' | 'purple' | 'indigo';
}

const ACCENT: Record<StatCardProps['accent'], { border: string; text: string; bg: string }> = {
  teal:   { border: 'border-teal-200',   text: 'text-teal-700',   bg: 'bg-teal-50'   },
  amber:  { border: 'border-amber-200',  text: 'text-amber-700',  bg: 'bg-amber-50'  },
  purple: { border: 'border-purple-200', text: 'text-purple-700', bg: 'bg-purple-50' },
  indigo: { border: 'border-indigo-200', text: 'text-indigo-700', bg: 'bg-indigo-50' },
};

function StatCard({ label, value, sub, accent }: StatCardProps) {
  const a = ACCENT[accent];
  return (
    <div className={`rounded-xl border ${a.border} ${a.bg} p-4`}>
      <p className={`text-2xl font-bold font-mono ${a.text}`}>{value}</p>
      <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await fetchUserDetail(id);
  if (!user) notFound();

  const status = getStatus(user);
  const initials = getInitials(user.name);
  const avatarBg = getAvatarColor(user.name);

  return (
    <main className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← All Users
      </Link>

      {/* User header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0"
          style={{ backgroundColor: avatarBg }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-gray-800">{user.name}</h1>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
              {status}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            {user.email} · Joined {formatDate(user.createdAt)}
            {user.quitDate && ` · Quit ${formatDate(user.quitDate)}`}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Current Streak"
          value={`${user.currentStreak}d`}
          sub="smoke-free days in a row"
          accent="teal"
        />
        <StatCard
          label="Slip Days"
          value={user.slipDays}
          sub="days smoked since quit"
          accent="amber"
        />
        <StatCard
          label="Total Points"
          value={user.totalPoints.toLocaleString()}
          sub={`${user.cravingsManaged} cravings managed`}
          accent="purple"
        />
        <StatCard
          label="Badges Earned"
          value={user.badgeCount}
          sub={`${user.totalSmokeFreeDays} smoke-free days total`}
          accent="indigo"
        />
      </div>

      {/* Charts */}
      <UserDetailCharts smokeLogs={user.smokeLogs} moodLogs={user.moodLogs} />

      {/* Badges */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-gray-800 mb-1">Badges</p>
        <p className="text-xs text-gray-400 mb-4">All time</p>

        {user.badges.length === 0 ? (
          <p className="text-sm text-gray-300 py-6 text-center">No badges yet</p>
        ) : (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {user.badges.map((b) => (
              <div
                key={b.badgeKey}
                className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-center"
              >
                <p className="text-xs font-semibold text-gray-700 truncate">{formatBadgeKey(b.badgeKey)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(b.earnedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
