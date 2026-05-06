'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StepIndicator } from '@/components/step-indicator';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { onboardingApi } from '@/lib/api/onboarding';
import { usersApi } from '@/lib/api/users';
import { formatRM } from '@/lib/utils/format-currency';

const STEPS = ['Profile', 'Habits', 'Quit Plan', 'Summary'];

export default function SummaryPage() {
  const router = useRouter();
  const { profile, habits, plan, reset } = useOnboardingStore();
  const [loading, setLoading] = useState(false);

  const dailyCost =
    habits.pricePerPack && habits.cigsPerPack && habits.cigarettesPd
      ? (parseFloat(habits.pricePerPack) / parseInt(habits.cigsPerPack)) * parseInt(habits.cigarettesPd)
      : 0;

  async function handleSubmit() {
    setLoading(true);
    try {
      if (profile.name || profile.age || profile.gender) {
        await usersApi.updateMe({
          name: profile.name || undefined,
          age: profile.age ? parseInt(profile.age) : undefined,
          gender: (profile.gender as any) || undefined,
          race: profile.race || undefined,
          education: (profile.education as any) || undefined,
          occupation: profile.occupation || undefined,
        });
      }

      await onboardingApi.save({
        tobaccoTypes: habits.tobaccoTypes as any,
        quitDate: plan.quitDate,
        readiness: plan.readiness,
        confidence: plan.confidence,
        motivations: plan.motivations,
        triggers: plan.triggers,
        supports: plan.supports,
        yearsSmoked: habits.yearsSmoked ? parseInt(habits.yearsSmoked) : undefined,
        cigarettesPd: habits.cigarettesPd ? parseInt(habits.cigarettesPd) : undefined,
        vapeSessionsPd: habits.vapeSessionsPd ? parseInt(habits.vapeSessionsPd) : undefined,
        ttfc: (habits.ttfc as any) || undefined,
        pricePerPack: habits.pricePerPack ? parseFloat(habits.pricePerPack) : undefined,
        cigsPerPack: habits.cigsPerPack ? parseInt(habits.cigsPerPack) : 20,
        pastAttempts: plan.pastAttempts ? parseInt(plan.pastAttempts) : 0,
        longestSmokeFree: (plan.longestSmokeFree as any) || undefined,
      });

      reset();
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Please try again';
      toast.error('Failed to save', { description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <StepIndicator current={3} total={4} labels={STEPS} />
      <Card>
        <CardHeader>
          <CardTitle>Review Your Plan</CardTitle>
          <p className="text-sm text-gray-500">Check your details before starting</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{profile.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Quit date</span><span className="font-medium">{plan.quitDate}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Cigarettes/day</span><span className="font-medium">{habits.cigarettesPd || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Daily cost</span><span className="font-medium text-red-600">{dailyCost ? formatRM(dailyCost) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Readiness</span><span className="font-medium">{plan.readiness}/10</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Confidence</span><span className="font-medium">{plan.confidence}/10</span></div>
          </div>
          {plan.motivations.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Motivations</p>
              <div className="flex flex-wrap gap-1">
                {plan.motivations.map((m) => <span key={m} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{m}</span>)}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">← Back</Button>
            <Button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? 'Saving...' : 'Start My Journey 🚀'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
