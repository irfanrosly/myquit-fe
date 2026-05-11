'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { BreathingAnimation } from '@/components/breathing-animation';
import { cravingToolkitApi } from '@/lib/api/craving-toolkit';

type Phase = 'inhale' | 'hold' | 'exhale' | 'ready';

const TOTAL_CYCLES = 4;
const PHASE_DURATIONS: Record<Phase, number> = { inhale: 4, hold: 7, exhale: 8, ready: 0 };
const PHASE_ORDER: Phase[] = ['inhale', 'hold', 'exhale'];

export default function BreathingPage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const [cycle, setCycle] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => { cancelledRef.current = true; };
  }, []);

  const runPhase = useCallback((phaseIndex: number, currentCycle: number) => {
    const currentPhase = PHASE_ORDER[phaseIndex];
    setPhase(currentPhase);

    const duration = PHASE_DURATIONS[currentPhase] * 1000;
    setTimeout(() => {
      if (cancelledRef.current) return;
      const nextPhaseIndex = phaseIndex + 1;
      if (nextPhaseIndex < PHASE_ORDER.length) {
        runPhase(nextPhaseIndex, currentCycle);
      } else {
        const nextCycle = currentCycle + 1;
        if (nextCycle <= TOTAL_CYCLES) {
          setCycle(nextCycle);
          runPhase(0, nextCycle);
        } else {
          setPhase('ready');
          setCompleted(true);
        }
      }
    }, duration);
  }, []);

  function start() {
    setStarted(true);
    setCycle(1);
    setCompleted(false);
    runPhase(0, 1);
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const result = await cravingToolkitApi.completeBreathing();
      toast.success(`+${result.pointsEarned} points earned! 🎉`, {
        description: result.newBadges.length > 0 ? `New badge: ${result.newBadges[0]}` : 'Great work!',
      });
      router.push('/craving-toolkit');
    } catch {
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.back()}>←</Button>
        <h1 className="text-xl font-bold text-foreground">Breathing Exercise</h1>
      </div>

      {!started && !completed && (
        <div className="[background:var(--gradient-hero)] rounded-2xl p-8 text-center space-y-4">
          <p className="text-6xl">🫁</p>
          <h2 className="font-serif-display text-2xl font-normal text-primary-foreground">4-7-8 Breathing</h2>
          <p className="text-primary-foreground/70 text-sm">Inhale 4s → Hold 7s → Exhale 8s × 4 cycles (~3 min)</p>
          <Button onClick={start} className="bg-primary-foreground text-brand-green hover:bg-primary-foreground/90 px-8">Start</Button>
        </div>
      )}

      {started && !completed && <BreathingAnimation phase={phase} cycleNumber={cycle} totalCycles={TOTAL_CYCLES} />}

      {completed && (
        <div className="[background:var(--gradient-hero)] rounded-2xl p-8 text-center space-y-4">
          <p className="text-6xl">🎉</p>
          <h2 className="font-serif-display text-2xl font-normal text-primary-foreground">Well done!</h2>
          <p className="text-primary-foreground/70 text-sm">You completed 4 breathing cycles</p>
          <Button onClick={handleComplete} disabled={saving} className="bg-primary-foreground text-brand-green hover:bg-primary-foreground/90 px-8">
            {saving ? 'Saving...' : 'Claim +5 Points'}
          </Button>
        </div>
      )}
    </div>
  );
}
