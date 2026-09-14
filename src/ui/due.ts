import { factStates } from './state';

/** facts ready for review, soonest-due first */
export function dueFactIds(now: number): string[] {
  return [...factStates.values()]
    .filter((s) => s.due <= now)
    .sort((a, b) => a.due - b.due)
    .map((s) => s.id);
}

/** how long until the next fact comes up, for the home screen review card */
export function nextDueText(now: number): string {
  let min = Infinity;
  for (const s of factStates.values()) if (s.due < min) min = s.due;
  if (min === Infinity) return '';
  const h = Math.ceil((min - now) / 3_600_000);
  if (h <= 1) return 'next review within the hour';
  if (h < 24) return `next review in ${h}h`;
  return `next review in ${Math.ceil(h / 24)}d`;
}
