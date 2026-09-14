import { GEN } from '../src/generators';

for (const t of Object.keys(GEN)) {
  console.log('== ' + t);
  for (let i = 0; i < 4; i++) {
    const q = GEN[t]();
    console.log('  Q:', q.q, '| A:', q.answer, '| opts:', q.options.join(' / '));
  }
}
