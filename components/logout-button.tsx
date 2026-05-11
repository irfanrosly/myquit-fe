'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api/auth';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await authApi.logout();
    } catch {
      // cookies cleared server-side regardless of response
    }
    router.push('/login');
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={loading}
      className="w-full border-destructive text-destructive hover:bg-destructive/5"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
}
