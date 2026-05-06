'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StepIndicator } from '@/components/step-indicator';
import { useOnboardingStore } from '@/lib/store/onboarding-store';

const STEPS = ['Profile', 'Habits', 'Quit Plan', 'Summary'];
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not', label: 'Prefer not to say' },
];
const EDUCATION_OPTIONS = [
  { value: 'secondary', label: 'Secondary' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile } = useOnboardingStore();

  return (
    <>
      <StepIndicator current={0} total={4} labels={STEPS} />
      <Card>
        <CardHeader>
          <CardTitle>About You</CardTitle>
          <p className="text-sm text-gray-500">Help us personalise your quit journey</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Full Name *</Label>
            <Input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} placeholder="Your name" />
          </div>
          <div>
            <Label>Age</Label>
            <Input type="number" value={profile.age} onChange={(e) => setProfile({ age: e.target.value })} placeholder="e.g. 30" min={10} max={120} />
          </div>
          <div>
            <Label>Gender</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={profile.gender} onChange={(e) => setProfile({ gender: e.target.value as any })}>
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Race / Ethnicity</Label>
            <Input value={profile.race} onChange={(e) => setProfile({ race: e.target.value })} placeholder="Optional" />
          </div>
          <div>
            <Label>Education</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={profile.education} onChange={(e) => setProfile({ education: e.target.value as any })}>
              <option value="">Select education</option>
              {EDUCATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Occupation</Label>
            <Input value={profile.occupation} onChange={(e) => setProfile({ occupation: e.target.value })} placeholder="Optional" />
          </div>
          <Button onClick={() => { if (!profile.name.trim()) return; router.push('/onboarding/habits'); }} className="w-full bg-green-600 hover:bg-green-700" disabled={!profile.name.trim()}>
            Next →
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
