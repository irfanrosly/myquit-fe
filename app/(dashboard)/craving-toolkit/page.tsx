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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Craving Toolkit</h1>
        <p className="text-sm text-gray-500 mt-1">Choose a tool to manage your craving</p>
      </div>
      <div className="space-y-3">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-5">
                <span className="text-3xl">{tool.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-800">{tool.title}</p>
                  <p className="text-sm text-gray-500">{tool.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
