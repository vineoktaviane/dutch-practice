import type { Question } from '../types';
import { COMMON, ER, countable } from '../data';
import { rnd, shuffle } from '../rng';

type Branch = 'existential' | 'quantity' | 'locative' | 'prep';

export function er(target?: string): Question {
  let branch: Branch;
  let targetPrep: string | undefined;
  if (target === 'rule:er:existential') branch = 'existential';
  else if (target === 'rule:er:quantity') branch = 'quantity';
  else if (target === 'rule:er:locative') branch = 'locative';
  else if (target === 'rule:er:preposition') branch = 'prep';
  else if (target?.startsWith('er:prep:')) {
    targetPrep = target.slice('er:prep:'.length);
    branch = 'prep';
  } else {
    const roll = Math.random();
    branch = roll < 0.3 ? 'existential' : roll < 0.5 ? 'quantity' : roll < 0.65 ? 'locative' : 'prep';
  }

  if (branch === 'existential') {
    // half fixed frames, half templated over the noun bank
    const useTemplate = Math.random() < 0.5;
    let q: string, hint: string;
    if (useTemplate) {
      const t = rnd(ER.existential_templates);
      const eligible = countable.filter((n) => t.cats.includes(n.c));
      const n = rnd(eligible);
      q = `___ ${t.v} een ${n.nl} ${t.end}.`;
      hint = `(${n.en})`;
    } else {
      const f = rnd(ER.existential);
      q = f.q;
      hint = f.en;
    }
    return {
      q,
      hint,
      options: shuffle(['Er', 'Het', 'Daar']),
      answer: 'Er',
      why: 'A sentence with an indefinite subject (een kat, veel mensen, geen melk) starts with ER: Er zit een kat in de tuin.',
      facts: ['rule:er:existential']
    };
  }
  if (branch === 'quantity') {
    const useTemplate = Math.random() < 0.7;
    let q: string, hint: string;
    if (useTemplate) {
      const n = rnd(countable.filter((x) => 'taf'.includes(x.c)));
      const num = rnd(COMMON.numerals);
      const asker = rnd([
        { ask: 'zie je', reply: 'Ik zie' },
        { ask: 'heb je', reply: 'Ik heb' }
      ]);
      q = `Hoeveel ${n.pl} ${asker.ask}? ${asker.reply} ___ ${num}.`;
      hint = `(${n.en})`;
    } else {
      const f = rnd(ER.quantity);
      q = f.q;
      hint = f.en;
    }
    return {
      q,
      hint,
      options: shuffle(['er', 'ze', 'die']),
      answer: 'er',
      why: 'With a number or quantity, ER replaces the noun: Ik heb er twee. The noun itself is never repeated.',
      facts: ['rule:er:quantity']
    };
  }
  if (branch === 'locative') {
    const f = rnd(ER.locative);
    return {
      q: f.q,
      hint: f.en,
      options: shuffle(['er', 'het']),
      answer: 'er',
      why: 'Unstressed "there" is ER: Ik woon er al tien jaar. "Het" can never refer to a place.',
      facts: ['rule:er:locative']
    };
  }
  const f = (targetPrep && ER.prepositional.find((x) => x.prep === targetPrep)) || rnd(ER.prepositional);
  const wrongSplit = `er ${f.prep}`;
  const wrongHet = `${f.prep} het`;
  return {
    q: f.q,
    hint: f.en,
    options: shuffle([f.merged, wrongSplit, wrongHet]),
    answer: f.merged,
    why:
      f.prep === 'met'
        ? `Er + preposition merge into ONE word, and met changes to mee: ermee. (Same for tot: ertoe.)`
        : `Er + preposition merge into ONE word: er + ${f.prep} = ${f.merged}. Never "${f.prep} het" for things.`,
    facts: [`er:prep:${f.prep}`, 'rule:er:preposition']
  };
}
