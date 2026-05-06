import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmokeLogHistoryItem } from '@/types';

function formatItem(iso: string): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString('en-MY', { weekday: 'short' });
  const date = d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
  return `${weekday}, ${date} · ${time}`;
}

export function SmokeHistoryList({ items }: { items: SmokeLogHistoryItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Slips</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No slips. Keep going.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between border-b last:border-b-0 pb-2 last:pb-0">
                <span className="text-gray-600">{formatItem(item.loggedAt)}</span>
                <span className="text-gray-500">{item.count} cig{item.count === 1 ? '' : 's'}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
