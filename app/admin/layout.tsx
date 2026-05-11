import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminNavItem } from './admin-nav-item';

interface AdminUser {
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

async function getAdminUser(): Promise<AdminUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) redirect('/login');

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${API}/users/me`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  });

  if (!res.ok) redirect('/login');

  const { data } = (await res.json()) as { data: AdminUser };
  if (data.role !== 'ADMIN') redirect('/dashboard');

  return data;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

const NAV_ITEMS = [
  { href: '/admin',       label: 'Overview', icon: '▤', exact: true },
  { href: '/admin/users', label: 'Users',    icon: '👥', exact: false },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  const initials = getInitials(user.name);

  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: '240px 1fr' }}>
      {/* Sidebar */}
      <aside className="bg-white border-r border-gray-200 sticky top-0 h-screen flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-lg font-bold text-gray-800">
            MYQuit<span className="text-teal-700">Mate</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Admin Console</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon, exact }) => (
            <AdminNavItem key={href} href={href} label={label} icon={icon} exact={exact} />
          ))}
        </nav>

        {/* Admin info */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
              <p className="text-xs text-teal-600 font-medium">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        {children}
      </div>
    </div>
  );
}
