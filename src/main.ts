import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import type { Question, Stats } from './types';
import { GLOSSARY, TOPICS } from './data';
import { CNT, GEN, TOTAL } from './generators';
import { loadFactStates, loadSettings, loadStats, saveFactState, saveSettings, saveStats, type Settings } from './storage';
import { rnd } from './rng';
import { newFactState, reviewFact, type FactState } from './srs/sm2';
import { allFacts, topicForFact } from './srs/facts';
import { charDiff, gradeTyped, isTypeable, normalizeAnswer } from './typed';
import { ICONS } from './icons';
import { canSpeakDutch, initSpeech, speakDutch, spokenText } from './speech';
import { playCorrect, playRoundComplete, playWrong, setSoundEnabled } from './sound';

/* per-topic card icon + accent colour */
const TOPIC_META: Record<string, { icon: string; color: string; soft: string }> = {
  dehet: { icon: 'tag', color: 'var(--brand)', soft: 'var(--brand-soft)' },
  plural: { icon: 'copies', color: 'var(--blue)', soft: 'var(--blue-soft)' },
  adj: { icon: 'sparkles', color: 'var(--teal)', soft: 'var(--teal-soft)' },
  present: { icon: 'clock', color: 'var(--violet)', soft: 'var(--violet-soft)' },
  perfect: { icon: 'history', color: 'var(--brand)', soft: 'var(--brand-soft)' },
  modal: { icon: 'key', color: 'var(--blue)', soft: 'var(--blue-soft)' },
  wordorder: { icon: 'updown', color: 'var(--teal)', soft: 'var(--teal-soft)' },
  negation: { icon: 'ban', color: 'var(--violet)', soft: 'var(--violet-soft)' },
  pronouns: { icon: 'users', color: 'var(--brand)', soft: 'var(--brand-soft)' },
  comparative: { icon: 'chart', color: 'var(--blue)', soft: 'var(--blue-soft)' },
  separable: { icon: 'scissors', color: 'var(--teal)', soft: 'var(--teal-soft)' },
  imperfectum: { icon: 'calendar', color: 'var(--violet)', soft: 'var(--violet-soft)' },
  er: { icon: 'mappin', color: 'var(--brand)', soft: 'var(--brand-soft)' },
  conjrel: { icon: 'link', color: 'var(--blue)', soft: 'var(--blue-soft)' },
  omte: { icon: 'target', color: 'var(--teal)', soft: 'var(--teal-soft)' },
  diminutive: { icon: 'shrink', color: 'var(--violet)', soft: 'var(--violet-soft)' },
  prepositions: { icon: 'box', color: 'var(--brand)', soft: 'var(--brand-soft)' },
  passive: { icon: 'swap', color: 'var(--blue)', soft: 'var(--blue-soft)' }
};

const ticon = (icon: string, color: string, soft: string) =>
  `<span class="ticon" style="color:${color};background:${soft}">${ICONS[icon]}</span>`;

/* =====================================================
   STATE
   ===================================================== */
let stats: Stats = { answered: 0, correct: 0, byTopic: {} };
interface View {
  page: 'home' | 'topic' | 'review';
  topic?: string;
  tab?: 'learn' | 'quiz';
}
let view: View = { page: 'home' };
let session = { n: 0, ok: 0 };
/* the session is chunked into small rounds so there is always a
   near-term goal; the ring in the quiz footer fills as a round fills */
const ROUND_SIZE = 10;
let round = { n: 0, ok: 0 };
let current: Question | null = null;
let lastQ = '';

/* SRS: fact ID → scheduling state, mirrored to IndexedDB */
const factStates = new Map<string, FactState>();
let reviewQueue: string[] = [];

/* user settings (typed-answer mode per context) */
let settings: Settings = { typed: {} };

/** settings/stats context for the current quiz screen */
function ctxKey(): string {
  return view.page === 'review' ? 'review' : view.topic!;
}

function typedModeOn(): boolean {
  return !!settings.typed[ctxKey()];
}

