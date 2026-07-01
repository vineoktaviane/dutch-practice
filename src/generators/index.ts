import type { Generator } from '../types';
import {
  ADJ_PAIRS,
  NOUNS,
  SUBJ,
  VERBS,
  WB,
  countable
} from '../data';
import { adj } from './adj';
import { dehet } from './dehet';
import { plural } from './plural';
import { present } from './present';

export const GEN: Record<string, Generator> = {
  dehet,
  plural,
  adj,
  present
};

/** Real combination counts per generator, mirroring the reference app. */
export function counts(): Record<string, number> {
  const c: Record<string, number> = {};
  // frames x nouns, plus demonstrative frames x nouns
  c.dehet = NOUNS.length * (WB.dehet_frames.article.length + WB.dehet_frames.demonstrative.length);
  c.plural = countable.length * WB.common.numerals.length;
  c.adj = ADJ_PAIRS.reduce((s, [n]) => s + (n.pl ? 3 : 2), 0); // 3 contexts per pair
  // normal + 5 fronted shapes, + inversion type
  c.present = VERBS.length * SUBJ.length * (1 + WB.common.present_fronts.length) + VERBS.length;
  return c;
}

export const CNT = counts();
export const TOTAL = Object.values(CNT).reduce((a, b) => a + b, 0);
