import type { Generator } from '../types';
import {
  ADJ_PAIRS,
  ADJS,
  COMP,
  MODALS,
  NEG,
  NOUNS,
  PERF,
  SEP,
  SUBJ,
  VERBS,
  WB,
  WO,
  countable
} from '../data';
import { adj } from './adj';
import { ATTR_NOUNS, COMP_SUBJECTS, SUP_NOUNS, comparative } from './comparative';
import { dehet } from './dehet';
import { MODAL_COMPLS, MODAL_TIMES, modal, modalTimeFree } from './modal';
import { GEEN_SUBJECTS, NIET_POSSESSIONS, negation } from './negation';
import { perfect } from './perfect';
import { plural } from './plural';
import { present } from './present';
import { SUB_ADVS, separable, sepTimeFree } from './separable';
import { wordorder } from './wordorder';

export const GEN: Record<string, Generator> = {
  dehet,
  plural,
  adj,
  present,
  perfect,
  modal,
  wordorder,
  negation,
  comparative,
  separable
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
  c.wordorder =
    WO.time_fronts.length * WO.clauses.length +
    WO.tmp.time.length * WO.tmp.manner.length * WO.tmp.place.length +
    WO.sub.main.length * WO.sub.conj.length * WO.sub.pred.length * WO.sub.subj.length;
  c.negation =
    NOUNS.length * GEEN_SUBJECTS.length +
    NEG.subjects.length * (NEG.days.length + NOUNS.filter((x) => x.c === 'l').length + ADJS.length) +
    NIET_POSSESSIONS.length;
  const ceCount = COMP.filter((x) => x.ce).length;
  c.comparative =
    COMP.length * (2 * COMP_SUBJECTS.length) +
    COMP.length * (SUP_NOUNS.length * 2) +
    COMP.length * 2 +
    ceCount * ATTR_NOUNS.length;
  // split + participle branches, subclause x adverbs, modal branch x modals
  c.separable =
    SEP.length * 8 * (2 + MODALS.length) +
    8 * SEP.reduce((s, v) => s + (sepTimeFree(v.compl) ? SUB_ADVS.length : 1), 0);
  return c;
}

export const CNT = counts();
export const TOTAL = Object.values(CNT).reduce((a, b) => a + b, 0);
