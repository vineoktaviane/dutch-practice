/** Contract every generator must honour. */
export interface Question {
  q: string;
  hint: string;
  options: string[];
  answer: string;
  /** One-line rule explanation shown after answering. */
  why: string;
  /**
   * Stable IDs of the underlying facts this question exercises
   * (e.g. "noun:huis:gender", "verb:kopen:participle"). The SRS layer
   * schedules these facts, never the rendered question. First entry is
   * the primary fact.
   */
  facts: string[];
  /**
   * Extra answers accepted in typed mode, beyond `answer` itself
   * (e.g. unstressed pronoun variants: mij/me). Hand-curated per question.
   */
  accept?: string[];
}

/**
 * Generators render a random question, or, given a fact ID they own,
 * a fresh question exercising exactly that fact (used by review mode).
 */
export type Generator = (target?: string) => Question;

export type Gender = 'de' | 'het';
export type Aux = 'hebben' | 'zijn';
/** p person, a animal, t thing, l place, f food */
export type NounCategory = 'p' | 'a' | 't' | 'l' | 'f';

export interface Noun {
  nl: string;
  en: string;
  g: Gender;
  /** null = mass noun (no plural) */
  pl: string | null;
  c: NounCategory;
}

export interface Adjective {
  b: string;
  e: string;
  en: string;
  /** allowed noun categories, e.g. "patlf" */
  cats: string;
}

export interface PresentVerb {
  inf: string;
  stem: string;
  t: string;
  en: string;
  compl: string;
}

export interface PerfectVerb {
  inf: string;
  part: string;
  aux: Aux;
  compl: string;
  /** weak-regular flag for the 't kofschip drill */
  kof: boolean;
}

export interface Modal {
  inf: string;
  en: string;
  ik: string;
  jij: string;
  hij: string;
  pl: string;
}

export interface SeparableVerb {
  inf: string;
  /** the particle, e.g. "op" in opstaan */
  part: string;
  stem: string;
  t: string;
  /** past participle, e.g. "opgestaan" */
  pp: string;
  aux: Aux;
  en: string;
  compl: string;
}

export interface Comparative {
  b: string;
  c: string;
  s: string;
  en: string;
  /** attributive comparative (comparative + e), null where it does not exist */
  ce: string | null;
}

export type SubjectSlot = 'ik' | 't' | 'pl';

export interface Subject {
  p: string;
  slot: SubjectSlot;
  /** pronoun to render when p carries a gloss like "zij (she)" */
  pron?: string;
}

export type AuxForms = Record<Aux, { ik: string; t: string; jij: string; pl: string }>;

export interface WordOrderClause {
  s: string;
  v: string;
  rest: string;
}

export interface WordOrderSubPred {
  txt: string;
  v: 'zijn' | 'hebben';
}

export interface WordOrderSubSubj {
  p: string;
  zijn: string;
  hebben: string;
}

export interface WordOrderBank {
  time_fronts: string[];
  clauses: WordOrderClause[];
  tmp: { time: string[]; manner: string[]; place: string[] };
  sub: { main: string[]; conj: string[]; pred: WordOrderSubPred[]; subj: WordOrderSubSubj[] };
}

export interface NegationSubject {
  p: string;
  w: string;
  g: string;
  v: string;
}

export interface NegationBank {
  days: string[];
  subjects: NegationSubject[];
}

export interface Possessive {
  p: string;
  de: string;
  het: string;
}

export interface ObjectPronoun {
  p: string;
  o: string;
}

export interface PronounBank {
  possessives: Possessive[];
  object_pronouns: ObjectPronoun[];
  object_templates: string[];
}

export interface ImperfectumVerb {
  inf: string;
  sg: string;
  pl: string;
  weak: boolean;
  /** a hand-curated wrong form learners typically produce */
  fake: string;
  en: string;
  compl: string;
}

export interface ErFrame {
  q: string;
  en: string;
}

export interface ErPrepFrame extends ErFrame {
  prep: string;
  merged: string;
}

export interface ErExistentialTemplate {
  v: string;
  end: string;
  /** noun categories the template makes sense with */
  cats: string;
}

