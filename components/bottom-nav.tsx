'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Award, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/badges', label: 'Badges', icon: Award },
  { href: '/craving-toolkit', label: 'Craving', icon: Heart },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={cn('flex-1 flex flex-col items-center justify-center py-3 text-xs transition-colors', active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600')}>
              <Icon className="w-5 h-5 mb-0.5" strokeWidth={active ? 2.5 : 1.5} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
