'use client';
import { motion } from 'framer-motion';

type Phase = 'inhale' | 'hold' | 'exhale' | 'ready';

interface BreathingAnimationProps {
  phase: Phase;
  cycleNumber: number;
  totalCycles: number;
}

const PHASE_CONFIG: Record<Phase, { label: string; color: string; scale: number }> = {
  inhale: { label: 'Inhale', color: '#3a6b4a', scale: 1.4 },
  hold: { label: 'Hold', color: '#0EA5E9', scale: 1.4 },
  exhale: { label: 'Exhale', color: '#8B5CF6', scale: 1 },
  ready: { label: 'Get Ready', color: '#8a8070', scale: 1 },
};

export function BreathingAnimation({ phase, cycleNumber, totalCycles }: BreathingAnimationProps) {
  const config = PHASE_CONFIG[phase];

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8">
      <p className="text-sm text-muted-foreground">Cycle {cycleNumber} of {totalCycles}</p>

      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ scale: config.scale, backgroundColor: config.color }}
          transition={{ duration: phase === 'inhale' ? 4 : phase === 'hold' ? 0 : 8, ease: 'easeInOut' }}
          className="w-40 h-40 rounded-full opacity-20"
        />
        <motion.div
          animate={{ scale: config.scale * 0.7, backgroundColor: config.color }}
          transition={{ duration: phase === 'inhale' ? 4 : phase === 'hold' ? 0 : 8, ease: 'easeInOut' }}
          className="absolute w-28 h-28 rounded-full opacity-40"
        />
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold text-white">{config.label}</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-4xl font-serif-display font-normal" style={{ color: config.color }}>{config.label}</p>
        <p className="text-muted-foreground text-sm mt-1">
          {phase === 'inhale' ? '4 seconds' : phase === 'hold' ? '7 seconds' : phase === 'exhale' ? '8 seconds' : ''}
        </p>
      </div>
    </div>
  );
}