function dueFactIds(now: number): string[] {
  return [...factStates.values()]
    .filter((s) => s.due <= now)
    .sort((a, b) => a.due - b.due)
    .map((s) => s.id);
}

function nextDueText(now: number): string {
  let min = Infinity;
  for (const s of factStates.values()) if (s.due < min) min = s.due;
  if (min === Infinity) return '';
  const h = Math.ceil((min - now) / 3_600_000);
  if (h <= 1) return 'next review within the hour';
  if (h < 24) return `next review in ${h}h`;
  return `next review in ${Math.ceil(h / 24)}d`;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const $ = (id: string) => document.getElementById(id)!;
const app = $('app');

function paintHeader(): void {
  $('hdrAnswered').textContent = String(stats.answered);
  $('hdrAcc').textContent = stats.answered
    ? Math.round((stats.correct / stats.answered) * 100) + '%'
    : '-';
}

/* =====================================================
   RENDERING
   ===================================================== */
function renderHome(): void {
  session = { n: 0, ok: 0 };
  round = { n: 0, ok: 0 };
  let html = `<div class="home-intro"><h2>Pick a topic</h2>
  <p>First read the rules (Learn), then practise them (Practice). Mixed Practice tests everything at once: that is the best way to remember.</p></div><div class="grid">`;
  const now = Date.now();
  const due = dueFactIds(now).length;
  const tracked = factStates.size;
  const revMeta = tracked
    ? `<b>${due}</b> due now · <b>${tracked}</b> facts tracked${due === 0 ? ` · ${nextDueText(now)}` : ''}`
    : `Nothing tracked yet`;
  html += `<div class="tcard revcard">${ticon('refresh', 'var(--brand)', '#FFE3D0')}
    <h3>Review</h3><p>${
      tracked
        ? 'Spaced repetition: the app brings back what you practised, just before you would forget it. Wrong answers come back sooner.'
        : 'Answer questions in any Practice mode. The app then plans smart reviews for you here.'
    }</p>
    <div class="meta">${revMeta}</div>
    <div class="acts"><button class="go" data-review style="flex:1" ${due === 0 ? 'disabled' : ''}>Review now</button></div></div>`;
  for (const t of TOPICS) {
    const bt = stats.byTopic[t.id] || { a: 0, c: 0 };
    const m = TOPIC_META[t.id] ?? { icon: 'tag', color: 'var(--blue)', soft: 'var(--blue-soft)' };
    html += `<div class="tcard">${ticon(m.icon, m.color, m.soft)}
      <h3>${t.title}</h3><p>${t.blurb}</p>
      <div class="meta"><b>${CNT[t.id].toLocaleString('en-US')}</b> questions${bt.a ? ` · you: ${bt.c}/${bt.a} correct` : ''}</div>
      <div class="acts"><button data-learn="${t.id}">Learn</button><button class="go" data-quiz="${t.id}">Practice</button></div></div>`;
  }
  const mixBt = stats.byTopic['mix'] || { a: 0, c: 0 };
  html += `<div class="tcard mixcard">${ticon('shuffle', '#FFC9A8', 'rgba(255,255,255,.12)')}
    <h3>Mixed Practice</h3><p>Random questions from all topics. Harder, because you do not know which rule is tested. Just like real Dutch.</p>
    <div class="meta"><b>${TOTAL.toLocaleString('en-US')}</b> questions${mixBt.a ? ` · you: ${mixBt.c}/${mixBt.a} correct` : ''}</div>
    <div class="acts"><button class="go" data-quiz="mix" style="flex:1">Practice everything</button></div></div>`;
  html += `</div>`;
  app.innerHTML = html;
}

function renderTopic(): void {
  const t = TOPICS.find((x) => x.id === view.topic);
  const isMix = view.topic === 'mix';
  const title = isMix ? 'Mixed Practice' : t!.title;
  let html = `<div class="topbar"><button class="backbtn" data-home>&larr; Topics</button>
    <span class="topic-title">${title}</span></div>`;
  if (!isMix) {
    html += `<div class="tabs">
      <button data-tab="learn" class="${view.tab === 'learn' ? 'on' : ''}">Learn</button>
      <button data-tab="quiz" class="${view.tab === 'quiz' ? 'on' : ''}">Practice</button></div>`;
  }
  html += `<div class="pane">`;
  if (!isMix && view.tab === 'learn') {
    html += `<div class="learn">${t!.learn_html}<div class="startrow"><button class="bigbtn" data-tab="quiz">Start practising &rarr;</button></div></div>`;
  } else {
    html += `<div class="quiz" id="quizBox"></div>`;
  }
  html += `</div>`;
  app.innerHTML = html;
  if (isMix || view.tab === 'quiz') nextQuestion();
}

function makeQuestion(): Question {
  const gen = view.topic === 'mix' ? GEN[rnd(Object.keys(GEN))] : GEN[view.topic!];
  let q: Question;
  let tries = 0;
  do {
    q = gen();
    tries++;
  } while (q.q === lastQ && tries < 5);
  lastQ = q.q;
  return q;
}

function topicLabel(): string {
  if (view.topic !== 'mix') return TOPICS.find((x) => x.id === view.topic)!.title;
  return 'Mixed';
}

function paintQuestion(metaLeft: string): void {
  const box = $('quizBox');
  const qHtml = esc(current!.q).replace(/___/g, '<span class="blank">&nbsp;</span>');
  const typed = typedModeOn() && isTypeable(current!);
  const body = typed
    ? `<div class="typedrow"><input id="typedIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Type your answer" aria-label="Your answer"><button class="bigbtn" data-check>Check</button></div>`
    : `<div class="opts">${current!.options.map((o, i) => `<button data-opt="${i}">${esc(o)}</button>`).join('')}</div>`;
  box.innerHTML = `
    <div class="quizbar">
      <label class="switch"><input type="checkbox" id="soundToggle" ${settings.sound !== false ? 'checked' : ''}> Sound</label>
      <label class="switch"><input type="checkbox" id="typedToggle" ${typedModeOn() ? 'checked' : ''}> Type answers</label>
    </div>
    <div class="qmeta"><span>${metaLeft}</span><span>Session: ${session.ok}/${session.n} correct</span></div>
    <div class="qcard">
      <div class="qtype">${typed ? 'Type the answer' : 'Choose the correct answer'}</div>
      <div class="qtext">${qHtml}</div>
      ${current!.hint ? `<div class="qhint">${esc(current!.hint)}</div>` : ''}
      ${body}
      <div id="fb"></div>
    </div>
    <div class="scorebar" id="sbar"></div>
    <div class="roundrow" id="roundrow">
      <div class="ringwrap">
        <svg class="ring" viewBox="0 0 64 64" aria-hidden="true"><circle class="ring-bg" cx="32" cy="32" r="26"/><circle class="ring-fg" cx="32" cy="32" r="26"/></svg>
        <div class="ring-num" id="ringNum"></div>
      </div>
      <div class="round-txt"><div class="round-lbl" id="roundLbl"></div><div class="round-sub" id="roundSub"></div></div>
    </div>`;
  paintScorebar();
  paintRing();
  if (typed) $('typedIn').focus();
}

function nextQuestion(): void {
  if (round.n >= ROUND_SIZE) round = { n: 0, ok: 0 };
  current = makeQuestion();
  paintQuestion(topicLabel());
}

/* ---------- review mode ---------- */
function renderReview(): void {
  const html = `<div class="topbar"><button class="backbtn" data-home>&larr; Topics</button>
    <span class="topic-title">Review</span></div>
    <div class="pane"><div class="quiz" id="quizBox"></div></div>`;
  app.innerHTML = html;
  nextReviewQuestion();
}

function nextReviewQuestion(): void {
  if (round.n >= ROUND_SIZE) round = { n: 0, ok: 0 };
  // skip facts we can no longer render (e.g. removed vocabulary)
  while (reviewQueue.length && !topicForFact(reviewQueue[0])) reviewQueue.shift();
  if (!reviewQueue.length) {
    $('quizBox').innerHTML = `
      <div class="qcard">
        <div class="qtype">Review</div>
        <div class="qtext">All caught up! Nothing due right now.</div>
        <div class="qhint">Practice any topic to add new facts, or come back when the next review is due.</div>
        <div class="nextrow"><button class="bigbtn" data-home>&larr; Back to topics</button></div>
      </div>`;
    return;
  }
  const fact = reviewQueue[0];
  current = GEN[topicForFact(fact)!](fact);
  paintQuestion(`Review · ${reviewQueue.length} due`);
}

function paintScorebar(): void {
  const bar = document.getElementById('sbar');
  if (!bar) return;
  if (session.n === 0) {
    bar.innerHTML = '';
    return;
  }
  const okPct = (session.ok / session.n) * 100;
  bar.innerHTML = `<div class="ok" style="width:${okPct}%"></div><div class="no" style="width:${100 - okPct}%"></div>`;
}

const RING_LEN = 2 * Math.PI * 26; // matches r="26" in the ring SVG

function paintRing(): void {
  const row = document.getElementById('roundrow');
  if (!row) return;
  const done = round.n >= ROUND_SIZE;
  row.classList.toggle('celebrate', done);
  const fg = row.querySelector<SVGCircleElement>('.ring-fg')!;
  fg.style.strokeDasharray = String(RING_LEN);
  fg.style.strokeDashoffset = String(RING_LEN * (1 - round.n / ROUND_SIZE));
  $('ringNum').innerHTML = `${round.n}<span class="of">/${ROUND_SIZE}</span>`;
  $('roundLbl').textContent = done ? `Round complete: ${round.ok}/${ROUND_SIZE} correct!` : 'This round';
  $('roundSub').textContent = done
    ? (round.ok === ROUND_SIZE ? 'Perfect round!' : 'Next question starts a fresh round.')
    : `Answered this session: ${session.n}`;
}

/** stats + SRS bookkeeping shared by both answer modes */
function recordAnswer(isOk: boolean): void {
  session.n++;
  if (isOk) session.ok++;
  round.n++;
  if (isOk) round.ok++;
  stats.answered++;
  if (isOk) stats.correct++;
  const key = ctxKey();
  stats.byTopic[key] = stats.byTopic[key] || { a: 0, c: 0 };
  stats.byTopic[key].a++;
  if (isOk) stats.byTopic[key].c++;
  void saveStats(stats);
  paintHeader();
  paintScorebar();
  paintRing();
  if (!isOk) playWrong();
  else if (round.n >= ROUND_SIZE) playRoundComplete();
  else playCorrect();

  // SRS: every answered question (any mode) grades the facts it exercises
  const now = Date.now();
  for (const f of current!.facts) {
    const next = reviewFact(factStates.get(f) ?? newFactState(f, now), isOk, now);
    factStates.set(f, next);
    void saveFactState(next);
  }
  if (view.page === 'review') {
    const primary = reviewQueue[0];
    // the generator substitutes a random question when it cannot render the
    // queued fact (stale vocabulary from an older wordbank). That fact is then
    // never graded, so its due date never moves: drop it or the queue sticks.
    if (!current!.facts.includes(primary)) reviewQueue.shift();
    reviewQueue = reviewQueue.filter((f) => {
      const st = factStates.get(f);
      return st !== undefined && st.due <= now;
    });
    // a missed fact stays in the session but goes to the back of the queue
    if (!isOk && reviewQueue.includes(primary)) {
      reviewQueue = reviewQueue.filter((f) => f !== primary);
      reviewQueue.push(primary);
    }
  }
}

function showFeedback(isOk: boolean, extraHtml = ''): void {
  const fb = $('fb');
  const sayText = canSpeakDutch() ? spokenText(current!) : null;
  const listen = sayText
    ? `<button class="listenbtn" data-say aria-label="Listen to the Dutch sentence">${ICONS.volume} Listen</button>`
    : '';
  fb.innerHTML = `<div class="feedback ${isOk ? 'ok' : 'no'}">
    <span class="verdict">${isOk ? 'Correct' : 'Wrong. The answer is: ' + esc(current!.answer)}</span>
    ${esc(current!.why)}${extraHtml}</div>
    <div class="nextrow">${listen}<button class="bigbtn" data-next>Next question &rarr;</button></div>
    ${sayText ? '<div class="voicenote">Audio uses your device\'s Dutch voice; quality varies by device.</div>' : ''}`;
  fb.querySelector<HTMLButtonElement>('[data-next]')!.focus();
}

function answer(idx: number): void {
  if (!current || $('fb').innerHTML) return;
  const chosen = current.options[idx];
  const isOk = chosen === current.answer;
  recordAnswer(isOk);

  const box = $('quizBox');
  box.querySelectorAll<HTMLButtonElement>('.opts button').forEach((b, i) => {
    b.disabled = true;
    const val = current!.options[i];
    if (val === current!.answer) b.classList.add('correct');
    else if (i === idx) b.classList.add('wrong');
    else b.classList.add('dim');
  });
  if (!isOk) box.querySelector('.qcard')?.classList.add('shake');
  showFeedback(isOk);
}

function checkTyped(): void {
  if (!current || $('fb').innerHTML) return;
  const input = $('typedIn') as HTMLInputElement;
  if (!normalizeAnswer(input.value)) {
    input.focus();
    return;
  }
  const { ok, nearMiss } = gradeTyped(current, input.value);
  recordAnswer(ok);
  input.disabled = true;
  $('quizBox').querySelector('.qcard')?.classList.add(ok ? 'pop' : 'shake');

  let extra = '';
  if (!ok && nearMiss) {
    const typedMarks = charDiff(normalizeAnswer(input.value), normalizeAnswer(current.answer))
      .map((p) => (p.same ? esc(p.ch) : `<span class="diffc">${esc(p.ch)}</span>`))
      .join('');
    const answerMarks = charDiff(normalizeAnswer(current.answer), normalizeAnswer(input.value))
      .map((p) => (p.same ? esc(p.ch) : `<span class="diffok">${esc(p.ch)}</span>`))
      .join('');
    extra = `<div class="diffbox">
      <div class="row"><span class="lbl">You typed</span><span>${typedMarks}</span></div>
      <div class="row"><span class="lbl">Answer</span><span>${answerMarks}</span></div>
      <div class="row" style="margin-top:6px">So close! Check the highlighted letters.</div>
    </div>`;
  }
  showFeedback(ok, extra);
}

/** glossary info button: toggle the simple explanation under the term */
function toggleGloss(b: HTMLButtonElement): void {
  const next = b.nextElementSibling;
  if (next && next.classList.contains('gloss')) {
    next.remove();
    b.setAttribute('aria-expanded', 'false');
    return;
  }
  const def = GLOSSARY[b.dataset.g!];
  if (!def) return;
  const s = document.createElement('span');
  s.className = 'gloss';
  s.textContent = def;
  b.after(s);
  b.setAttribute('aria-expanded', 'true');
}

/* =====================================================
   EVENTS
   ===================================================== */
app.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button');
  if (!b) return;
  if (b.dataset.g) {
    toggleGloss(b);
    return;
  }
  if (b.dataset.home !== undefined) {
    view = { page: 'home' };
    renderHome();
    return;
  }
  if (b.dataset.learn) {
    view = { page: 'topic', topic: b.dataset.learn, tab: 'learn' };
    renderTopic();
    return;
  }
  if (b.dataset.quiz) {
    view = { page: 'topic', topic: b.dataset.quiz, tab: 'quiz' };
    session = { n: 0, ok: 0 };
    round = { n: 0, ok: 0 };
    renderTopic();
    return;
  }
  if (b.dataset.tab) {
    view.tab = b.dataset.tab as 'learn' | 'quiz';
    renderTopic();
    return;
  }
  if (b.dataset.review !== undefined) {
    view = { page: 'review' };
    session = { n: 0, ok: 0 };
    round = { n: 0, ok: 0 };
    reviewQueue = dueFactIds(Date.now());
    renderReview();
    return;
  }
  if (b.dataset.opt !== undefined) {
    answer(+b.dataset.opt);
    return;
  }
  if (b.dataset.check !== undefined) {
    checkTyped();
    return;
  }
  if (b.dataset.say !== undefined) {
    const text = current && spokenText(current);
    if (text) speakDutch(text);
    return;
  }
  if (b.dataset.next !== undefined) {
    if (view.page === 'review') nextReviewQuestion();
    else nextQuestion();
    return;
  }
});

