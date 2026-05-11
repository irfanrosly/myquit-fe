'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StepIndicator } from '@/components/step-indicator';
import { MultiSelectChips } from '@/components/multi-select-chips';
import { useOnboardingStore } from '@/lib/store/onboarding-store';

const STEPS = ['Profile', 'Habits', 'Quit Plan', 'Summary'];
const TOBACCO_OPTIONS = [
  { value: 'cigarette', label: 'Cigarette' },
  { value: 'hand_rolled', label: 'Hand-rolled' },
  { value: 'vape', label: 'Vape' },
  { value: 'cigar', label: 'Cigar' },
  { value: 'shisha', label: 'Shisha' },
  { value: 'other', label: 'Other' },
];
const TTFC_OPTIONS = [
  { value: 'within_5', label: 'Within 5 min' },
  { value: 'm6_30', label: '6–30 min' },
  { value: 'm31_60', label: '31–60 min' },
  { value: 'over_60', label: 'After 60 min' },
];

export default function HabitsPage() {
  const router = useRouter();
  const { habits, setHabits } = useOnboardingStore();
  const dailyCost = habits.pricePerPack && habits.cigsPerPack && habits.cigarettesPd
    ? ((parseFloat(habits.pricePerPack) / parseInt(habits.cigsPerPack)) * parseInt(habits.cigarettesPd)).toFixed(2)
    : null;

  return (
    <>
      <StepIndicator current={1} total={4} labels={STEPS} />
      <Card className="[background:var(--gradient-neutral)]">
        <CardHeader>
          <CardTitle>Smoking Habits</CardTitle>
          <p className="text-sm text-muted-foreground">Tell us about your current habits</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tobacco products used</Label>
            <MultiSelectChips options={TOBACCO_OPTIONS} selected={habits.tobaccoTypes} onChange={(v) => setHabits({ tobaccoTypes: v as any })} className="mt-2" />
          </div>
          <div>
            <Label>Cigarettes per day</Label>
            <Input type="number" value={habits.cigarettesPd} onChange={(e) => setHabits({ cigarettesPd: e.target.value })} min={1} placeholder="e.g. 10" />
          </div>
          <div>
            <Label>Years smoked</Label>
            <Input type="number" value={habits.yearsSmoked} onChange={(e) => setHabits({ yearsSmoked: e.target.value })} min={0} placeholder="e.g. 5" />
          </div>
          <div>
            <Label>Time to first cigarette after waking</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={habits.ttfc} onChange={(e) => setHabits({ ttfc: e.target.value as any })}>
              <option value="">Select</option>
              {TTFC_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Price per pack (RM)</Label>
              <Input type="number" value={habits.pricePerPack} onChange={(e) => setHabits({ pricePerPack: e.target.value })} min={0} step={0.5} placeholder="e.g. 15" />
            </div>
            <div>
              <Label>Sticks per pack</Label>
              <Input type="number" value={habits.cigsPerPack} onChange={(e) => setHabits({ cigsPerPack: e.target.value })} min={1} placeholder="20" />
            </div>
          </div>
          {dailyCost && (
            <p className="text-sm text-brand-green bg-brand-green-muted border border-brand-green-light rounded-lg px-3 py-2">
              Estimated daily cost: <strong>RM {dailyCost}</strong>
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">← Back</Button>
            <Button onClick={() => router.push('/onboarding/plan')} className="flex-1" disabled={habits.tobaccoTypes.length === 0}>
              Next →
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
