import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UsersTable } from '@/components/admin/users-table';

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

async function fetchUsers(): Promise<AdminUser[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) redirect('/login');

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${API}/admin/users`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  });

  if (!res.ok) redirect('/login');

  const { data } = (await res.json()) as { data: AdminUser[] };
  return data;
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function AdminUsersPage() {
  const users = await fetchUsers();

  return (
    <main className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">All Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">{todayLabel()}</p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200">
          {users.length} registered
        </span>
      </div>

      <UsersTable users={users} />
    </main>
  );
}
