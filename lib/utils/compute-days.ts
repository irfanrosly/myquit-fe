export function computeDaysSince(dateStr: string): number {
  const quit = new Date(dateStr);
  quit.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((now.getTime() - quit.getTime()) / (1000 * 60 * 60 * 24)));
}
