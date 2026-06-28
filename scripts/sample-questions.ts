import { GEN } from '../src/generators';
const topics = ['modal','negation','pronouns','comparative','separable','omte','dehet','diminutive','prepositions','passive','conjrel','imperfectum','present','perfect','plural','wordorder','er'];
for (const t of topics) {
  console.log('== ' + t);
  for (let i = 0; i < 4; i++) {
    const q = GEN[t]();
    console.log('  Q:', q.q, '| A:', q.answer, '| opts:', q.options.join(' / '));
  }
}
