import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProfileForm } from './profile-form';
import { LogoutButton } from '@/components/logout-button';
import { User } from '@/types';

async function getUser(): Promise<User> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) redirect('/login');

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${API}/users/me`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  });

  if (!res.ok) redirect('/login');

  const { data } = await res.json();
  return data;
}

export default async function ProfilePage() {
  const user = await getUser();

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold text-foreground">My Profile</h1>
      <p className="text-sm text-muted-foreground">Update your personal details</p>
      <ProfileForm user={user} />
      <LogoutButton />
    </div>
  );
}
