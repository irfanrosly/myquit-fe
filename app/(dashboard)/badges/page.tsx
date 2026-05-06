import { cookies } from 'next/headers';
import { BadgeCard } from '@/components/badge-card';
import { Badge } from '@/types';

async function getBadges() {
  const cookieStore = await cookies();
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${API}/gamification/badges`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  });
  const json = await res.json();
  return json.data as { earned: Badge[]; locked: Badge[] };
}

export default async function BadgesPage() {
  const { earned, locked } = await getBadges();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Badges</h1>

      <div>
        <h2 className="font-semibold text-gray-700 mb-3">Earned ({earned.length})</h2>
        {earned.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No badges yet — keep going! 💪</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {earned.map((b) => <BadgeCard key={b.key} badge={b} earned />)}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold text-gray-700 mb-3">Locked ({locked.length})</h2>
        <div className="grid grid-cols-3 gap-3">
          {locked.map((b) => <BadgeCard key={b.key} badge={b} earned={false} />)}
        </div>
      </div>
    </div>
  );
}
