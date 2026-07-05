import type { Question } from '../types';
import { COMMON, IMPERF } from '../data';
import { rnd, shuffle } from '../rng';

/** subjects without the ambiguous zij (jij is safe: the imperfectum has no -t to drop) */
const SUBJECTS = [
  { p: 'ik', n: 'sg' },
  { p: 'jij', n: 'sg' },
  { p: 'hij', n: 'sg' },
  { p: 'wij', n: 'pl' },
  { p: 'jullie', n: 'pl' }
] as const;

export function imperfectum(target?: string): Question {
  const targetVerb = target?.startsWith('verb:')
    ? IMPERF.find((x) => `verb:${x.inf}:imperfectum` === target)
    : undefined;
  const wantTeDe = target === 'rule:imperfectum:te-de';

  if (wantTeDe || (!targetVerb && Math.random() < 0.3)) {
    // -te vs -de drill (weak verbs only)
    const v = rnd(IMPERF.filter((x) => x.weak));
    return {
      q: `Imperfectum of "${v.inf}"?`,
      hint: "'t kofschip: -te or -de?",
      options: shuffle([v.sg, v.fake]),
      answer: v.sg,
      why: v.sg.endsWith('te')
        ? `The stem of "${v.inf}" ends in a 't kofschip sound (t, k, f, s, ch, p), so the ending is -te: ${v.sg}.`
        : `The stem of "${v.inf}" does NOT end in a 't kofschip sound, so the ending is -de: ${v.sg}.`,
      facts: ['rule:imperfectum:te-de', `verb:${v.inf}:imperfectum`]
    };
  }

  // conjugated form for a subject
  const v = targetVerb ?? rnd(IMPERF);
  const s = rnd(SUBJECTS);
  const correct = s.n === 'sg' ? v.sg : v.pl;
  const otherNumber = s.n === 'sg' ? v.pl : v.sg;
  const options = shuffle([...new Set([correct, otherNumber, v.fake])]);
  const why = v.weak
    ? `Weak verb: stem + ${v.sg.endsWith('te') ? 'te' : 'de'}(n): ${v.inf}, ${v.sg}, ${v.pl}. With ${s.p} use the ${s.n === 'sg' ? 'singular' : 'plural'}: ${s.p} ${correct}.`
    : `"${v.inf}" is strong (irregular): ${v.inf}, ${v.sg}, ${v.pl}. Memorise it. With ${s.p} use the ${s.n === 'sg' ? 'singular' : 'plural'}: ${s.p} ${correct}.`;
  return {
    q: `${rnd(COMMON.imperf_fronts)} ___ ${s.p} ${v.compl}. (${v.inf})`,
    hint: `${v.en} (imperfectum)`,
    options,
    answer: correct,
    why,
    facts: [`verb:${v.inf}:imperfectum`]
  };
}
