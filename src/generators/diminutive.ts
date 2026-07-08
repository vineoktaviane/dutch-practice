import type { Diminutive, Question } from '../types';
import { COMMON, DIM, DIM_FRAMES } from '../data';
import { rnd, shuffle } from '../rng';

const RULE_WHY: Record<Diminutive['rule'], string> = {
  je: 'After most consonants the diminutive is simply -je',
  tje: 'After a vowel, or after l, n, r with a long vowel, the diminutive is -tje',
  pje: 'After m the diminutive is -pje',
  kje: 'Unstressed -ing becomes -inkje',
  etje: 'After l, m, n, r or ng with a SHORT vowel the diminutive is -etje, and the consonant doubles'
};

type Branch = 'form' | 'article' | 'plural';

export function diminutive(target?: string): Question {
  const targetDim = target?.startsWith('dim:') ? DIM.find((x) => `dim:${x.nl}` === target) : undefined;
  let branch: Branch;
  if (target === 'rule:diminutive:het') branch = 'article';
  else if (target === 'rule:diminutive:plural') branch = 'plural';
  else if (targetDim) branch = 'form';
  else {
    const roll = Math.random();
    branch = roll < 0.55 ? 'form' : roll < 0.8 ? 'article' : 'plural';
  }

  if (branch === 'form') {
    const d = targetDim ?? rnd(DIM);
    const frame = rnd(DIM_FRAMES.form);
    return {
      q: frame.replace('{nl}', d.nl),
      hint: `(small ${d.en})`,
      options: shuffle([d.dim, d.fake]),
      answer: d.dim,
      why: `${RULE_WHY[d.rule]}: ${d.nl} → ${d.dim}.${d.note ? ' ' + d.note : ''}`,
      facts: [`dim:${d.nl}`]
    };
  }
  if (branch === 'plural') {
    // diminutive plurals always take -s
    const d = rnd(DIM);
    const num = rnd(COMMON.numerals);
    return {
      q: `${num} ___ (${d.dim})`,
      hint: `(small ${d.en}, plural)`,
      options: shuffle([d.dimpl, d.dim]),
      answer: d.dimpl,
      why: `Diminutive plurals ALWAYS take -s: ${d.dim} → ${d.dimpl}. No exceptions, whatever the base noun's plural was.`,
      facts: ['rule:diminutive:plural', `dim:${d.nl}`]
    };
  }
  // article drill: every diminutive is het
  const d = rnd(DIM);
  const f = rnd(DIM_FRAMES.article);
  return {
    q: f.t.replace('{dim}', d.dim),
    hint: `(small ${d.en})`,
    options: f.cap ? ['De', 'Het'] : ['de', 'het'],
    answer: f.cap ? 'Het' : 'het',
    why: `ALL diminutives are het-words: het ${d.dim}. Whatever the base noun's gender is, the diminutive is always het. No exceptions.`,
    facts: ['rule:diminutive:het']
  };
}
