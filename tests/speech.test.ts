import { describe, expect, it } from 'vitest';
import { speechSupported, spokenText } from '../src/speech';
import { GEN } from '../src/generators';
import type { Question } from '../src/types';

const q = (text: string, answer: string): Question => ({
  q: text,
  hint: '',
  options: [answer, 'x'],
  answer,
  why: 'w',
  facts: ['rule:negation:niet']
});

describe('spokenText builder', () => {
  it('fills the blank with the correct answer', () => {
    expect(spokenText(q('___ huis', 'het'))).toBe('het huis');
    expect(spokenText(q('Dat is ___ mijn tas.', 'niet'))).toBe('Dat is niet mijn tas.');
  });

  it('strips parenthetical hints', () => {
    expect(spokenText(q('Hij ___ in een winkel. (werken)', 'werkt'))).toBe('Hij werkt in een winkel.');
  });

  it('speaks only the answer when there is no blank', () => {
    expect(spokenText(q('Past participle of "werken"?', 'gewerkt'))).toBe('gewerkt');
  });

  it('turns arrows into pauses', () => {
    expect(spokenText(q('één huis → twee ___', 'huizen'))).toBe('één huis, twee huizen');
  });

  it('returns null for position-skeleton answers', () => {
    expect(spokenText(q('Hij ___ vandaag ___.', 'kan … komen'))).toBeNull();
  });

  it('handles leading ellipses in subordinate-clause questions', () => {
    expect(spokenText(q('…omdat ik elke dag ___. (opstaan)', 'opsta'))).toBe('omdat ik elke dag opsta.');
  });

  it('produces speakable text or null for every generator draw', () => {
    for (const [name, gen] of Object.entries(GEN)) {
      for (let i = 0; i < 300; i++) {
        const question = gen();
        const s = spokenText(question);
        const label = `[${name}] ${JSON.stringify(question)} -> ${JSON.stringify(s)}`;
        if (s !== null) {
          expect(s.length, label).toBeGreaterThan(0);
          expect(s, label).not.toContain('___');
          expect(s, label).not.toContain('(');
          expect(s, label).not.toContain('…');
        } else {
          // only position questions are unspeakable
          expect(question.answer, label).toContain('…');
        }
      }
    }
  });
});

describe('feature detection', () => {
  it('reports unsupported outside a speech-capable browser', () => {
    // node test environment has no window.speechSynthesis
    expect(speechSupported()).toBe(false);
  });
});
