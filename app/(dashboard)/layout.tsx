import { BottomNav } from '@/components/bottom-nav';
import { SmokeLogFab } from '@/components/smoke-log-fab';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        {children}
      </div>
      <SmokeLogFab />
      <BottomNav />
    </div>
  );
}
