import { describe, expect, it } from 'vitest';
import { CNT, GEN, TOTAL } from '../src/generators';
import { NOUNS } from '../src/data';
import { allFacts } from '../src/srs/facts';

const KNOWN_FACTS = new Set(Object.values(allFacts()).flat());

// Port of reference/generator-stress-test.js: run every generator 3,000×
// and validate the {q, hint, options, answer, why} contract on each draw.
const DRAWS = 3000;

describe('word bank sanity', () => {
  it('has no duplicate nouns', () => {
    const names = NOUNS.map((n) => n.nl);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dupes).toEqual([]);
  });

  it('has both genders well represented', () => {
    const de = NOUNS.filter((n) => n.g === 'de').length;
    const het = NOUNS.filter((n) => n.g === 'het').length;
    expect(de).toBeGreaterThan(50);
    expect(het).toBeGreaterThan(50);
    expect(de + het).toBe(NOUNS.length);
  });

  it('reports a question pool of thousands across all topics', () => {
    expect(Object.keys(CNT).sort()).toEqual(Object.keys(GEN).sort());
    expect(TOTAL).toBeGreaterThan(10000);
  });

  it('every topic offers at least 3000 question combinations', () => {
    for (const [topic, n] of Object.entries(CNT)) {
      expect(n, `count for ${topic}`).toBeGreaterThanOrEqual(3000);
    }
  });
});

describe.each(Object.entries(GEN))('generator %s', (name, gen) => {
  it(`survives ${DRAWS} draws with a valid question every time`, () => {
    const seen = new Set<string>();
    for (let i = 0; i < DRAWS; i++) {
      const q = gen();
      const label = `[${name} draw ${i}] ${JSON.stringify(q)}`;
      expect(q.q, label).toBeTruthy();
      expect(Array.isArray(q.options), label).toBe(true);
      expect(q.options.length, label).toBeGreaterThanOrEqual(2);
      expect(q.options, label).toContain(q.answer);
      expect(new Set(q.options).size, label).toBe(q.options.length);
      expect(q.why, label).toBeTruthy();
      // every question reports the facts it exercises, and only known ones
      expect(q.facts.length, label).toBeGreaterThanOrEqual(1);
      for (const f of q.facts) expect(KNOWN_FACTS.has(f), `unknown fact ${f} in ${label}`).toBe(true);
      seen.add(q.q + '|' + q.answer);
    }
    // a generator must actually generate variety, not one static question
    expect(seen.size).toBeGreaterThan(10);
  });
});
