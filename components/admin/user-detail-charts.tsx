'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface Props {
  smokeLogs: { date: string; count: number }[];
  moodLogs: { date: string; mood: number; craving: number }[];
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

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[190px] flex items-center justify-center text-sm text-gray-300">
      {message}
    </div>
  );
}

export function UserDetailCharts({ smokeLogs, moodLogs }: Props) {
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const smokeData = smokeLogs.map((d) => ({ ...d, label: fmtDate(d.date) }));
  const moodData = moodLogs.map((d) => ({ ...d, label: fmtDate(d.date) }));

  return (
    <div className="grid grid-cols-2 gap-5">
      <ChartCard title="Cigarettes" subtitle="Last 30 days">
        {smokeData.length === 0 ? (
          <EmptyChart message="No smoke logs in the last 30 days" />
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={smokeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                cursor={{ fill: '#fef3c7' }}
              />
              <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} name="Cigarettes" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Mood & Craving" subtitle="Last 14 days">
        {moodData.length === 0 ? (
          <EmptyChart message="No mood logs in the last 14 days" />
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={moodData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: '#6b7280' }}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
                name="Mood"
              />
              <Line
                type="monotone"
                dataKey="craving"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                name="Craving"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
