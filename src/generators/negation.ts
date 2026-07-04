import type { Question } from '../types';
import { ADJS, NEG, NOUNS } from '../data';
import { rnd, shuffle } from '../rng';

/** subject + verb pairs for the geen drill; hebben/zien/zoeken work with every noun category */
export const GEEN_SUBJECTS = [
  ['Ik', 'heb'],
  ['Hij', 'heeft'],
  ['Zij', 'heeft'],
  ['Wij', 'hebben'],
  ['Jullie', 'hebben'],
  ['De kinderen', 'hebben'],
  ['Ik', 'zie'],
  ['Hij', 'ziet'],
  ['Zij', 'ziet'],
  ['Wij', 'zien'],
  ['Jullie', 'zien'],
  ['Ik', 'zoek'],
  ['Hij', 'zoekt'],
  ['Zij', 'zoekt'],
  ['Wij', 'zoeken'],
  ['Jullie', 'zoeken']
];

/** definite possessive phrases for the niet drill (definite, so geen is impossible) */
export const NIET_POSSESSIONS = [
  'mijn tas',
  'mijn jas',
  'zijn fiets',
  'haar boek',
  'onze auto',
  'mijn telefoon',
  'zijn sleutel',
  'haar bril',
  'ons huis',
  'jouw stoel',
  'mijn computer',
  'haar horloge'
];

export function negation(target?: string): Question {
  const wantGeen =
    target === 'rule:negation:geen' ? true : target === 'rule:negation:niet' ? false : Math.random() < 0.5;
  if (wantGeen) {
    // geen
    const n = rnd(NOUNS.filter((x) => x.c !== 'p' || Math.random() < 0.3));
    const s = rnd(GEEN_SUBJECTS);
    return {
      q: `${s[0]} ${s[1]} ___ ${n.nl}.`,
      hint: `(${n.en})`,
      options: shuffle(['geen', 'niet']),
      answer: 'geen',
      why: `Use GEEN to negate an indefinite noun. It replaces "een" or no article: geen ${n.nl}. (Think: geen = "not a / no".)`,
      facts: ['rule:negation:geen']
    };
  }
  const s = rnd(NEG.subjects);
  const t = rnd([
    () => ({
      q: `${s.p} ${s.w} ___ op ${rnd(NEG.days)}.`,
      why: `Use NIET to negate a verb, adjective, or a definite/prepositional phrase. Here you negate the working itself.`
    }),
    () => {
      const p = rnd(NOUNS.filter((x) => x.c === 'l'));
      return {
        q: `${s.p} ${s.g} ___ naar ${p.g === 'de' ? 'de' : 'het'} ${p.nl}.`,
        why: `NIET negates prepositional phrases like "naar ${p.g} ${p.nl}". GEEN is only for indefinite nouns.`
      };
    },
    () => {
      const a = rnd(ADJS);
      return {
        q: `${s.p} ${s.v} de film ___ ${a.b}.`,
        why: `NIET negates adjectives: niet ${a.b}. GEEN can only stand before an indefinite noun.`
      };
    },
    () => {
      const poss = rnd(NIET_POSSESSIONS);
      return {
        q: `Dat is ___ ${poss}.`,
        why: `"${poss}" is definite (it has a possessive), so use NIET. GEEN is only for indefinite nouns (een tas / tassen without article).`
      };
    }
  ])();
  return {
    q: t.q,
    hint: 'niet or geen?',
    options: shuffle(['niet', 'geen']),
    answer: 'niet',
    why: t.why,
    facts: ['rule:negation:niet']
  };
}
