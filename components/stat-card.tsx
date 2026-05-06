import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  className?: string;
}

export function StatCard({ label, value, subtitle, className }: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-5 pb-4">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-green-600 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
