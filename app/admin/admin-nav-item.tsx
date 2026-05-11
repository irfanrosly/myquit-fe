'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AdminNavItemProps {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

export function AdminNavItem({ href, label, icon, exact }: AdminNavItemProps) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
        active
          ? 'bg-teal-600 text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800',
      )}
    >
      <span className="text-base leading-none" aria-hidden="true">{icon}</span>
      {label}
    </Link>
  );
}
