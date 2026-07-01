import type { Question } from '../types';
import { COMMON, SUBJ, VERBS } from '../data';
import { cap, rnd, shuffle } from '../rng';

/** complements that are themselves time expressions clash with a fronted time adverb */
const TIME_WORDS = ['vanavond', 'gisteren', 'morgen', 'vandaag'];
const timeFree = (compl: string) => !TIME_WORDS.some((w) => compl.includes(w));

export function present(target?: string): Question {
  const targetVerb = target?.startsWith('verb:')
    ? VERBS.find((x) => `verb:${x.inf}:present` === target)
    : undefined;
  const v = targetVerb ?? rnd(VERBS);
  const type =
    target === 'rule:present:inversion' ? 'inv' : targetVerb ? 'norm' : Math.random() < 0.15 ? 'inv' : 'norm';
  if (type === 'inv') {
    const q = `___ jij morgen ${v.compl}? (${v.inf})`;
    const correct = cap(v.stem);
    const wrong = cap(v.t) === correct ? cap(v.inf) : cap(v.t);
    return {
      q,
      hint: `${v.en} (question with jij)`,
      options: shuffle([correct, wrong]),
      answer: correct,
      why: `When "jij" comes AFTER the verb (questions, inversion), the -t is dropped: ${cap(v.stem)} jij? But: Jij ${v.t}.`,
      facts: ['rule:present:inversion', `verb:${v.inf}:present`]
    };
  }
  const s = rnd(SUBJ);
  const forms = { ik: v.stem, t: v.t, pl: v.inf };
  const pron = s.pron || s.p;
  const fronted = timeFree(v.compl) && Math.random() < 0.5;

  // after a fronted adverb the subject follows the verb, so jij loses its -t
  const correct = fronted && s.p === 'jij' ? v.stem : forms[s.slot];
  const distr = new Set([v.stem, v.t, v.inf]);
  distr.delete(correct);
  const q = fronted
    ? `${rnd(COMMON.present_fronts)} ___ ${pron} ${v.compl}. (${v.inf})`
    : `${cap(pron)} ___ ${v.compl}. (${v.inf})`;
  const why =
    fronted && s.p === 'jij'
      ? `The sentence starts with a time word, so the verb comes second and jij follows it. Jij AFTER the verb loses the -t: ${v.stem} jij.`
      : s.slot === 'ik'
        ? `"ik" takes the bare stem: ik ${v.stem}.`
        : s.slot === 't'
          ? `"${s.p}" takes stem + t: ${pron} ${v.t}.${v.stem === v.t ? ' (The stem already ends in -t, so nothing is added.)' : ''}`
          : `"${s.p}" takes the full infinitive: ${pron} ${v.inf}.`;
  return {
    q,
    hint: v.en,
    options: shuffle([correct, ...[...distr].slice(0, 2)]),
    answer: correct,
    why,
    facts: [`verb:${v.inf}:present`]
  };
}
