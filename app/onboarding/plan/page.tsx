'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { StepIndicator } from '@/components/step-indicator';
import { MultiSelectChips } from '@/components/multi-select-chips';
import { useOnboardingStore } from '@/lib/store/onboarding-store';

const STEPS = ['Profile', 'Habits', 'Quit Plan', 'Summary'];
const MOTIVATION_OPTIONS = [
  { value: 'health', label: 'Health' },
  { value: 'family', label: 'Family' },
  { value: 'money', label: 'Save money' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'pregnancy', label: 'Pregnancy' },
  { value: 'social', label: 'Social pressure' },
  { value: 'appearance', label: 'Appearance' },
  { value: 'religion', label: 'Religion' },
];
const TRIGGER_OPTIONS = [
  { value: 'stress', label: 'Stress' },
  { value: 'social', label: 'Social situations' },
  { value: 'boredom', label: 'Boredom' },
  { value: 'after_meal', label: 'After meals' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'driving', label: 'Driving' },
  { value: 'work_break', label: 'Work breaks' },
];
const SUPPORT_OPTIONS = [
  { value: 'family', label: 'Family' },
  { value: 'friends', label: 'Friends' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'counselor', label: 'Counselor' },
  { value: 'quitline', label: 'Quitline' },
  { value: 'app', label: 'This app' },
];

export default function PlanPage() {
  const router = useRouter();
  const { plan, setPlan } = useOnboardingStore();
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <StepIndicator current={2} total={4} labels={STEPS} />
      <Card>
        <CardHeader>
          <CardTitle>Your Quit Plan</CardTitle>
          <p className="text-sm text-gray-500">Plan your journey to freedom</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Quit Date *</Label>
            <Input type="date" min={today} value={plan.quitDate} onChange={(e) => setPlan({ quitDate: e.target.value })} />
          </div>
          <div>
            <Label>Readiness to quit: {plan.readiness}/10</Label>
            <Slider min={0} max={10} step={1} value={[plan.readiness]} onValueChange={(v) => setPlan({ readiness: Array.isArray(v) ? (v as number[])[0] : (v as number) })} className="mt-2" />
          </div>
          <div>
            <Label>Confidence to quit: {plan.confidence}/10</Label>
            <Slider min={0} max={10} step={1} value={[plan.confidence]} onValueChange={(v) => setPlan({ confidence: Array.isArray(v) ? (v as number[])[0] : (v as number) })} className="mt-2" />
          </div>
          <div>
            <Label>Motivations</Label>
            <MultiSelectChips options={MOTIVATION_OPTIONS} selected={plan.motivations} onChange={(v) => setPlan({ motivations: v })} className="mt-2" />
          </div>
          <div>
            <Label>Triggers</Label>
            <MultiSelectChips options={TRIGGER_OPTIONS} selected={plan.triggers} onChange={(v) => setPlan({ triggers: v })} className="mt-2" />
          </div>
          <div>
            <Label>Support systems</Label>
            <MultiSelectChips options={SUPPORT_OPTIONS} selected={plan.supports} onChange={(v) => setPlan({ supports: v })} className="mt-2" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">← Back</Button>
            <Button onClick={() => router.push('/onboarding/summary')} className="flex-1 bg-green-600 hover:bg-green-700" disabled={!plan.quitDate}>
              Next →
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
