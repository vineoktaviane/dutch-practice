import { COMP, DIM, ER, IMPERF, MODALS, NOUNS, PERF, PREP, PRON, SEP, VERBS, countable } from '../data';

/**
 * The fact identity layer. Every learnable unit gets a stable ID:
 *   noun:<nl>:gender          = which article (dehet topic)
 *   noun:<nl>:plural          = plural form
 *   verb:<inf>:present        = present-tense conjugation
 *   verb:<inf>:participle     = past participle
 *   verb:<inf>:aux            = hebben or zijn
 *   modal:<inf>:conjugation   = modal person forms
 *   poss:<person> / objpron:<person> = pronoun forms
 *   comp:<base>:comparative / :superlative
 *   sep:<inf>:split / :participle / :subclause
 *   rule:<topic>:<name>       = grammar rules with no lexical anchor
 */

/** "zij (she)" → "zij-she" so fact IDs stay colon-delimited and space-free. */
export const personSlug = (p: string): string => p.replace(' (she)', '-she').replace(' (they)', '-they');

/** Every schedulable fact, grouped by the topic whose generator renders it. */
export function allFacts(): Record<string, string[]> {
  return {
    dehet: [...NOUNS.map((n) => `noun:${n.nl}:gender`), 'rule:dehet:demonstrative'],
    plural: countable.map((n) => `noun:${n.nl}:plural`),
    adj: ['rule:adj:def', 'rule:adj:plur', 'rule:adj:indef-de', 'rule:adj:indef-het'],
    present: [...VERBS.map((v) => `verb:${v.inf}:present`), 'rule:present:inversion'],
    perfect: [
      ...PERF.map((v) => `verb:${v.inf}:participle`),
      ...PERF.map((v) => `verb:${v.inf}:aux`),
      'rule:perfect:kofschip'
    ],
    modal: [...MODALS.map((m) => `modal:${m.inf}:conjugation`), 'rule:modal:structure'],
    wordorder: ['rule:wordorder:inversion', 'rule:wordorder:tmp', 'rule:wordorder:sub'],
    negation: ['rule:negation:geen', 'rule:negation:niet'],
    pronouns: [
      ...PRON.possessives.map((x) => `poss:${personSlug(x.p)}`),
      ...PRON.object_pronouns.map((x) => `objpron:${personSlug(x.p)}`)
    ],
    comparative: [
      ...COMP.map((c) => `comp:${c.b}:comparative`),
      ...COMP.map((c) => `comp:${c.b}:superlative`),
      'rule:comparative:dan-als'
    ],
    separable: SEP.flatMap((v) => [
      `sep:${v.inf}:split`,
      `sep:${v.inf}:participle`,
      `sep:${v.inf}:subclause`,
      `sep:${v.inf}:modal`
    ]),
    imperfectum: [...IMPERF.map((v) => `verb:${v.inf}:imperfectum`), 'rule:imperfectum:te-de'],
    er: [
      'rule:er:existential',
      'rule:er:quantity',
      'rule:er:locative',
      'rule:er:preposition',
      ...[...new Set(ER.prepositional.map((f) => `er:prep:${f.prep}`))]
    ],
    conjrel: ['rule:relative:die-dat', 'rule:relative:wat', 'rule:conj:want-omdat', 'rule:conj:toen-als'],
    omte: ['rule:omte:purpose', 'rule:omte:te-verbs', 'rule:omte:separable'],
    diminutive: [...DIM.map((d) => `dim:${d.nl}`), 'rule:diminutive:het', 'rule:diminutive:plural'],
    prepositions: [
      ...PREP.map((f) => `prep:${f.id}`),
      ...['op', 'in', 'onder', 'naast', 'voor', 'achter', 'bij', 'tussen', 'aan', 'boven'].map(
        (p) => `prep:place:${p}`
      ),
      'prep:time:om',
      'prep:time:op',
      'prep:time:in'
    ],
    passive: ['rule:passive:worden', 'rule:passive:tense', 'rule:passive:door']
  };
}

/** Which topic's generator can render a fresh question for this fact. */
export function topicForFact(fact: string): string | null {
  if (fact.startsWith('noun:')) return fact.endsWith(':gender') ? 'dehet' : 'plural';
  if (fact.startsWith('verb:')) {
    if (fact.endsWith(':present')) return 'present';
    if (fact.endsWith(':imperfectum')) return 'imperfectum';
    return 'perfect';
  }
  if (fact.startsWith('modal:')) return 'modal';
  if (fact.startsWith('poss:') || fact.startsWith('objpron:')) return 'pronouns';
  if (fact.startsWith('comp:')) return 'comparative';
  if (fact.startsWith('sep:')) return 'separable';
  if (fact.startsWith('dim:')) return 'diminutive';
  if (fact.startsWith('er:prep:')) return 'er';
  if (fact.startsWith('prep:')) return 'prepositions';
  if (fact.startsWith('rule:')) {
    const topic = fact.split(':')[1];
    if (topic === 'relative' || topic === 'conj') return 'conjrel';
    if (
      [
        'dehet',
        'adj',
        'present',
        'perfect',
        'modal',
        'wordorder',
        'negation',
        'comparative',
        'imperfectum',
        'er',
        'omte',
        'diminutive',
        'passive'
      ].includes(topic)
    )
      return topic;
  }
  return null;
}
