import type { Question } from './types';

/**
 * Typed-answer (production mode) engine: normalisation, accepted-answer
 * sets, and diff feedback for near misses.
 */

/** trim, case-fold, collapse whitespace, unify apostrophes, drop end punctuation */
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?]+$/, '')
    .trim();
}

/**
 * Questions whose options are word-order skeletons (they contain the
 * "…" placeholder) test position, not production, and stay multiple choice.
 */
export function isTypeable(q: Question): boolean {
  return !q.options.some((o) => o.includes('…'));
}

/** all normalised strings graded as correct for this question */
export function acceptedAnswers(q: Question): string[] {
  const set = new Set([q.answer, ...(q.accept ?? [])].map(normalizeAnswer));
  return [...set];
}

export function gradeTyped(q: Question, input: string): { ok: boolean; nearMiss: boolean } {
  const norm = normalizeAnswer(input);
  const accepts = acceptedAnswers(q);
  if (accepts.includes(norm)) return { ok: true, nearMiss: false };
  const dist = Math.min(...accepts.map((a) => levenshtein(norm, a)));
  return { ok: false, nearMiss: norm.length > 0 && dist <= 2 };
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const row = [i];
    for (let j = 1; j <= n; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[n];
}

export interface DiffPart {
  ch: string;
  same: boolean;
}

/** character diff of one string against the other, based on their LCS */
export function charDiff(s: string, other: string): DiffPart[] {
  const m = s.length;
  const n = other.length;
  // LCS length table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = s[i - 1] === other[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  // walk back, marking characters of s that are part of the LCS
  const same = new Array(m).fill(false);
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (s[i - 1] === other[j - 1]) {
      same[i - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  return [...s].map((ch, k) => ({ ch, same: same[k] }));
}
