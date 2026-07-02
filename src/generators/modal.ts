import type { Question } from '../types';
import { MODALS, SUBJ, VERBS } from '../data';
import { cap, rnd, shuffle } from '../rng';

/** complements that fit every modal and every subject */
export const MODAL_COMPLS = [
  'goed Nederlands spreken',
  'morgen komen',
  'vandaag thuis blijven',
  'de auto repareren',
  'naar het feest gaan',
  'hier parkeren',
  'nu naar huis gaan',
  'goed zwemmen',
  'de vraag beantwoorden',
  'even wachten',
  'buiten spelen',
  'het raam openen'
];

/** time adverbs for the structure drill; skipped when the verb's complement is itself a time expression */
export const MODAL_TIMES = ['vandaag', 'morgen', 'nu', 'vanavond', 'straks', 'dit weekend'];
const TIME_WORDS = ['vanavond', 'gisteren', 'morgen', 'vandaag'];
export const modalTimeFree = (compl: string): boolean => !TIME_WORDS.some((w) => compl.includes(w));

export function modal(target?: string): Question {
  const targetModal = target?.startsWith('modal:')
    ? MODALS.find((x) => `modal:${x.inf}:conjugation` === target)
    : undefined;
  const wantStructure = target === 'rule:modal:structure';
  if (targetModal || (!wantStructure && Math.random() < 0.35)) {
    // conjugation
    const m = targetModal ?? rnd(MODALS);
    const s = rnd(SUBJ);
    const correct = s.slot === 'ik' ? m.ik : s.slot === 'pl' ? m.pl : s.p === 'jij' ? m.jij : m.hij;
    const distr = new Set([m.ik, m.jij, m.hij, m.pl]);
    distr.delete(correct);
    const pron = s.pron || s.p;
    return {
      q: `${cap(pron)} ___ ${rnd(MODAL_COMPLS)}. (${m.inf})`,
      hint: m.en,
      options: shuffle([correct, ...[...distr].slice(0, 2)]),
      answer: correct,
      why: `${cap(pron)} ${correct}. Note: with kunnen, mogen, willen and zullen, the hij/zij-form has NO -t (hij kan, hij mag, hij wil, hij zal), unlike regular verbs.`,
      facts: [`modal:${m.inf}:conjugation`]
    };
  }
  // structure: modal + infinitive at the end
  const m = rnd(MODALS);
  const v = rnd(VERBS);
  const s = rnd(SUBJ.filter((x) => ['ik', 't', 'pl'].includes(x.slot)));
  const mf = s.slot === 'ik' ? m.ik : s.slot === 'pl' ? m.pl : s.p === 'jij' ? m.jij : m.hij;
  const pron = s.pron || s.p;
  const when = modalTimeFree(v.compl) ? rnd(MODAL_TIMES) : null;
  const middle = when ? `${when} ${v.compl}` : v.compl;
  const correct = `${mf} … ${v.inf}`;
  const wrong1 = `${mf} ${v.inf} …`;
  const wrong2 = `${v.inf} … ${mf}`;
  return {
    q: `${cap(pron)} ___ ${middle} ___. (${m.inf} + ${v.inf})`,
    hint: 'where do the two verbs go?',
    options: shuffle([correct, wrong1, wrong2]),
    answer: correct,
    why: `The modal is conjugated in second position; the other verb goes to the END as an infinitive: ${cap(pron)} ${mf} ${middle} ${v.inf}.`,
    facts: ['rule:modal:structure']
  };
}
