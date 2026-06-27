/* Entry point. For now this only wires up the static shell in index.html;
   the topic grid and quiz loop land once the generators exist. */

const $ = (id: string) => document.getElementById(id)!;

$('hdrAnswered').textContent = '0';
$('hdrAcc').textContent = '-';
$('app').innerHTML = `<div class="home-intro"><h2>Coming soon</h2>
  <p>Grammar topics and practice questions are on the way.</p></div>`;
