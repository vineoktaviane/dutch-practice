import type { PrepRelation, Question } from '../types';
import { PREP, PREP_X } from '../data';
import { rnd, shuffle } from '../rng';

/* pools the two wrong options are drawn from */
const PLACE_PREPS = ['op', 'in', 'onder', 'naast', 'voor', 'achter', 'bij', 'tussen', 'aan', 'boven'];
const TIME_PREPS = ['om', 'op', 'in'];

const wrongsFrom = (pool: string[], correct: string): string[] =>
  shuffle(pool.filter((p) => p !== correct)).slice(0, 2);

function templated(
  subject: string,
  verb: string,
  rel: PrepRelation,
  place: string,
  factGroup: 'place' | 'time'
): Question {
  return {
    q: `${subject} ${verb} ___ ${place}.`,
    hint: `(${rel.en})`,
    options: shuffle([rel.p, ...wrongsFrom(PLACE_PREPS, rel.p)]),
    answer: rel.p,
    why: `${rel.en} = ${rel.p}: ${rel.p} ${place}.`,
    facts: [`prep:${factGroup}:${rel.p}`]
  };
}

export function prepositions(target?: string): Question {
  // fixed, fully curated frames (also the fallback)
  const fixedTarget = target?.startsWith('prep:') && PREP.find((x) => `prep:${x.id}` === target);
  let branch: string;
  if (fixedTarget) branch = 'fixed';
  else if (target?.startsWith('prep:place:')) {
    const p = target.slice('prep:place:'.length);
    branch = PREP_X.living.relations.some((r) => r.p === p)
      ? rnd(['lying', 'living'].filter((b) => hasRelation(b, p)))
      : hasRelation('lying', p)
        ? 'lying'
        : 'hanging';
  } else if (target?.startsWith('prep:time:')) {
    branch = rnd(['begint', 'fronted']);
  } else {
    const roll = Math.random();
    branch =
      roll < 0.2 ? 'fixed' : roll < 0.45 ? 'lying' : 0.55 > roll ? 'hanging' : roll < 0.75 ? 'begint' : roll < 0.9 ? 'fronted' : 'living';
  }

  if (branch === 'lying' || branch === 'hanging' || branch === 'living') {
    const targetP = target?.startsWith('prep:place:') ? target.slice('prep:place:'.length) : null;
    if (branch === 'living') {
      const group = PREP_X.living;
      const rel = (targetP && group.relations.find((r) => r.p === targetP)) || rnd(group.relations);
      const place = rnd(rel.places);
      return {
        q: `${rnd(group.subjects)} ___ ${place}.`,
        hint: `(${rel.en})`,
        options: shuffle([rel.p, ...wrongsFrom(['in', 'bij', 'aan', 'op', 'naast'], rel.p)]),
        answer: rel.p,
        why: `${rel.en} = ${rel.p}: wonen ${rel.p} ${place}.`,
        facts: [`prep:place:${rel.p}`]
      };
    }
    const group = branch === 'lying' ? PREP_X.lying : PREP_X.hanging;
    const rel = (targetP && group.relations.find((r) => r.p === targetP)) || rnd(group.relations);
    const place = rnd(rel.places);
    const subject = rnd(group.objects);
    const verb = branch === 'lying' ? 'ligt' : 'hangt';
    return templated(subject, verb, rel, place, 'place');
  }
  if (branch === 'begint') {
    const targetP = target?.startsWith('prep:time:') ? target.slice('prep:time:'.length) : null;
    const p = (targetP as 'om' | 'op' | 'in') || rnd(['om', 'op', 'in'] as const);
    const event = rnd(PREP_X.begint.events);
    const time = rnd(PREP_X.begint[p]);
    return {
      q: `${event} begint ___ ${time}.`,
      hint: timeHint(p, time),
      options: shuffle([p, ...wrongsFrom(TIME_PREPS, p)]),
      answer: p,
      why: timeWhy(p, time),
      facts: [`prep:time:${p}`]
    };
  }
  if (branch === 'fronted') {
    const targetP = target?.startsWith('prep:time:') ? target.slice('prep:time:'.length) : null;
    const p = (targetP as 'om' | 'op' | 'in') || rnd(['om', 'op', 'in'] as const);
    const time = rnd(PREP_X.fronted[p]);
    const act = rnd(PREP_X.fronted.activities);
    const capP = p.charAt(0).toUpperCase() + p.slice(1);
    return {
      q: `___ ${time} ${act}.`,
      hint: timeHint(p, time),
      options: shuffle([capP, ...wrongsFrom(TIME_PREPS.map((x) => x.charAt(0).toUpperCase() + x.slice(1)), capP)]),
      answer: capP,
      why: timeWhy(p, time),
      facts: [`prep:time:${p}`]
    };
  }
  const f = fixedTarget || rnd(PREP);
  return {
    q: f.q,
    hint: f.en,
    options: shuffle([f.a, ...f.w]),
    answer: f.a,
    why: f.why,
    facts: [`prep:${f.id}`]
  };
}

function hasRelation(branch: string, p: string): boolean {
  const g = PREP_X[branch as 'lying' | 'hanging' | 'living'];
  return g.relations.some((r) => r.p === p);
}

function timeHint(p: string, time: string): string {
  if (p === 'om') return 'clock time';
  if (p === 'op') return /\d/.test(time) ? 'date' : 'day of the week';
  return /lente|zomer|herfst|winter/.test(time) ? 'season' : /^\d+$/.test(time) ? 'year' : 'month';
}

function timeWhy(p: string, time: string): string {
  if (p === 'om') return `Clock times take om: om ${time}.`;
  if (p === 'op') return /\d/.test(time) ? `Dates take op: op ${time}.` : `Days take op: op ${time}.`;
  return /lente|zomer|herfst|winter/.test(time)
    ? `Seasons take in: in ${time}.`
    : /^\d+$/.test(time)
      ? `Years take in: in ${time}.`
      : `Months take in: in ${time}.`;
}
