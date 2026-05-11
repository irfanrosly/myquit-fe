export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="[background:var(--gradient-hero)] px-4 py-5 rounded-b-2xl mb-6">
        <p className="font-serif-display text-3xl font-normal text-primary-foreground text-center">MYQuitMate</p>
        <p className="text-primary-foreground/70 text-sm text-center mt-1">Your quit journey starts here</p>
      </div>
      <div className="max-w-lg mx-auto px-4 pb-8">
        {children}
      </div>
    </div>
  );
}
