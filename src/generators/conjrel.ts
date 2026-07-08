import type { Question } from '../types';
import { CONJREL, NOUNS, countable } from '../data';
import { rnd, shuffle } from '../rng';

type Branch = 'diedat' | 'plural' | 'wat' | 'wantomdat' | 'toenals';

const THING_NOUNS = NOUNS.filter((n) => n.c === 't' || n.c === 'f');
const PERSON_NOUNS = NOUNS.filter((n) => n.c === 'p' || n.c === 'a');

export function conjrel(target?: string): Question {
  let branch: Branch;
  if (target === 'rule:relative:die-dat' || target?.startsWith('noun:')) branch = 'diedat';
  else if (target === 'rule:relative:wat') branch = 'wat';
  else if (target === 'rule:conj:want-omdat') branch = 'wantomdat';
  else if (target === 'rule:conj:toen-als') branch = 'toenals';
  else {
    const roll = Math.random();
    branch =
      roll < 0.3 ? 'diedat' : roll < 0.45 ? 'plural' : roll < 0.6 ? 'wat' : roll < 0.8 ? 'wantomdat' : 'toenals';
  }

  if (branch === 'plural') {
    // plural antecedents always take die, whatever the gender
    const n = rnd(countable);
    return {
      q: `Waar zijn de ${n.pl} ___ ${rnd(CONJREL.relative_plural_frames)}?`,
      hint: `(${n.en}, plural) relative pronoun`,
      options: shuffle(['die', 'dat']),
      answer: 'die',
      why: `Plural nouns ALWAYS take die, even plurals of het-words: de ${n.pl} die ... (Compare: het ${n.nl}, but de ${n.pl}.)`,
      facts: ['rule:relative:die-dat']
    };
  }

  if (branch === 'diedat') {
    const targetNoun = target?.startsWith('noun:')
      ? [...THING_NOUNS, ...PERSON_NOUNS].find((n) => `noun:${n.nl}:gender` === target)
      : undefined;
    const usePerson = targetNoun ? PERSON_NOUNS.includes(targetNoun) : Math.random() < 0.4;
    const n = targetNoun ?? rnd(usePerson ? PERSON_NOUNS : THING_NOUNS);
    const isPerson = PERSON_NOUNS.includes(n);
    const q = isPerson
      ? `Dat is ${n.g} ${n.nl} ___ ${rnd(CONJREL.relative_person_frames)}.`
      : `Waar is ${n.g} ${n.nl} ___ ${rnd(CONJREL.relative_thing_frames)}?`;
    const answer = n.g === 'de' ? 'die' : 'dat';
    return {
      q,
      hint: `(${n.en}) relative pronoun`,
      options: shuffle(['die', 'dat']),
      answer,
      why: `"${n.nl}" is a ${n.g}-word, so the relative pronoun is ${answer.toUpperCase()}: ${n.g} ${n.nl} ${answer} ... (De-words take die, het-words take dat; all plurals take die.)`,
      facts: ['rule:relative:die-dat', `noun:${n.nl}:gender`]
    };
  }
  if (branch === 'wat') {
    const f = rnd(CONJREL.wat);
    return {
      q: f.q,
      hint: f.en,
      options: shuffle(['wat', 'dat']),
      answer: 'wat',
      why: 'After alles, iets, niets and het enige, and when there is no noun at all, the relative pronoun is WAT: alles wat hij zegt.',
      facts: ['rule:relative:wat']
    };
  }
  if (branch === 'wantomdat') {
    const p = rnd(CONJREL.want_omdat);
    const useWant = Math.random() < 0.5;
    const q = useWant ? `${p.main}, ___ ${p.v2}.` : `${p.main} ___ ${p.vf}.`;
    const answer = useWant ? 'want' : 'omdat';
    return {
      q,
      hint: 'both mean "because": look at the word order',
      options: shuffle(['want', 'omdat']),
      answer,
      why: useWant
        ? `The clause keeps normal V2 order (${p.v2}), so it must be WANT, which is coordinating. Omdat would push the verb to the end: omdat ${p.vf}.`
        : `The verb stands at the END (${p.vf}), so it must be OMDAT, which is subordinating. Want would keep normal order: want ${p.v2}.`,
      facts: ['rule:conj:want-omdat']
    };
  }
  const f = rnd(CONJREL.toen_als);
  return {
    q: f.q,
    hint: f.en,
    options: shuffle(['Toen', 'Als']),
    answer: f.a,
    why:
      f.a === 'Toen'
        ? 'One event or period in the PAST takes TOEN: Toen ik klein was... Als is for present, future and repeated situations.'
        : 'Present, future or repeated situations take ALS: Als het regent... Toen is only for single past events or periods.',
    facts: ['rule:conj:toen-als']
  };
}
