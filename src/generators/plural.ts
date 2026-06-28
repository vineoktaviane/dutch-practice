import type { Question } from '../types';
import { COMMON, countable } from '../data';
import { rnd, shuffle } from '../rng';

export function plural(target?: string): Question {
  const n = (target && countable.find((x) => `noun:${x.nl}:plural` === target)) || rnd(countable);
  const num = rnd(COMMON.numerals);
  const naiveEn = n.nl + 'en';
  const naiveS = n.nl + 's';
  const opts = new Set([n.pl]);
  if (naiveEn !== n.pl) opts.add(naiveEn);
  if (naiveS !== n.pl) opts.add(naiveS);
  const why = n.pl.endsWith("'s")
    ? `Nouns ending in a single a, o, u, i or y take -'s with an apostrophe: ${n.pl}.`
    : n.pl.endsWith('s')
      ? `Nouns ending in unstressed -el, -er, -en, -em or -je usually take -s: ${n.pl}.`
      : `The plural of "${n.nl}" is "${n.pl}". Note the spelling: long vowels lose a letter (boom → bomen), short vowels double the consonant (kat → katten), and s/f often become z/v (huis → huizen).`;
  return {
    q: `één ${n.nl} → ${num} ___`,
    hint: `(${n.en})`,
    options: shuffle([...opts].slice(0, 3)),
    answer: n.pl,
    why,
    facts: [`noun:${n.nl}:plural`]
  };
}
