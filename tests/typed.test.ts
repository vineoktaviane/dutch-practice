import { describe, expect, it } from 'vitest';
import { acceptedAnswers, charDiff, gradeTyped, isTypeable, levenshtein, normalizeAnswer } from '../src/typed';
import { GEN } from '../src/generators';
import type { Question } from '../src/types';

describe('answer normalizer', () => {
  it('trims, case-folds and drops end punctuation', () => {
    expect(normalizeAnswer('  Huizen. ')).toBe('huizen');
    expect(normalizeAnswer('HET')).toBe('het');
    expect(normalizeAnswer('Werk jij?!')).toBe('werk jij');
  });

  it('collapses inner whitespace', () => {
    expect(normalizeAnswer('morgen   met de trein')).toBe('morgen met de trein');
  });

  it('unifies curly and straight apostrophes', () => {
    expect(normalizeAnswer('auto’s')).toBe("auto's");
    expect(normalizeAnswer("auto's")).toBe("auto's");
  });
});

describe('typed grading', () => {
  const q = (answer: string, accept?: string[]): Question => ({
    q: '___',
    hint: '',
    options: [answer, 'x'],
    answer,
    why: 'w',
    facts: ['rule:negation:niet'],
    accept
  });

  it('accepts exact and normalised matches', () => {
    expect(gradeTyped(q('huizen'), 'Huizen.')).toEqual({ ok: true, nearMiss: false });
  });

  it('accepts curated variants', () => {
    expect(gradeTyped(q('mij', ['me']), 'me').ok).toBe(true);
    expect(acceptedAnswers(q('mij', ['me']))).toContain('me');
  });

  it('flags a genuine typo as wrong but close', () => {
    expect(gradeTyped(q('huizen'), 'huisen')).toEqual({ ok: false, nearMiss: true });
    expect(gradeTyped(q('huizen'), 'katten')).toEqual({ ok: false, nearMiss: false });
    expect(gradeTyped(q('huizen'), '')).toEqual({ ok: false, nearMiss: false });
  });

  it('never flatters an offered distractor as a near miss', () => {
    // "gehoort" is the -t/-d error the perfect-tense question exists to teach,
    // so it must read as wrong, not as "so close, check the highlighted letters"
    const perf: Question = { ...q('gehoord'), options: ['gehoord', 'gehoort'] };
    expect(gradeTyped(perf, 'gehoort')).toEqual({ ok: false, nearMiss: false });
    // the same edit distance on a word that is not an offered option still counts
    expect(gradeTyped(q('gehoord'), 'gehoorf')).toEqual({ ok: false, nearMiss: true });
  });

  it('scales the near-miss threshold to answer length', () => {
    // two edits on a three-letter answer is a different word, not a slip
    expect(gradeTyped(q('dat'), 'die')).toEqual({ ok: false, nearMiss: false });
    expect(gradeTyped(q('gewerkt'), 'gewerkd')).toEqual({ ok: false, nearMiss: true });
  });
});

describe('levenshtein / char diff', () => {
  it('computes edit distance', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('kat', 'kat')).toBe(0);
    expect(levenshtein('huisen', 'huizen')).toBe(1);
    expect(levenshtein('gewerkt', 'gewerkd')).toBe(1);
  });

  it('marks the characters that differ', () => {
    const marks = charDiff('huisen', 'huizen');
    expect(marks.map((p) => p.ch).join('')).toBe('huisen');
    expect(marks.filter((p) => !p.same).map((p) => p.ch)).toEqual(['s']);
  });
});

describe('typeable detection', () => {
  it('word-order skeleton questions (with …) stay multiple choice', () => {
    const q = GEN.modal('rule:modal:structure');
    expect(isTypeable(q)).toBe(false);
    const sep = GEN.separable('sep:opstaan:split');
    expect(isTypeable(sep)).toBe(false);
  });

  it('production questions are typeable', () => {
    expect(isTypeable(GEN.dehet())).toBe(true);
    expect(isTypeable(GEN.plural())).toBe(true);
    expect(isTypeable(GEN.perfect('verb:kopen:participle'))).toBe(true);
    expect(isTypeable(GEN.wordorder('rule:wordorder:tmp'))).toBe(true);
  });

  it('every topic can produce at least one typeable question', () => {
    for (const [name, gen] of Object.entries(GEN)) {
      let typeable = false;
      for (let i = 0; i < 200 && !typeable; i++) typeable = isTypeable(gen());
      expect(typeable, name).toBe(true);
    }
  });
});
