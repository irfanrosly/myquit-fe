export function relativeDays(iso: string | null): string {
  if (!iso) return 'No slips logged yet.';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days <= 0) return 'Last slip: today';
  if (days === 1) return 'Last slip: 1 day ago';
  return `Last slip: ${days} days ago`;
}