/* quizbar toggles: sound is global, typed mode persists per context */
app.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.id === 'soundToggle') {
    settings.sound = t.checked;
    setSoundEnabled(t.checked);
    void saveSettings(settings);
    return;
  }
  if (t.id !== 'typedToggle') return;
  settings.typed[ctxKey()] = t.checked;
  void saveSettings(settings);
  // the card is already answered: repainting would clear the feedback and
  // re-enable the options, letting the same question be graded twice
  if ($('fb').innerHTML) return;
  if (view.page === 'review') {
    if (reviewQueue.length) paintQuestion(`Review · ${reviewQueue.length} due`);
  } else {
    paintQuestion(topicLabel());
  }
});

document.addEventListener('keydown', (e) => {
  if (view.page !== 'topic' && view.page !== 'review') return;
  const inInput = (e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type === 'text';
  if (!inInput && e.key >= '1' && e.key <= '4') {
    const btns = app.querySelectorAll<HTMLButtonElement>('.opts button:not(:disabled)');
    const i = +e.key - 1;
    if (btns[i]) btns[i].click();
  }
  if (e.key === 'Enter') {
    // in typed mode Enter first submits the answer, then advances. This works
    // whether or not the input still holds focus, so Enter always checks a
    // pending typed answer before it advances to the next question.
    const typedIn = document.getElementById('typedIn') as HTMLInputElement | null;
    if (typedIn && !typedIn.disabled) {
      checkTyped();
      return;
    }
    const nx = app.querySelector<HTMLButtonElement>('[data-next]');
    if (nx) nx.click();
  }
});

/* =====================================================
   PWA: service worker + install prompt
   ===================================================== */
registerSW({ immediate: true });

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installEvt: BeforeInstallPromptEvent | null = null;
const installBtn = $('installBtn') as HTMLButtonElement;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvt = e as BeforeInstallPromptEvent;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!installEvt) return;
  await installEvt.prompt();
  await installEvt.userChoice;
  installEvt = null;
  installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => {
  installBtn.hidden = true;
});

