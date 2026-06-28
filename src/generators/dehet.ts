import type { Question } from '../types';
import { DEHET_FRAMES, NOUNS } from '../data';
import { rnd, shuffle } from '../rng';

export function dehet(target?: string): Question {
  const n = (target && NOUNS.find((x) => `noun:${x.nl}:gender` === target)) || rnd(NOUNS);
  const wantDem = target === 'rule:dehet:demonstrative';
  const genderWhy =
    n.g === 'het'
      ? n.nl.endsWith('je')
        ? `"${n.nl}" is a diminutive (ends in -je), and all diminutives are het-words.`
        : `"${n.nl}" (${n.en}) is a het-word. Het-words must simply be memorised. Always learn the article with the noun.`
      : `"${n.nl}" (${n.en}) is a de-word. About 75% of Dutch nouns take "de".`;

  if (wantDem || (!target && Math.random() < 0.3)) {
    // demonstrative drill: deze/die for de-words, dit/dat for het-words
    const f = rnd(DEHET_FRAMES.demonstrative);
    const answer = n.g === 'het' ? f.het : f.de;
    return {
      q: f.t.replace('{n}', n.nl),
      hint: `(${n.en}) ${f.kind === 'this' ? 'this' : 'that'}`,
      options: shuffle([f.de, f.het]),
      answer,
      why: `${genderWhy} De-words take deze/die, het-words take dit/dat: ${answer} ${n.nl}.`,
      facts: ['rule:dehet:demonstrative', `noun:${n.nl}:gender`]
    };
  }

  const f = rnd(DEHET_FRAMES.article);
  const answer = f.cap ? (n.g === 'de' ? 'De' : 'Het') : n.g;
  return {
    q: f.t.replace('{n}', n.nl),
    hint: `(${n.en})`,
    options: f.cap ? ['De', 'Het'] : ['de', 'het'],
    answer,
    why: genderWhy,
    facts: [`noun:${n.nl}:gender`]
  };
}
