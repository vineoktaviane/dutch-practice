import type { Question, SeparableVerb } from '../types';
import { AUXF, MODALS, SEP, SUBJ } from '../data';
import { cap, rnd, shuffle } from '../rng';

type Branch = 'split' | 'participle' | 'subclause' | 'modal';

/** adverbs for the subordinate-clause drill; skipped when the verb's complement is itself a time expression */
export const SUB_ADVS = ['elke dag', 'vandaag', 'morgen', 'nu', 'vaak', 'altijd'];
const TIME_WORDS = ['vanavond', 'gisteren', 'morgen', 'vandaag'];
export const sepTimeFree = (compl: string): boolean => !TIME_WORDS.some((w) => compl.includes(w));

export function separable(target?: string): Question {
  let branch: Branch | undefined;
  let targetVerb: SeparableVerb | undefined;
  if (target?.startsWith('sep:')) {
    const [, inf, kind] = target.split(':');
    targetVerb = SEP.find((x) => x.inf === inf);
    if (targetVerb && (kind === 'split' || kind === 'participle' || kind === 'subclause' || kind === 'modal'))
      branch = kind;
  }
  const v = targetVerb ?? rnd(SEP);
  if (!branch) {
    const roll = Math.random();
    branch = roll < 0.3 ? 'split' : roll < 0.55 ? 'participle' : 0.8 > roll ? 'subclause' : 'modal';
  }
  const s = rnd(SUBJ.filter((x) => ['ik', 't', 'pl'].includes(x.slot)));
  const pron = s.pron || s.p;

  if (branch === 'modal') {
    // with a modal the separable verb rejoins as one infinitive at the end
    const m = rnd(MODALS);
    const mf = s.slot === 'ik' ? m.ik : s.slot === 'pl' ? m.pl : s.p === 'jij' ? m.jij : m.hij;
    const wrong = `${v.inf.slice(v.part.length)} ${v.part}`;
    return {
      q: `${cap(pron)} ${mf} ${v.compl} ___. (${m.inf} + ${v.inf})`,
      hint: v.en,
      options: shuffle([v.inf, wrong]),
      answer: v.inf,
      why: `With a modal verb the separable verb REJOINS as one infinitive at the end: ${cap(pron)} ${mf} ${v.compl} ${v.inf}.`,
      facts: [`sep:${v.inf}:modal`]
    };
  }

  if (branch === 'split') {
    // present split
    const verbForm = s.slot === 'ik' ? v.stem : s.slot === 't' ? v.t : v.inf.slice(v.part.length);
    const correct = `${verbForm} … ${v.part}`;
    const wrong = `${v.part}${verbForm} …`;
    return {
      q: `${cap(pron)} ___ ${v.compl} ___. (${v.inf})`,
      hint: v.en,
      options: shuffle([correct, wrong]),
      answer: correct,
      why: `In a main clause a separable verb SPLITS: the verb is conjugated in position 2, the particle goes to the end: ${cap(pron)} ${verbForm} ${v.compl} ${v.part}.`,
      facts: [`sep:${v.inf}:split`]
    };
  }
  if (branch === 'participle') {
    const wrong = 'ge' + v.part + v.pp.slice(v.part.length + 2); // geopstaan-style: ge in front instead of the middle
    const wrong2 = 'ge' + v.pp.replace('ge', '');
    const aux =
      s.slot === 'ik'
        ? AUXF[v.aux].ik
        : s.slot === 't'
          ? s.p === 'jij'
            ? AUXF[v.aux].jij
            : AUXF[v.aux].t
          : AUXF[v.aux].pl;
    return {
      q: `${cap(pron)} ${aux} ${v.compl} ___. (${v.inf})`,
      hint: 'past participle of a separable verb',
      options: shuffle([v.pp, wrong2 === v.pp ? wrong : wrong2]),
      answer: v.pp,
      why: `With separable verbs, GE goes BETWEEN the particle and the verb: ${v.part} + ge + …: ${v.pp}.`,
      facts: [`sep:${v.inf}:participle`]
    };
  }
  // subordinate clause: stays together
  const verbForm = s.slot === 'ik' ? v.part + v.stem : s.slot === 't' ? v.part + v.t : v.inf;
  const middle = sepTimeFree(v.compl) ? `${rnd(SUB_ADVS)} ${v.compl}` : v.compl;
  return {
    q: `…omdat ${pron} ${middle} ___. (${v.inf})`,
    hint: 'subordinate clause',
    options: shuffle([verbForm, s.slot === 'ik' ? v.stem + ' ' + v.part : v.t + ' ' + v.part]),
    answer: verbForm,
    why: `In a subordinate clause the verb goes to the end and the separable verb REJOINS as one word: …omdat ${pron} ${middle} ${verbForm}.`,
    facts: [`sep:${v.inf}:subclause`]
  };
}
