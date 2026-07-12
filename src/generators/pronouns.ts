import type { Question } from '../types';
import { NOUNS, PRON } from '../data';
import { rnd, shuffle } from '../rng';
import { personSlug } from '../srs/facts';

/** sentence frames for the possessive drill; {n} is the noun slot */
export const POSS_FRAMES = ['Dit is ___ {n}.', 'Waar is ___ {n}?', 'Ik zie ___ {n}.'];

export function pronouns(target?: string): Question {
  const targetPoss = target?.startsWith('poss:')
    ? PRON.possessives.find((x) => `poss:${personSlug(x.p)}` === target)
    : undefined;
  const targetObj = target?.startsWith('objpron:')
    ? PRON.object_pronouns.find((x) => `objpron:${personSlug(x.p)}` === target)
    : undefined;
  if (targetPoss || (!targetObj && Math.random() < 0.6)) {
    // possessives
    const per = targetPoss ?? rnd(PRON.possessives);
    const n = rnd(NOUNS);
    const correct = n.g === 'het' ? per.het : per.de;
    let opts: string[];
    if (per.p === 'wij') {
      opts = ['ons', 'onze'];
    } else {
      const others = PRON.possessives.filter((x) => x.p !== per.p).map((x) => (n.g === 'het' ? x.het : x.de));
      opts = [correct, rnd(others.filter((o) => o !== correct))];
    }
    const why =
      per.p === 'wij'
        ? n.g === 'het'
          ? `"${n.nl}" is a het-word → ONS: ons ${n.nl}. (De-words take onze.)`
          : `"${n.nl}" is a de-word → ONZE: onze ${n.nl}. (Het-words take ons.)`
        : `The possessive for "${per.p}" is "${correct}": ${correct} ${n.nl}.`;
    return {
      q: `${rnd(POSS_FRAMES).replace('{n}', n.nl)} (${per.p})`,
      hint: `(${n.en})`,
      options: shuffle(opts),
      answer: correct,
      why,
      // ons/onze is the only possessive where the noun's gender is tested too
      facts: [`poss:${personSlug(per.p)}`, ...(per.p === 'wij' ? [`noun:${n.nl}:gender`] : [])]
    };
  }
  // unstressed variants that are equally correct when typed
  const OBJ_VARIANTS: Record<string, string[]> = { mij: ['me'], jou: ['je'] };
  const per = targetObj ?? rnd(PRON.object_pronouns);
  const tmpl = rnd(PRON.object_templates);
  const distr = PRON.object_pronouns
    .filter((x) => x.p !== per.p)
    .map((x) => x.o)
    .filter((o) => o !== per.o);
  const subjForm = per.p.split(' ')[0];
  return {
    q: tmpl.replace('{}', '___') + ` (${per.p})`,
    hint: 'object pronoun',
    options: shuffle(
      [per.o, rnd(distr), subjForm !== per.o ? subjForm : rnd(distr)]
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 3)
    ),
    answer: per.o,
    why: `The object form of "${per.p}" is "${per.o}". Subject forms (ik, hij, zij…) can't be used as objects.`,
    facts: [`objpron:${personSlug(per.p)}`],
    accept: OBJ_VARIANTS[per.o]
  };
}