export interface ErBank {
  existential: ErFrame[];
  quantity: ErFrame[];
  locative: ErFrame[];
  prepositional: ErPrepFrame[];
  existential_templates: ErExistentialTemplate[];
}

export interface WantOmdatPair {
  main: string;
  /** clause in V2 order (for want) */
  v2: string;
  /** same clause in verb-final order (for omdat) */
  vf: string;
}

export interface ToenAlsFrame {
  q: string;
  a: 'Toen' | 'Als';
  en: string;
}

export interface ConjRelBank {
  relative_thing_frames: string[];
  relative_person_frames: string[];
  relative_plural_frames: string[];
  wat: ErFrame[];
  want_omdat: WantOmdatPair[];
  toen_als: ToenAlsFrame[];
}

export interface OmteTeVerb {
  inf: string;
  ik: string;
  hij: string;
  wij: string;
  /** verb requires niet in the template (hoeven) */
  neg: boolean;
}

export interface OmteBank {
  purpose_mains: string[];
  purpose_pairs: { obj: string; verb: string }[];
  te_verbs: OmteTeVerb[];
}

export interface Diminutive {
  nl: string;
  dim: string;
  /** hand-curated wrong suffix form */
  fake: string;
  rule: 'je' | 'tje' | 'pje' | 'kje' | 'etje';
  en: string;
  /** plural of the diminutive (always -s) */
  dimpl: string;
  note?: string;
}

export interface CapFrame {
  t: string;
  cap: boolean;
}

export interface DemFrame {
  t: string;
  kind: 'this' | 'that';
  de: string;
  het: string;
}

export interface DehetFrames {
  article: CapFrame[];
  demonstrative: DemFrame[];
}

export interface DiminutiveFrames {
  form: string[];
  article: CapFrame[];
}

export interface PrepRelation {
  p: string;
  en: string;
  places: string[];
}

export interface PrepositionsX {
  lying: { objects: string[]; relations: PrepRelation[] };
  hanging: { objects: string[]; relations: PrepRelation[] };
  begint: { events: string[]; om: string[]; op: string[]; in: string[] };
  fronted: { activities: string[]; op: string[]; in: string[]; om: string[] };
  living: { subjects: string[]; relations: PrepRelation[] };
}

export interface PassivePair {
  t: string;
  part: string;
}

export interface CommonLists {
  numerals: string[];
  present_fronts: string[];
  past_fronts: string[];
  imperf_fronts: string[];
}

export interface PrepFrame {
  id: string;
  q: string;
  a: string;
  w: string[];
  en: string;
  why: string;
}

export interface PassiveFrame {
  q: string;
  a: string;
  w: string[];
  en: string;
  why: string;
}

export interface PassiveBank {
  worden_form: PassiveFrame[];
  tense: PassiveFrame[];
  door: PassiveFrame[];
  pairs_sg: PassivePair[];
  pairs_pl: PassivePair[];
  advs_present: string[];
  advs_past: string[];
  agents: string[];
}

export interface WordBanks {
  nouns: Noun[];
  adjectives: Adjective[];
  verbs_present: PresentVerb[];
  verbs_perfect: PerfectVerb[];
  modals: Modal[];
  separable_verbs: SeparableVerb[];
  comparatives: Comparative[];
  subjects: Subject[];
  aux_forms: AuxForms;
  word_order: WordOrderBank;
  negation: NegationBank;
  pronouns: PronounBank;
  verbs_imperfectum: ImperfectumVerb[];
  er: ErBank;
  conjrel: ConjRelBank;
  omte: OmteBank;
  diminutives: Diminutive[];
  prepositions: PrepFrame[];
  passive: PassiveBank;
  common: CommonLists;
  dehet_frames: DehetFrames;
  diminutive_frames: DiminutiveFrames;
  prepositions_x: PrepositionsX;
}

export interface Topic {
  id: string;
  title: string;
  blurb: string;
  learn_html: string;
}

export interface TopicStats {
  a: number;
  c: number;
}

export interface Stats {
  answered: number;
  correct: number;
  byTopic: Record<string, TopicStats>;
}
