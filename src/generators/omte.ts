import type { Question } from '../types';
import { OMTE, SEP, VERBS } from '../data';
import { rnd, shuffle } from '../rng';

type Branch = 'purpose' | 'teverbs' | 'separable';

export const OMTE_SUBJECTS = [
  { p: 'Ik', form: 'ik' },
  { p: 'Hij', form: 'hij' },
  { p: 'Zij', form: 'hij' },
  { p: 'Wij', form: 'wij' },
  { p: 'Jullie', form: 'wij' }
] as const;

export function omte(target?: string): Question {
  let branch: Branch;
  if (target === 'rule:omte:purpose') branch = 'purpose';
  else if (target === 'rule:omte:te-verbs') branch = 'teverbs';
  else if (target === 'rule:omte:separable') branch = 'separable';
  else {
    const roll = Math.random();
    branch = roll < 0.3 ? 'purpose' : roll < 0.65 ? 'teverbs' : 'separable';
  }

  if (branch === 'purpose') {
    const main = rnd(OMTE.purpose_mains);
    const pair = rnd(OMTE.purpose_pairs);
    const correct = 'om … te';
    return {
      q: `${main} ___ ${pair.obj} ___ ${pair.verb}.`,
      hint: 'purpose: in order to',
      options: shuffle([correct, 'te … om', 'om te …']),
      answer: correct,
      why: `Purpose is om + rest + te + infinitive, all at the end: ${main} om ${pair.obj} te ${pair.verb}.`,
      facts: ['rule:omte:purpose']
    };
  }
  if (branch === 'teverbs') {
    const tv = rnd(OMTE.te_verbs);
    const s = rnd(OMTE_SUBJECTS);
    const form = tv[s.form];
    const v = rnd(VERBS);
    const q = tv.neg
      ? `${s.p} ${form} ${v.compl} niet ___ ${v.inf}.`
      : `${s.p} ${form} ${v.compl} ___ ${v.inf}.`;
    return {
      q,
      hint: `${tv.inf} + ${v.inf}`,
      options: shuffle(['te', 'om']),
      answer: 'te',
      why: `After verbs like proberen, vergeten, hopen, beginnen, beloven and hoeven, the linked infinitive takes TE: ${form} ... te ${v.inf}. "Om" alone is never enough.`,
      facts: ['rule:omte:te-verbs']
    };
  }
  const tv = rnd(OMTE.te_verbs.filter((x) => !x.neg));
  const s = rnd(OMTE_SUBJECTS);
  const v = rnd(SEP);
  const rest = v.inf.slice(v.part.length);
  const correct = `${v.part} te ${rest}`;
  const wrong = `te ${v.inf}`;
  return {
    q: `${s.p} ${tv[s.form]} ${v.compl} ___. (${v.inf})`,
    hint: `${v.en}: where does te go?`,
    options: shuffle([correct, wrong]),
    answer: correct,
    why: `In a te-construction a separable verb splits around te: ${v.part} + te + ${rest}. Never "te ${v.inf}".`,
    facts: ['rule:omte:separable']
  };
}
