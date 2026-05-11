'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Award, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/badges', label: 'Badges', icon: Award },
  { href: '/craving-toolkit', label: 'Craving', icon: Heart },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'oklch(1 0 0 / 0.06)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid oklch(1 0 0 / 0.12)' }}>
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 transition-colors"
            >
              <div className={cn(
                'flex items-center justify-center rounded-full w-10 h-7',
                active ? 'bg-brand-green/20' : '',
              )}>
                <Icon
                  className={cn('w-5 h-5', active ? 'text-brand-green' : 'text-muted-foreground')}
                  strokeWidth={active ? 2.5 : 1.5}
                />
              </div>
              <span className={cn('text-[10px] mt-0.5', active ? 'text-brand-green font-medium' : 'text-muted-foreground')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
