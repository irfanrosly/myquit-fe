'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authApi.login(form.email, form.password);
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (!user.onboardingDone) {
        router.push('/onboarding/profile');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Invalid credentials';
      toast.error('Login failed', { description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 20%, oklch(0.22 0.12 155 / 0.5), transparent 60%), oklch(0.10 0.008 200)' }}>
      <Card className="w-full max-w-sm overflow-hidden glass-card border-0">
        <div className="h-1.5 bg-brand-green" />
        <CardHeader>
          <CardTitle className="font-serif-display text-3xl font-normal text-center text-brand-green">MYQuitMate</CardTitle>
          <p className="text-center text-muted-foreground text-sm">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            No account?{' '}
            <Link href="/register" className="text-brand-green hover:underline underline-offset-4">Register</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
