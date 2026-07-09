import type { Question } from '../types';
import { PASSIVE } from '../data';
import { cap, rnd, shuffle } from '../rng';

type Branch = 'worden' | 'tense' | 'door';

const FORMS = ['wordt', 'worden', 'werd', 'werden'];

export function passive(target?: string): Question {
  let branch: Branch;
  if (target === 'rule:passive:worden') branch = 'worden';
  else if (target === 'rule:passive:tense') branch = 'tense';
  else if (target === 'rule:passive:door') branch = 'door';
  else {
    const roll = Math.random();
    branch = roll < 0.45 ? 'worden' : roll < 0.75 ? 'tense' : 'door';
  }

  if (branch === 'worden') {
    // fixed curated form frames mix in for variety
    if (Math.random() < 0.15) {
      const f = rnd(PASSIVE.worden_form);
      return {
        q: f.q,
        hint: f.en,
        options: shuffle([f.a, ...f.w]),
        answer: f.a,
        why: f.why,
        facts: ['rule:passive:worden']
      };
    }
    // pick the right form of worden: number x tense, in two sentence shapes
    const plural = Math.random() < 0.3;
    const pair = rnd(plural ? PASSIVE.pairs_pl : PASSIVE.pairs_sg);
    const past = Math.random() < 0.5;
    const adv = rnd(past ? PASSIVE.advs_past : PASSIVE.advs_present);
    const correct = past ? (plural ? 'werden' : 'werd') : plural ? 'worden' : 'wordt';
    const fronted = Math.random() < 0.5;
    const q = fronted
      ? `${cap(adv)} ___ ${pair.t.toLowerCase()} ${pair.part}.`
      : `${pair.t} ___ ${adv} ${pair.part}.`;
    const options = shuffle([correct, ...shuffle(FORMS.filter((f) => f !== correct)).slice(0, 2)]);
    return {
      q,
      hint: `passive: ${past ? 'past' : 'present'}, ${plural ? 'plural' : 'singular'} subject`,
      options,
      answer: correct,
      why: `Passive = worden + past participle. ${past ? 'Past' : 'Present'} tense with a ${plural ? 'plural' : 'singular'} subject: ${correct} ${pair.part}.`,
      facts: ['rule:passive:worden']
    };
  }
  if (branch === 'door') {
    const plural = Math.random() < 0.3;
    const pair = rnd(plural ? PASSIVE.pairs_pl : PASSIVE.pairs_sg);
    const agent = rnd(PASSIVE.agents);
    // fixed curated door frames mix in for variety
    if (Math.random() < 0.2) {
      const f = rnd(PASSIVE.door);
      return {
        q: f.q,
        hint: f.en,
        options: shuffle([f.a, ...f.w]),
        answer: f.a,
        why: f.why,
        facts: ['rule:passive:door']
      };
    }
    return {
      q: `${pair.t} ${plural ? 'zijn' : 'is'} ___ ${agent} ${pair.part}.`,
      hint: 'who did it?',
      options: shuffle(['door', 'van', 'bij']),
      answer: 'door',
      why: `The doer in a passive sentence is introduced with DOOR (by): door ${agent}. Never van or bij.`,
      facts: ['rule:passive:door']
    };
  }
  const f = rnd(PASSIVE.tense);
  return {
    q: f.q,
    hint: f.en,
    options: shuffle([f.a, ...f.w]),
    answer: f.a,
    why: f.why,
    facts: ['rule:passive:tense']
  };
}
