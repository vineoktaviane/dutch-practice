import type { Question } from '../types';
import { COMP, NOUNS } from '../data';
import { rnd, shuffle } from '../rng';

type Branch = 'comp' | 'sup' | 'danals' | 'attr';

/** frame subjects: all de-words so the -e ending is uniform */
export const COMP_SUBJECTS = [
  'auto is', 'stad is', 'film is', 'kamer is', 'fiets is', 'tas is',
  'jas is', 'stoel is', 'trein is', 'straat is', 'winkel is', 'tuin is',
  'deur is', 'lamp is', 'boom is', 'bloem is', 'krant is', 'broek is',
  'schoen is', 'les is', 'markt is', 'brug is', 'keuken is', 'bus is'
];
/** every entry must exist in the noun bank (looked up for its gender) */
export const SUP_NOUNS = [
  'dag', 'stad', 'boek', 'huis', 'film', 'auto', 'kamer', 'verhaal', 'gebouw', 'reis',
  'land', 'straat', 'kerk', 'museum', 'hotel', 'restaurant', 'dorp', 'trein', 'schip', 'boot'
];
/** de-words that combine naturally with "een ___" + comparative */
export const ATTR_NOUNS = [
  'auto', 'fiets', 'tafel', 'stoel', 'jas', 'tas', 'computer', 'telefoon', 'kamer', 'baan',
  'lamp', 'broek', 'trui', 'schoen', 'bloem', 'boom', 'krant', 'bus', 'fles', 'klok'
];

export function comparative(target?: string): Question {
  let branch: Branch;
  let targetAdj: (typeof COMP)[number] | undefined;
  if (target === 'rule:comparative:dan-als') {
    branch = 'danals';
  } else if (target?.startsWith('comp:') && target.endsWith(':comparative')) {
    targetAdj = COMP.find((x) => `comp:${x.b}:comparative` === target);
    branch = targetAdj ? (targetAdj.ce && Math.random() < 0.3 ? 'attr' : 'comp') : rollBranch();
  } else if (target?.startsWith('comp:') && target.endsWith(':superlative')) {
    targetAdj = COMP.find((x) => `comp:${x.b}:superlative` === target);
    branch = targetAdj ? 'sup' : rollBranch();
  } else {
    branch = rollBranch();
  }
  let a = targetAdj ?? rnd(COMP);

  if (branch === 'comp') {
    // comparative form
    const frame = `${rnd(['Deze', 'Die'])} ${rnd(COMP_SUBJECTS)} ___ dan de andere. (${a.b})`;
    const wrong = a.c === a.b + 'er' ? 'meer ' + a.b : a.b + 'er';
    return {
      q: frame,
      hint: a.en,
      options: shuffle([a.c, wrong === a.c ? a.b : wrong]),
      answer: a.c,
      why:
        a.c === 'beter' || a.c === 'meer' || a.c === 'minder' || a.c === 'liever'
          ? `"${a.b}" is irregular: ${a.b}, ${a.c}, ${a.s}. Learn these by heart.`
          : a.b.endsWith('r')
            ? `Adjectives ending in -r add -der: ${a.b} → ${a.c}.`
            : `Dutch almost always uses -er, even for long adjectives (no "more"): ${a.b} → ${a.c}.`,
      facts: [`comp:${a.b}:comparative`]
    };
  }
  if (branch === 'sup') {
    // superlative attributive
    const pick = rnd(SUP_NOUNS);
    const nObj = NOUNS.find((n) => n.nl === pick)!;
    const frame = rnd([
      `Dit is ${nObj.g === 'het' ? 'het' : 'de'} ___ ${nObj.nl} van allemaal. (${a.b})`,
      `Van de drie is dit ${nObj.g === 'het' ? 'het' : 'de'} ___ ${nObj.nl}. (${a.b})`
    ]);
    return {
      q: frame,
      hint: a.en,
      options: shuffle([a.s + 'e', a.c, a.s]),
      answer: a.s + 'e',
      why: `Superlative before a noun: ${a.b} → ${a.s} + e: ${nObj.g} ${a.s}e ${nObj.nl}. (${a.c === 'beter' ? 'Irregular: goed, beter, best.' : ''}The adjective -e rule still applies.)`,
      facts: [`comp:${a.b}:superlative`]
    };
  }
  if (branch === 'attr') {
    // comparative before a noun gets the adjective -e
    if (!a.ce) a = rnd(COMP.filter((x) => x.ce));
    const noun = rnd(ATTR_NOUNS);
    return {
      q: `Wij zoeken een ___ ${noun}. (${a.b})`,
      hint: `${a.en}, comparative before the noun`,
      options: shuffle([a.ce!, a.c]),
      answer: a.ce!,
      why: `Before a noun the comparative still takes the adjective -e: een ${a.ce} ${noun}. ("${noun}" is a de-word, so the -e always appears.)`,
      facts: [`comp:${a.b}:comparative`]
    };
  }
  // dan vs als
  const useAls = Math.random() < 0.5;
  if (useAls) {
    return {
      q: `Deze koffie is net zo ___ als die thee. (${a.b})`,
      hint: 'equality: just as ... as',
      options: shuffle([a.b, a.c]),
      answer: a.b,
      why: `Equality uses net zo + BASE form + als: net zo ${a.b} als. The comparative (${a.c}) only appears with dan.`,
      facts: ['rule:comparative:dan-als']
    };
  }
  return {
    q: `Deze koffie is ${a.c} ___ die thee.`,
    hint: 'than = ?',
    options: shuffle(['dan', 'als']),
    answer: 'dan',
    why: `After a comparative use DAN: ${a.c} dan. "Als" is used for equality: net zo ${a.b} als.`,
    facts: ['rule:comparative:dan-als']
  };
}

function rollBranch(): Branch {
  const roll = Math.random();
  return roll < 0.35 ? 'comp' : roll < 0.6 ? 'sup' : roll < 0.8 ? 'attr' : 'danals';
}
