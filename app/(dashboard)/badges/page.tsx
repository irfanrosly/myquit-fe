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
      <div className="relative rounded-2xl px-5 py-5 overflow-hidden glass-card-success">
        <div className="absolute inset-0 [background:var(--gradient-hero)] pointer-events-none" />
        <div className="relative z-10">
          <p className="font-serif-display text-3xl font-normal text-brand-green">Badges</p>
          <p className="text-muted-foreground text-sm mt-1">{earned.length} earned · {locked.length} to unlock</p>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-foreground mb-3">Earned ({earned.length})</h2>
        {earned.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No badges yet — keep going! 💪</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {earned.map((b) => <BadgeCard key={b.key} badge={b} earned />)}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold text-foreground mb-3">Locked ({locked.length})</h2>
        <div className="grid grid-cols-3 gap-3">
          {locked.map((b) => <BadgeCard key={b.key} badge={b} earned={false} />)}
        </div>
      </div>
    </div>
  );
}
