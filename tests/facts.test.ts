import { describe, expect, it } from 'vitest';
import { GEN } from '../src/generators';
import { allFacts, topicForFact } from '../src/srs/facts';

// The identity layer is the whole Phase 2 feature: every fact
// must map back to a generator, and asking that generator for the fact must
// yield a question that actually exercises it.
const FACTS = allFacts();
const GLOBAL = new Set(Object.values(FACTS).flat());

describe('fact universe', () => {
  it('covers every topic with at least one fact', () => {
    expect(Object.keys(FACTS).sort()).toEqual(Object.keys(GEN).sort());
  });

  it('has no duplicate fact IDs across topics', () => {
    const all = Object.values(FACTS).flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it('maps every fact to the topic that owns it', () => {
    for (const [topic, facts] of Object.entries(FACTS)) {
      for (const f of facts) {
        expect(topicForFact(f), f).toBe(topic);
      }
    }
  });
});

describe.each(Object.entries(FACTS))('fact-targeted rendering: %s', (topic, facts) => {
  it('renders a fresh question for every fact of the topic (3 draws each)', () => {
    const gen = GEN[topic];
    for (const fact of facts) {
      for (let i = 0; i < 3; i++) {
        const q = gen(fact);
        const label = `[${fact}] ${JSON.stringify(q)}`;
        // full question contract still holds under targeting
        expect(q.options, label).toContain(q.answer);
        expect(new Set(q.options).size, label).toBe(q.options.length);
        expect(q.why, label).toBeTruthy();
        // and the question must exercise the requested fact
        expect(q.facts, label).toContain(fact);
        // every reported fact is a known, schedulable fact
        for (const f of q.facts) expect(GLOBAL.has(f), `unknown fact ${f} in ${label}`).toBe(true);
      }
    }
  });
});
