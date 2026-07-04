import type { Question } from '../types';
import { WO } from '../data';
import { rnd, shuffle } from '../rng';

export function wordorder(target?: string): Question {
  const roll =
    target === 'rule:wordorder:inversion'
      ? 0
      : target === 'rule:wordorder:tmp'
        ? 0.5
        : target === 'rule:wordorder:sub'
          ? 1
          : Math.random();
  if (roll < 0.35) {
    // inversion after fronted time
    const t = rnd(WO.time_fronts);
    const c = rnd(WO.clauses);
    const correct = `${c.v} ${c.s}`;
    const wrong = `${c.s} ${c.v}`;
    return {
      q: `${t} ___ ${c.rest}.`,
      hint: 'verb + subject, or subject + verb?',
      options: shuffle([correct, wrong]),
      answer: correct,
      why: `Dutch is verb-second (V2). "${t}" fills position 1, so the verb must come next and the subject flips behind it: ${t} ${c.v} ${c.s} ${c.rest}.`,
      facts: ['rule:wordorder:inversion']
    };
  }
  if (roll < 0.65) {
    // time-manner-place
    const t = rnd(WO.tmp.time);
    const m = rnd(WO.tmp.manner);
    const p = rnd(WO.tmp.place);
    const correct = `${t} ${m} ${p}`;
    const wrongs = [`${p} ${t} ${m}`, `${m} ${p} ${t}`];
    return {
      q: `Ik ga ___.`,
      hint: 'put time, manner and place in the right order',
      options: shuffle([correct, rnd(wrongs)]),
      answer: correct,
      why: `Dutch order is Time - Manner - Place: Ik ga ${t} ${m} ${p}. (English prefers Place before Time: "I'm going to Amsterdam tomorrow.")`,
      facts: ['rule:wordorder:tmp']
    };
  }
  // subordinate clause: verb to the end
  const main = rnd(WO.sub.main);
  const conj = rnd(WO.sub.conj);
  const pred = rnd(WO.sub.pred);
  const s = rnd(WO.sub.subj);
  const vf = s[pred.v];
  const correct = `${s.p} ${pred.txt} ${vf}`;
  const wrong = `${s.p} ${vf} ${pred.txt}`;
  return {
    q: `${main} ${conj} ___.`,
    hint: 'word order after ' + conj,
    options: shuffle([correct, wrong]),
    answer: correct,
    why: `After a subordinating conjunction (omdat, als, terwijl, dat…) the verb moves to the very END: ${main} ${conj} ${correct}.`,
    facts: ['rule:wordorder:sub']
  };
}
