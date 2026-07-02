import type { Generator } from '../types';
import {
  ADJ_PAIRS,
  MODALS,
  NOUNS,
  PERF,
  SUBJ,
  VERBS,
  WB,
  countable
} from '../data';
import { adj } from './adj';
import { dehet } from './dehet';
import { MODAL_COMPLS, MODAL_TIMES, modal, modalTimeFree } from './modal';
import { perfect } from './perfect';
import { plural } from './plural';
import { present } from './present';

export const GEN: Record<string, Generator> = {
  dehet,
  plural,
  adj,
  present,
  perfect,
  modal
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
  const regs = PERF.filter(
    (p) => p.part.startsWith('ge') && (p.part.endsWith('t') || p.part.endsWith('d'))
  ).length;
  // (participle + aux) x (normal + fronted shapes) + kofschip
  c.perfect = PERF.length * SUBJ.length * (1 + WB.common.past_fronts.length) * 2 + regs;
  // conjugation x complement frames, plus structure x subjects x time adverbs
  c.modal =
    MODALS.length * SUBJ.length * MODAL_COMPLS.length +
    MODALS.length * 6 * VERBS.reduce((s, v) => s + (modalTimeFree(v.compl) ? MODAL_TIMES.length : 1), 0);
  return c;
}

export const CNT = counts();
export const TOTAL = Object.values(CNT).reduce((a, b) => a + b, 0);
