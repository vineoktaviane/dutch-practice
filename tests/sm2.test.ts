import { describe, expect, it } from 'vitest';
import { DAY_MS, newFactState, reviewFact } from '../src/srs/sm2';

const NOW = 1_750_000_000_000;

describe('SM-2 scheduler (binary grading)', () => {
  it('a new fact is due immediately', () => {
    const s = newFactState('noun:huis:gender', NOW);
    expect(s.due).toBe(NOW);
    expect(s.interval).toBe(0);
    expect(s.reps).toBe(0);
  });

  it('correct answers grow the interval: 1 day, 6 days, then EF-multiplied', () => {
    let s = newFactState('x', NOW);
    s = reviewFact(s, true, NOW);
    expect(s.interval).toBe(1);
    expect(s.due).toBe(NOW + DAY_MS);
    s = reviewFact(s, true, s.due);
    expect(s.interval).toBe(6);
    const third = reviewFact(s, true, s.due);
    expect(third.interval).toBe(Math.round(6 * s.ef));
    expect(third.interval).toBeGreaterThan(10);
  });

  it('a wrong answer resets repetitions and makes the fact due now', () => {
    let s = newFactState('x', NOW);
    s = reviewFact(s, true, NOW);
    s = reviewFact(s, true, NOW + DAY_MS);
    const failedAt = NOW + 7 * DAY_MS;
    s = reviewFact(s, false, failedAt);
    expect(s.reps).toBe(0);
    expect(s.interval).toBe(0);
    expect(s.due).toBe(failedAt);
    expect(s.lapses).toBe(1);
  });

  it('EF drops on failure but never below 1.3, and recovers slowly', () => {
    let s = newFactState('x', NOW);
    const startEf = s.ef;
    for (let i = 0; i < 20; i++) s = reviewFact(s, false, NOW);
    expect(s.ef).toBe(1.3);
    const before = s.ef;
    s = reviewFact(s, true, NOW);
    expect(s.ef).toBeGreaterThan(before);
    expect(s.ef).toBeLessThan(startEf);
  });

  it('tracks lifetime seen/correct counters', () => {
    let s = newFactState('x', NOW);
    s = reviewFact(s, true, NOW);
    s = reviewFact(s, false, NOW);
    s = reviewFact(s, true, NOW);
    expect(s.seen).toBe(3);
    expect(s.correct).toBe(2);
  });
});
