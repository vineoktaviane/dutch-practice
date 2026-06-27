const fs = require('fs');
const html = fs.readFileSync('dutch-grammar.html','utf8');
const script = html.split('<script>')[1].split('</script>')[0];

const stubEl = () => ({ textContent:'', innerHTML:'', addEventListener(){}, querySelectorAll(){return[]}, querySelector(){return null} });
global.document = { getElementById: () => stubEl(), addEventListener(){} };
global.window = { storage: { get: async()=>null, set: async()=>null } };

eval(script.replace('loadStats();','').replace('renderHome();','')
  + '\n;global.__X={NOUNS,ADJS,VERBS,PERF,SEP,COMP,GEN,counts};');
const {NOUNS,GEN,counts} = global.__X;

const names = NOUNS.map(n=>n.nl);
const dupes = names.filter((n,i)=>names.indexOf(n)!==i);
console.log('nouns:', NOUNS.length, 'dupes:', dupes);
console.log('de:', NOUNS.filter(n=>n.g==='de').length, 'het:', NOUNS.filter(n=>n.g==='het').length);

const c = counts();
console.log('per-topic counts:', c);
console.log('TOTAL:', Object.values(c).reduce((a,b)=>a+b,0));

let fails = 0;
for(const [name,gen] of Object.entries(GEN)){
  const seen = new Set();
  for(let i=0;i<3000;i++){
    try{
      const q = gen();
      if(!q.q || !q.options || q.options.length<2) throw new Error('bad shape: '+JSON.stringify(q));
      if(!q.options.includes(q.answer)) throw new Error('answer not in options: '+JSON.stringify(q));
      if(new Set(q.options).size !== q.options.length) throw new Error('duplicate options: '+JSON.stringify(q));
      if(!q.why) throw new Error('missing why');
      seen.add(q.q+'|'+q.answer);
    }catch(e){ if(fails<10) console.log('FAIL['+name+']:', e.message.slice(0,200)); fails++; }
  }
  console.log(name, '→ unique in 3000 draws:', seen.size);
}
console.log('total failures:', fails);
