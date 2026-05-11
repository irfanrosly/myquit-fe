import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const GLASS: Record<string, string> = {
  success: 'glass-card-success',
  energy: 'glass-card-energy',
  neutral: 'glass-card',
};

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  variant?: 'success' | 'energy' | 'neutral';
  className?: string;
}

export function StatCard({ label, value, subtitle, variant = 'neutral', className }: StatCardProps) {
  return (
    <Card className={cn(GLASS[variant], className)}>
      <CardContent className="pt-6 pb-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-4xl font-serif-display font-normal text-brand-green mt-1">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
