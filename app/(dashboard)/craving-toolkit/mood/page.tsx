'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cravingToolkitApi } from '@/lib/api/craving-toolkit';

const MOOD_LABELS = ['', 'Very Low', 'Low', 'Neutral', 'Good', 'Great'];
const CRAVING_LABELS = ['', 'None', 'Mild', 'Moderate', 'Strong', 'Very Strong'];

export default function MoodPage() {
  const router = useRouter();
  const [mood, setMood] = useState(3);
  const [craving, setCraving] = useState(3);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      const result = await cravingToolkitApi.logMood(mood, craving, note || undefined);
      toast.success(`Mood logged! +${result.pointsEarned} points 📝`, {
        description: result.newBadges.length > 0 ? `New badge: ${result.newBadges[0]}` : undefined,
      });
      router.push('/craving-toolkit');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error('Failed to save', { description: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.back()}>←</Button>
        <h1 className="text-xl font-bold text-gray-800">Mood Log</h1>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-5">
          <div>
            <Label className="text-base font-semibold">How do you feel? {mood}/5 — {MOOD_LABELS[mood]}</Label>
            <Slider
              min={1} max={5} step={1}
              value={[mood]}
              onValueChange={(v) => setMood(Array.isArray(v) ? v[0] : v)}
              className="mt-3"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>😞 Very Low</span>
              <span>😊 Great</span>
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold">Craving level? {craving}/5 — {CRAVING_LABELS[craving]}</Label>
            <Slider
              min={1} max={5} step={1}
              value={[craving]}
              onValueChange={(v) => setCraving(Array.isArray(v) ? v[0] : v)}
              className="mt-3"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>🟢 None</span>
              <span>🔴 Very Strong</span>
            </div>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How are you feeling? Any thoughts..."
              rows={3}
              className="mt-1 resize-none"
            />
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full bg-green-600 hover:bg-green-700">
            {saving ? 'Saving...' : 'Save Mood Log (+2 pts)'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
