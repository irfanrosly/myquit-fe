const ACCENT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  teal:   { border: '#0d9488', bg: '#f0fdfa', text: '#0d9488' },
  green:  { border: '#059669', bg: '#f0fdf4', text: '#059669' },
  indigo: { border: '#6366f1', bg: '#eef2ff', text: '#6366f1' },
  orange: { border: '#d97706', bg: '#fffbeb', text: '#d97706' },
  red:    { border: '#dc2626', bg: '#fef2f2', text: '#dc2626' },
};

interface KpiCardProps {
  label: string;
  value: string | number;
  trend: string;
  trendUp?: boolean;
  accentColor: 'teal' | 'green' | 'indigo' | 'orange' | 'red';
  icon: string;
}

export function KpiCard({ label, value, trend, trendUp, accentColor, icon }: KpiCardProps) {
  const colors = ACCENT_COLORS[accentColor];

  const trendColor =
    trendUp === true
      ? 'text-green-600'
      : trendUp === false
      ? 'text-red-500'
      : 'text-gray-400';

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-3"
      style={{ borderTop: `3px solid ${colors.border}` }}
    >
      <div className="flex items-start justify-between">
        <span
          className="text-xl w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: colors.bg }}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-3xl font-mono font-bold text-gray-800 mt-0.5">{value}</p>
      </div>

      <p className={`text-xs font-medium ${trendColor}`}>{trend}</p>
    </div>
  );
}
