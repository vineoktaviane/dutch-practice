import type { Generator } from '../types';
import {
  NOUNS,
  WB,
  countable
} from '../data';
import { dehet } from './dehet';
import { plural } from './plural';

export const GEN: Record<string, Generator> = {
  dehet,
  plural
};

/** Real combination counts per generator, mirroring the reference app. */
export function counts(): Record<string, number> {
  const c: Record<string, number> = {};
  // frames x nouns, plus demonstrative frames x nouns
  c.dehet = NOUNS.length * (WB.dehet_frames.article.length + WB.dehet_frames.demonstrative.length);
  c.plural = countable.length * WB.common.numerals.length;
  return c;
}

export const CNT = counts();
export const TOTAL = Object.values(CNT).reduce((a, b) => a + b, 0);
