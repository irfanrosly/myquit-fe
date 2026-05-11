'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

const AVATAR_COLORS = [
  '#0d9488', '#059669', '#6366f1', '#d97706', '#0284c7',
  '#9333ea', '#db2777', '#16a34a', '#ea580c', '#0891b2',
];

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type StatusType = 'Admin' | 'Active' | 'Onboarding' | 'New';

function getStatus(user: AdminUser): StatusType {
  if (user.role === 'ADMIN') return 'Admin';
  if (!user.onboardingDone) return 'New';
  if (user.quitDate) return 'Active';
  return 'Onboarding';
}

const STATUS_STYLES: Record<StatusType, string> = {
  Active:      'bg-green-100 text-green-700',
  Onboarding:  'bg-yellow-100 text-yellow-700',
  New:         'bg-teal-100 text-teal-700',
  Admin:       'bg-purple-100 text-purple-700',
};

function daysFree(quitDate: string | null): number | null {
  if (!quitDate) return null;
  const diff = Date.now() - new Date(quitDate).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

function DaysBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-gray-300 font-mono text-sm">—</span>;
  const cls =
    days >= 30 ? 'text-green-600' : days >= 7 ? 'text-yellow-600' : 'text-gray-400';
  return <span className={`font-mono text-sm font-semibold ${cls}`}>{days}d</span>;
}

function MoodBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-300 text-sm">—</span>;
  const pct = Math.round((value / 10) * 100);
  const color = value >= 7 ? '#059669' : value >= 5 ? '#d97706' : '#dc2626';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-xs text-gray-500">{value.toFixed(1)}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

export function UsersTable({ users }: { users: AdminUser[] }) {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">All Users</p>
          <p className="text-xs text-gray-400">{filtered.length} of {users.length} users</p>
        </div>
        <input
          type="search"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400 w-56"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 sticky top-0">
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">Quit Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">Days Free</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">Mood Avg</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">Cravings</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">Points</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">Badges</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-gray-400 text-sm">
                  No users found
                </td>
              </tr>
            )}
            {filtered.map((user) => {
              const status = getStatus(user);
              const days = daysFree(user.quitDate);
              const initials = getInitials(user.name);
              const avatarBg = getAvatarColor(user.name);
              return (
                <tr
                  key={user.id}
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: avatarBg }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate max-w-[140px]">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                    {user.quitDate ? formatDate(user.quitDate) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <DaysBadge days={days} />
                  </td>
                  <td className="px-5 py-3">
                    <MoodBar value={user.avgMood} />
                  </td>
                  <td className="px-5 py-3 font-mono text-gray-700">{user.cravingsManaged}</td>
                  <td className="px-5 py-3 font-mono text-gray-700">{user.totalPoints.toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-gray-700">{user.badgeCount}</td>
                  <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
