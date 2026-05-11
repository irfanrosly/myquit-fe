'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
} from 'recharts';

interface AdminChartsProps {
  registrationByWeek: { week: string; count: number }[];
  activityBreakdown: { breathing: number; distraction: number };
  moodTrend: { date: string; avgMood: number; avgCraving: number }[];
  badgeDistribution: { key: string; count: number }[];
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="text-xs text-gray-400 mb-4">{subtitle}</p>
      {children}
    </div>
  );
}

function formatMoodDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AdminCharts({
  registrationByWeek,
  activityBreakdown,
  moodTrend,
  badgeDistribution,
}: AdminChartsProps) {
  const activityData = [
    { name: 'Breathing', value: activityBreakdown.breathing },
    { name: 'Distraction', value: activityBreakdown.distraction },
  ];
  const ACTIVITY_COLORS = ['#0d9488', '#6366f1'];

  const moodData = moodTrend.map((d) => ({
    ...d,
    label: formatMoodDate(d.date),
  }));

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Registration area chart */}
      <ChartCard
        title="New Registrations"
        subtitle="Weekly sign-up trend"
      >
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={registrationByWeek} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ccfbf1" stopOpacity={1} />
                <stop offset="95%" stopColor="#ccfbf1" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              cursor={{ stroke: '#0d9488', strokeWidth: 1, strokeDasharray: '4 2' }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#0d9488"
              strokeWidth={2}
              fill="url(#regGradient)"
              fillOpacity={1}
              name="Users"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Activity donut */}
      <ChartCard
        title="Activity Breakdown"
        subtitle="Breathing vs distraction usage"
      >
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={activityData}
              cx="50%"
              cy="45%"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
            >
              {activityData.map((_, i) => (
                <Cell key={i} fill={ACTIVITY_COLORS[i % ACTIVITY_COLORS.length]} />
              ))}
            </Pie>
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: '#6b7280' }}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Mood / Craving line chart */}
      <ChartCard
        title="Mood & Craving Trends"
        subtitle="7-day rolling average"
      >
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={moodData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              cursor={{ stroke: '#d1d5db', strokeWidth: 1 }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#6b7280' }} />
            <Line
              type="monotone"
              dataKey="avgMood"
              stroke="#059669"
              strokeWidth={2}
              dot={false}
              name="Mood"
            />
            <Line
              type="monotone"
              dataKey="avgCraving"
              stroke="#dc2626"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              name="Craving"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Badge distribution bar */}
      <ChartCard
        title="Badge Distribution"
        subtitle="Count per badge type"
      >
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={badgeDistribution} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="key"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => (v.length > 8 ? v.slice(0, 7) + '…' : v)}
            />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              cursor={{ fill: '#f0fdfa' }}
            />
            <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} name="Badges" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
