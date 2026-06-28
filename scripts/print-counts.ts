import { CNT, TOTAL } from '../src/generators';
const rows = Object.entries(CNT).sort((a, b) => a[1] - b[1]);
for (const [t, n] of rows) console.log(String(n).padStart(6), t);
console.log('TOTAL:', TOTAL.toLocaleString('en-US'));
