import type { Question, Stats } from '../types';
import type { Settings } from '../platform/storage';
import type { FactState } from '../srs/sm2';

export interface View {
  page: 'home' | 'topic' | 'review';
  topic?: string;
  tab?: 'learn' | 'quiz';
}

/* the session is chunked into small rounds so there is always a
   near-term goal; the ring in the quiz footer fills as a round fills */
export const ROUND_SIZE = 10;

/* All mutable app state, in one object on purpose: an ES module's exported
   bindings are read-only where they are imported, so a bare `let` here could
   never be reassigned from another module.
   Do not destructure S - resetSession() replaces whole sub-objects, and a
   destructured copy would keep counting into the orphan. */
export const S = {
  stats: { answered: 0, correct: 0, byTopic: {} } as Stats,
  view: { page: 'home' } as View,
  session: { n: 0, ok: 0 },
  round: { n: 0, ok: 0 },
  current: null as Question | null,
  lastQ: '',
  reviewQueue: [] as string[],
  settings: { typed: {} } as Settings
};

/* SRS: fact ID → scheduling state, mirrored to IndexedDB. Only ever mutated,
   never reassigned, so it stays a plain const. */
export const factStates = new Map<string, FactState>();

/** settings/stats context for the current quiz screen */
export const ctxKey = (): string => (S.view.page === 'review' ? 'review' : S.view.topic!);

export const typedModeOn = (): boolean => !!S.settings.typed[ctxKey()];

export function resetSession(): void {
  S.session = { n: 0, ok: 0 };
  S.round = { n: 0, ok: 0 };
}
