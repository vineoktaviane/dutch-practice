export const rnd = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

export function shuffle<T>(a: readonly T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
