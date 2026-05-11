interface StepIndicatorProps {
  current: number;
  total: number;
  labels: string[];
}

export function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < current
                  ? 'bg-brand-green text-primary-foreground'
                  : i === current
                  ? 'bg-brand-green-muted text-brand-green border-2 border-brand-green'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span className="text-xs mt-1 text-muted-foreground hidden sm:block">{labels[i]}</span>
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 flex-1 mx-1 ${i < current ? 'bg-brand-green' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
