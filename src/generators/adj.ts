import type { Question } from '../types';
import { ADJ_PAIRS } from '../data';
import { rnd, shuffle } from '../rng';

type Ctx = 'def' | 'indef' | 'plur';

export function adj(target?: string): Question {
  let pair: (typeof ADJ_PAIRS)[number];
  let ctx: Ctx;
  const t = target?.startsWith('rule:adj:') ? target.slice('rule:adj:'.length) : null;
  if (t === 'def') {
    pair = rnd(ADJ_PAIRS);
    ctx = 'def';
  } else if (t === 'plur') {
    pair = rnd(ADJ_PAIRS.filter(([n]) => n.pl));
    ctx = 'plur';
  } else if (t === 'indef-de') {
    pair = rnd(ADJ_PAIRS.filter(([n]) => n.g === 'de'));
    ctx = 'indef';
  } else if (t === 'indef-het') {
    pair = rnd(ADJ_PAIRS.filter(([n]) => n.g === 'het'));
    ctx = 'indef';
  } else {
    pair = rnd(ADJ_PAIRS);
    ctx = rnd<Ctx>(pair[0].pl ? ['def', 'indef', 'plur'] : ['def', 'indef']);
  }
  const [n, a] = pair;
  let sentence: string, answer: string, why: string, facts: string[];
  if (ctx === 'def') {
    sentence = `${n.g} ___ ${n.nl}`;
    answer = a.e;
    why = `After "de" or "het" the adjective always gets -e: ${n.g} ${a.e} ${n.nl}.`;
    facts = ['rule:adj:def'];
  } else if (ctx === 'plur') {
    sentence = `de ___ ${n.pl}`;
    answer = a.e;
    why = `Before a plural noun the adjective always gets -e: de ${a.e} ${n.pl}. (All plurals are de-words.)`;
    facts = ['rule:adj:plur'];
  } else {
    sentence = `een ___ ${n.nl}`;
    // knowing the noun's gender is half of this question, so it is a fact too
    facts = [`rule:adj:indef-${n.g}`, `noun:${n.nl}:gender`];
    if (n.g === 'het') {
      answer = a.b;
      why = `THE exception: een + het-word + singular = no -e. So: een ${a.b} ${n.nl}, but HET ${a.e} ${n.nl}.`;
    } else {
      answer = a.e;
      why = `"${n.nl}" is a de-word, so the adjective gets -e even after "een": een ${a.e} ${n.nl}. Only een + het-word drops the -e.`;
    }
  }
  return { q: sentence, hint: `(${a.en} ${n.en})`, options: shuffle([a.b, a.e]), answer, why, facts };
}
