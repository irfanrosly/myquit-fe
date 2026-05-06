export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-green-600 text-center mb-6">MYQuitMate</h1>
        {children}
      </div>
    </div>
  );
}
