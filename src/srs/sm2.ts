/**
 * SM-2 scheduler adapted for binary grading (multiple choice gives us
 * correct/wrong, not the 0-5 quality scale):
 *   correct → quality 4 semantics, plus a small EF recovery so a fact
 *             that lapsed once isn't stuck at the minimum forever
 *   wrong   → quality 2 semantics: EF −0.32, repetitions reset,
 *             due again immediately
 */
export interface FactState {
  id: string;
  /** easiness factor, clamped to [1.3, 2.8] */
  ef: number;
  /** consecutive correct reviews */
  reps: number;
  /** current interval in days */
  interval: number;
  /** epoch ms when this fact is due */
  due: number;
  lapses: number;
  seen: number;
  correct: number;
}

export const DAY_MS = 86_400_000;
const EF_MIN = 1.3;
const EF_MAX = 2.8;
const EF_WRONG_PENALTY = 0.32;
const EF_CORRECT_RECOVERY = 0.03;

/** A brand-new fact is due immediately (it enters the deck unlearned). */
export function newFactState(id: string, now: number): FactState {
  return { id, ef: 2.5, reps: 0, interval: 0, due: now, lapses: 0, seen: 0, correct: 0 };
}

export function reviewFact(prev: FactState, ok: boolean, now: number): FactState {
  const s: FactState = { ...prev, seen: prev.seen + 1, correct: prev.correct + (ok ? 1 : 0) };
  if (ok) {
    s.reps = prev.reps + 1;
    s.interval = s.reps === 1 ? 1 : s.reps === 2 ? 6 : Math.round(prev.interval * prev.ef);
    s.ef = Math.min(EF_MAX, prev.ef + EF_CORRECT_RECOVERY);
    s.due = now + s.interval * DAY_MS;
  } else {
    s.reps = 0;
    s.interval = 0;
    s.lapses = prev.lapses + 1;
    s.ef = Math.max(EF_MIN, prev.ef - EF_WRONG_PENALTY);
    s.due = now; // relearn in this session
  }
  return s;
}
