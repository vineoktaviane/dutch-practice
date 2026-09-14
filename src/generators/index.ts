import type { Generator } from '../types';
import {
  ADJ_PAIRS,
  ADJS,
  COMP,
  CONJREL,
  DIM,
  ER,
  IMPERF,
  MODALS,
  NEG,
  NOUNS,
  OMTE,
  PASSIVE,
  PERF,
  PREP,
  PRON,
  SEP,
  SUBJ,
  VERBS,
  WB,
  WO,
  countable
} from '../data';
import { adj } from './adj';
import { ATTR_NOUNS, COMP_SUBJECTS, SUP_NOUNS, comparative } from './comparative';
import { conjrel } from './conjrel';
import { dehet } from './dehet';
import { diminutive } from './diminutive';
import { er } from './er';
import { imperfectum } from './imperfectum';
import { MODAL_COMPLS, MODAL_TIMES, modal, modalTimeFree } from './modal';
import { GEEN_SUBJECTS, NIET_POSSESSIONS, negation } from './negation';
import { OMTE_SUBJECTS, omte } from './omte';
import { passive } from './passive';
import { perfect } from './perfect';
import { plural } from './plural';
import { prepositions } from './prepositions';
import { present } from './present';
import { POSS_FRAMES, pronouns } from './pronouns';
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
  pronouns,
  comparative,
  separable,
  imperfectum,
  er,
  conjrel,
  omte,
  diminutive,
  prepositions,
  passive
};

/** Real combination counts per generator, mirroring the reference app. */
export function counts(): Record<string, number> {
  const c: Record<string, number> = {};
  const woX = WB.prepositions_x;
  const relPlaces = (rs: { places: string[] }[]) => rs.reduce((s, r) => s + r.places.length, 0);

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
    MODALS.length * SUBJ.length * VERBS.reduce((s, v) => s + (modalTimeFree(v.compl) ? MODAL_TIMES.length : 1), 0);
  c.wordorder =
    WO.time_fronts.length * WO.clauses.length +
    WO.tmp.time.length * WO.tmp.manner.length * WO.tmp.place.length +
    WO.sub.main.length * WO.sub.conj.length * WO.sub.pred.length * WO.sub.subj.length;
  c.negation =
    NOUNS.length * GEEN_SUBJECTS.length +
    NEG.subjects.length * (NEG.days.length + NOUNS.filter((x) => x.c === 'l').length + ADJS.length) +
    NIET_POSSESSIONS.length;
  c.pronouns =
    PRON.possessives.length * NOUNS.length * POSS_FRAMES.length +
    PRON.object_pronouns.length * PRON.object_templates.length;
  const ceCount = COMP.filter((x) => x.ce).length;
  c.comparative =
    COMP.length * (2 * COMP_SUBJECTS.length) +
    COMP.length * (SUP_NOUNS.length * 2) +
    COMP.length * 2 +
    ceCount * ATTR_NOUNS.length;
  // split + participle branches, subclause x adverbs, modal branch x modals
  c.separable =
    SEP.length * SUBJ.length * (2 + MODALS.length) +
    SUBJ.length * SEP.reduce((s, v) => s + (sepTimeFree(v.compl) ? SUB_ADVS.length : 1), 0);
  c.imperfectum =
    IMPERF.length * 5 * WB.common.imperf_fronts.length + IMPERF.filter((v) => v.weak).length;
  const erTemplateCombos = ER.existential_templates.reduce(
    (s, t) => s + countable.filter((n) => t.cats.includes(n.c)).length,
    0
  );
  c.er =
    ER.existential.length +
    erTemplateCombos +
    ER.quantity.length +
    countable.filter((x) => 'taf'.includes(x.c)).length * WB.common.numerals.length * 2 +
    ER.locative.length +
    ER.prepositional.length;
  c.conjrel =
    NOUNS.filter((n) => n.c === 't' || n.c === 'f').length * CONJREL.relative_thing_frames.length +
    NOUNS.filter((n) => n.c === 'p' || n.c === 'a').length * CONJREL.relative_person_frames.length +
    countable.length * CONJREL.relative_plural_frames.length +
    CONJREL.wat.length +
    CONJREL.want_omdat.length * 2 +
    CONJREL.toen_als.length;
  c.omte =
    OMTE.purpose_mains.length * OMTE.purpose_pairs.length +
    OMTE.te_verbs.length * OMTE_SUBJECTS.length * VERBS.length +
    OMTE.te_verbs.filter((t) => !t.neg).length * OMTE_SUBJECTS.length * SEP.length;
  c.diminutive =
    DIM.length *
    (WB.diminutive_frames.form.length + WB.diminutive_frames.article.length + WB.common.numerals.length);
  c.prepositions =
    PREP.length +
    woX.lying.objects.length * relPlaces(woX.lying.relations) +
    woX.hanging.objects.length * relPlaces(woX.hanging.relations) +
    woX.begint.events.length * (woX.begint.om.length + woX.begint.op.length + woX.begint.in.length) +
    woX.fronted.activities.length * (woX.fronted.om.length + woX.fronted.op.length + woX.fronted.in.length) +
    woX.living.subjects.length * relPlaces(woX.living.relations);
  const pairs = PASSIVE.pairs_sg.length + PASSIVE.pairs_pl.length;
  c.passive =
    pairs * (PASSIVE.advs_present.length + PASSIVE.advs_past.length) * 2 +
    PASSIVE.worden_form.length +
    PASSIVE.tense.length +
    PASSIVE.door.length +
    pairs * PASSIVE.agents.length;
  return c;
}

export const CNT = counts();
export const TOTAL = Object.values(CNT).reduce((a, b) => a + b, 0);
