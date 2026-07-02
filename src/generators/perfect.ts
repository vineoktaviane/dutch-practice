import type { PerfectVerb, Question, Subject } from '../types';
import { AUXF, COMMON, PERF, SUBJ } from '../data';
import { cap, rnd, shuffle } from '../rng';

type Branch = 'part' | 'aux' | 'kof';

const TIME_WORDS = ['gisteren', 'vanavond', 'morgen', 'vandaag'];
const timeFree = (compl: string) => !TIME_WORDS.some((w) => compl.includes(w));

/** conjugated auxiliary for this subject; inverted = subject follows the verb (jij loses -t) */
function auxFor(aux: 'hebben' | 'zijn', s: Subject, inverted: boolean): string {
  const f = AUXF[aux];
  if (s.p === 'jij') return inverted ? (aux === 'hebben' ? 'heb' : 'ben') : f.jij;
  return s.slot === 'ik' ? f.ik : s.slot === 'pl' ? f.pl : f.t;
}

export function perfect(target?: string): Question {
  let branch: Branch;
  let targetVerb: PerfectVerb | undefined;
  if (target === 'rule:perfect:kofschip') {
    branch = 'kof';
  } else if (target?.startsWith('verb:') && target.endsWith(':participle')) {
    targetVerb = PERF.find((x) => `verb:${x.inf}:participle` === target);
    branch = targetVerb ? 'part' : rollBranch();
  } else if (target?.startsWith('verb:') && target.endsWith(':aux')) {
    targetVerb = PERF.find((x) => `verb:${x.inf}:aux` === target);
    branch = targetVerb ? 'aux' : rollBranch();
  } else {
    branch = rollBranch();
  }

  if (branch === 'part') {
    // choose participle
    const v = targetVerb ?? rnd(PERF);
    const s = rnd(SUBJ);
    const pron = s.pron || s.p;
    const fronted = timeFree(v.compl) && Math.random() < 0.5;
    const aux = auxFor(v.aux, s, fronted);
    let wrong: string;
    if (v.part.endsWith('t')) wrong = v.part.slice(0, -1) + 'd';
    else if (v.part.endsWith('d')) wrong = v.part.slice(0, -1) + 't';
    else wrong = 'ge' + v.inf;
    if (wrong === v.part) wrong = v.inf;
    const q = fronted
      ? `${rnd(COMMON.past_fronts)} ${aux} ${pron} ${v.compl} ___. (${v.inf})`
      : `${cap(pron)} ${aux} ${v.compl} ___. (${v.inf})`;
    return {
      q,
      hint: 'past participle',
      options: shuffle([v.part, wrong]),
      answer: v.part,
      why: `The past participle of "${v.inf}" is "${v.part}".`,
      facts: [`verb:${v.inf}:participle`]
    };
  }
  if (branch === 'aux') {
    // hebben vs zijn
    const v = targetVerb ?? rnd(PERF);
    const s = rnd(SUBJ);
    const pron = s.pron || s.p;
    const fronted = timeFree(v.compl) && Math.random() < 0.5;
    const correct = auxFor(v.aux, s, fronted);
    const wrong = auxFor(v.aux === 'hebben' ? 'zijn' : 'hebben', s, fronted);
    const q = fronted
      ? `${rnd(COMMON.past_fronts)} ___ ${pron} ${v.compl} ${v.part}.`
      : `${cap(pron)} ___ ${v.compl} ${v.part}.`;
    return {
      q,
      hint: `${v.inf}: hebben or zijn?`,
      options: shuffle([correct, wrong]),
      answer: correct,
      why:
        v.aux === 'zijn'
          ? `"${v.inf}" describes movement or a change of state, so it takes ZIJN: ${pron} ${correct} ${v.part}.`
          : `"${v.inf}" takes HEBBEN (like most verbs): ${pron} ${correct} ${v.part}. Zijn is only for movement/change-of-state verbs.`,
      facts: [`verb:${v.inf}:aux`]
    };
  }
  // 't kofschip drill
  const regs = PERF.filter(
    (p) =>
      p.part.startsWith('ge') &&
      (p.part.endsWith('t') || p.part.endsWith('d')) &&
      !['gekocht', 'gezegd', 'gevraagd'].includes(p.part)
  );
  const v = rnd(regs);
  const wrong = v.part.endsWith('t') ? v.part.slice(0, -1) + 'd' : v.part.slice(0, -1) + 't';
  return {
    q: `Past participle of "${v.inf}"?`,
    hint: "'t kofschip: -t or -d?",
    options: shuffle([v.part, wrong]),
    answer: v.part,
    why: v.part.endsWith('t')
      ? `The stem of "${v.inf}" ends in a 't kofschip sound (t, k, f, s, ch, p) → participle ends in -t: ${v.part}.`
      : `The stem of "${v.inf}" does NOT end in a 't kofschip sound → participle ends in -d: ${v.part}.`,
    facts: ['rule:perfect:kofschip', `verb:${v.inf}:participle`]
  };
}

function rollBranch(): Branch {
  const roll = Math.random();
  return roll < 0.45 ? 'part' : roll < 0.8 ? 'aux' : 'kof';
}
