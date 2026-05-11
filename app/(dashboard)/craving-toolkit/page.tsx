import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

const TOOLS = [
  { href: '/craving-toolkit/breathing', emoji: '🫁', title: 'Breathing Exercise', desc: '4-7-8 guided breathing — 3 minutes. +5 pts' },
  { href: '/craving-toolkit/distraction', emoji: '🎯', title: 'Distraction Tasks', desc: 'Pick a task to redirect your craving. +3 pts' },
  { href: '/craving-toolkit/mood', emoji: '📝', title: 'Mood Log', desc: 'Track how you feel today. +2 pts' },
];

export default function CravingToolkitPage() {
  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl px-5 py-5 overflow-hidden glass-card">
        <div className="absolute inset-0 [background:var(--gradient-hero)] pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-foreground">Craving Toolkit</h1>
          <p className="text-muted-foreground text-sm mt-1">Choose a tool to manage your craving</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="block">
            <Card className="glass-card-energy hover:shadow-lg hover:shadow-brand-amber/20 transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-5">
                <span className="text-3xl">{tool.emoji}</span>
                <div>
                  <p className="font-semibold text-foreground">{tool.title}</p>
                  <p className="text-sm text-muted-foreground">{tool.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
