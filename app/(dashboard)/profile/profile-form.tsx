'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { usersApi } from '@/lib/api/users';
import { User, Gender, Education } from '@/types';

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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileForm({ user }: { user: User }) {
  const [form, setForm] = useState({
    name: user.name ?? '',
    age: user.age != null ? String(user.age) : '',
    gender: user.gender ?? '',
    race: user.race ?? '',
    education: user.education ?? '',
    occupation: user.occupation ?? '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await usersApi.updateMe({
        name: form.name.trim(),
        age: form.age ? Number(form.age) : undefined,
        gender: (form.gender as Gender) || undefined,
        race: form.race.trim() || undefined,
        education: (form.education as Education) || undefined,
        occupation: form.occupation.trim() || undefined,
      });
      toast.success('Profile updated');
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 pt-2 pb-4">
        <div className="w-20 h-20 rounded-full bg-brand-green flex items-center justify-center text-white text-2xl font-bold select-none">
          {getInitials(form.name || user.name)}
        </div>
        <p className="font-semibold text-foreground text-lg leading-tight">{form.name || user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="[background:var(--gradient-neutral)] rounded-xl p-4 space-y-4">
        <div>
          <Label>Full Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div>
          <Label>Age</Label>
          <Input
            type="number"
            value={form.age}
            onChange={(e) => set('age', e.target.value)}
            placeholder="e.g. 30"
            min={10}
            max={120}
          />
        </div>

        <div>
          <Label>Gender</Label>
          <select
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.gender}
            onChange={(e) => set('gender', e.target.value)}
          >
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Race / Ethnicity</Label>
          <Input
            value={form.race}
            onChange={(e) => set('race', e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div>
          <Label>Education</Label>
          <select
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.education}
            onChange={(e) => set('education', e.target.value)}
          >
            <option value="">Select education</option>
            {EDUCATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Occupation</Label>
          <Input
            value={form.occupation}
            onChange={(e) => set('occupation', e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <Button
        className="w-full"
        onClick={handleSave}
        disabled={!form.name.trim() || saving}
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  );
}