/* =====================================================
   BOOT
   ===================================================== */
$('totalCount').textContent = TOTAL.toLocaleString('en-US') + '+';
const tc = document.getElementById('topicCount');
if (tc) tc.textContent = String(TOPICS.length);
$('footTotals').textContent =
  `Question pool: ${TOTAL.toLocaleString('en-US')} unique combinations across ${TOPICS.length} topics.`;

loadStats().then((s) => {
  stats = s;
  paintHeader();
  if (view.page === 'home') renderHome();
});
/* Facts whose vocabulary has since been removed from the word banks would sit
   in the queue forever: no generator can render them, so they never get graded
   and their due date never moves. Drop them as they load. */
const liveFacts = new Set(Object.values(allFacts()).flat());
loadFactStates().then((list) => {
  for (const st of list) if (liveFacts.has(st.id) && !factStates.has(st.id)) factStates.set(st.id, st);
  if (view.page === 'home') renderHome(); // review card needs the due count
});
loadSettings().then((s) => {
  settings = s;
  setSoundEnabled(s.sound !== false);
});
initSpeech();

/* boot-time deep link, e.g. #/quiz/dehet or #/learn/perfect */
const deepLink = location.hash.match(/^#\/(learn|quiz)\/([a-z]+)$/);
if (deepLink && (GEN[deepLink[2]] || deepLink[2] === 'mix')) {
  view = { page: 'topic', topic: deepLink[2], tab: deepLink[1] as 'learn' | 'quiz' };
  renderTopic();
} else {
  renderHome();
}
