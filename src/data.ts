import type { Noun, Topic, WordBanks } from './types';
import wordbanksJson from '../data/wordbanks.json';
import topicsJson from '../data/topics.json';
import glossaryJson from '../data/glossary.json';

export const WB = wordbanksJson as WordBanks;
export const TOPICS = topicsJson as Topic[];
/* simple explanations of grammar jargon, shown via the info buttons in Learn pages */
export const GLOSSARY = glossaryJson as Record<string, string>;

export const NOUNS = WB.nouns;
export const ADJS = WB.adjectives;
export const VERBS = WB.verbs_present;
export const PERF = WB.verbs_perfect;
export const MODALS = WB.modals;
export const SEP = WB.separable_verbs;
export const COMP = WB.comparatives;
export const SUBJ = WB.subjects;
export const AUXF = WB.aux_forms;
export const WO = WB.word_order;
export const NEG = WB.negation;
export const PRON = WB.pronouns;
export const IMPERF = WB.verbs_imperfectum;
export const ER = WB.er;
export const CONJREL = WB.conjrel;
export const OMTE = WB.omte;
export const DIM = WB.diminutives;
export const PREP = WB.prepositions;
export const PASSIVE = WB.passive;
export const COMMON = WB.common;
export const DEHET_FRAMES = WB.dehet_frames;
export const DIM_FRAMES = WB.diminutive_frames;
export const PREP_X = WB.prepositions_x;

export const countable = NOUNS.filter((n): n is Noun & { pl: string } => n.pl !== null);

function adjPairs(): [Noun, (typeof ADJS)[number]][] {
  const out: [Noun, (typeof ADJS)[number]][] = [];
  for (const n of NOUNS) {
    if (!['p', 'a', 't', 'l', 'f'].includes(n.c)) continue;
    for (const a of ADJS) {
      if (a.cats.includes(n.c)) out.push([n, a]);
    }
  }
  return out;
}

export const ADJ_PAIRS = adjPairs();
