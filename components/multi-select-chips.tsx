'use client';
import { cn } from '@/lib/utils';

interface MultiSelectChipsProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export function MultiSelectChips({ options, selected, onChange, className }: MultiSelectChipsProps) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm border transition-all duration-150',
              isSelected
                ? 'bg-brand-green text-primary-foreground border-brand-green font-medium'
                : 'bg-background text-foreground border-border hover:border-brand-green',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
