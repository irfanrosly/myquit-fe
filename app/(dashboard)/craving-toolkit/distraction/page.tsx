'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cravingToolkitApi } from '@/lib/api/craving-toolkit';

const TASKS = [
  { emoji: '🚶', label: 'Take a 5-min walk' },
  { emoji: '💧', label: 'Drink a glass of water' },
  { emoji: '🎵', label: 'Listen to a song' },
  { emoji: '🧘', label: 'Do 10 deep breaths' },
  { emoji: '📞', label: 'Call a friend' },
  { emoji: '🍬', label: 'Chew some gum' },
  { emoji: '🪥', label: 'Brush your teeth' },
  { emoji: '✏️', label: 'Doodle something' },
  { emoji: '📖', label: 'Read for 5 minutes' },
  { emoji: '🚿', label: 'Splash cold water on face' },
  { emoji: '🧠', label: 'Meditate for 2 minutes' },
  { emoji: '🤸', label: 'Do 10 jumping jacks' },
];

export default function DistractionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleComplete() {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await cravingToolkitApi.completeDistraction();
      toast.success(`+${result.pointsEarned} points earned! 🎉`, { description: `Completed: ${selected}` });
      router.push('/craving-toolkit');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.back()}>←</Button>
        <h1 className="text-xl font-bold text-gray-800">Distraction Tasks</h1>
      </div>
      <p className="text-sm text-gray-500">Pick a task to redirect your craving energy</p>

      <div className="grid grid-cols-2 gap-3">
        {TASKS.map((task) => (
          <button
            key={task.label}
            onClick={() => setSelected(task.label)}
            aria-label={`Select: ${task.label}`}
            aria-pressed={selected === task.label}
            className={`p-4 rounded-xl border text-left transition-all ${
              selected === task.label
                ? 'bg-green-50 border-green-400 shadow-sm'
                : 'bg-white border-gray-200 hover:border-green-300'
            }`}
          >
            <span className="text-2xl">{task.emoji}</span>
            <p className="text-sm font-medium text-gray-700 mt-1">{task.label}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="sticky bottom-24 pt-2">
          <Button
            onClick={handleComplete}
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {saving ? 'Saving...' : `Done: "${selected}" → Claim +3 Points`}
          </Button>
        </div>
      )}
    </div>
  );
}
