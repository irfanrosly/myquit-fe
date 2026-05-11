import { Badge } from '@/types';
import { cn } from '@/lib/utils';

interface BadgeCardProps {
  badge: Badge;
  earned: boolean;
}

const BADGE_EMOJI: Record<string, string> = {
  streak_1: '🌱', streak_3: '🌿', streak_7: '🌳', streak_14: '🌲',
  streak_30: '🏆', streak_60: '💪', streak_90: '🔥', streak_180: '⭐', streak_365: '👑',
  savings_100: '💰', savings_500: '💵', savings_1000: '💎',
  cravings_5: '🧘', cravings_10: '🎯', cravings_20: '🦾',
  logging_7: '📔', logging_30: '📚',
};

export function BadgeCard({ badge, earned }: BadgeCardProps) {
  return (
    <div className={cn(
      'flex flex-col items-center p-4 rounded-xl text-center transition-all duration-200',
      earned
        ? 'glass-card-success ring-1 ring-brand-green/30'
        : 'glass-card opacity-40 grayscale saturate-50',
    )}>
      <span className="text-4xl mb-2">{BADGE_EMOJI[badge.key] ?? '🏅'}</span>
      <p className="text-xs font-medium text-foreground leading-tight">{badge.label}</p>
      {earned && badge.earnedAt && (
        <p className="text-xs text-brand-green mt-1">{new Date(badge.earnedAt).toLocaleDateString()}</p>
      )}
    </div>
  );
}
