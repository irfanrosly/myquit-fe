'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Cigarette } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { smokeLogApi } from '@/lib/api/smoke-log';

export function SmokeLogFab() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function confirm() {
    setSubmitting(true);
    try {
      await smokeLogApi.create();
      setOpen(false);
      toast.success("Logged. Streak reset. You're still on the path. 💪");
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? 'Could not log. Try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Log a smoke"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition-colors hover:bg-amber-600 active:bg-amber-700"
      >
        <Cigarette className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a slip?</DialogTitle>
            <DialogDescription>
              Slip ≠ failure. Honesty helps you understand your patterns.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirm}
              disabled={submitting}
            >
              {submitting ? 'Logging…' : 'Yes, I smoked'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
