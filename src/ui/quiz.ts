import type { Question } from '../types';
import { TOPICS } from '../data';
import { GEN } from '../generators';
import { rnd } from '../rng';
import { charDiff, gradeTyped, isTypeable, normalizeAnswer } from '../typed';
import { canSpeakDutch, spokenText } from '../platform/speech';
import { playCorrect, playRoundComplete, playWrong } from '../platform/sound';
import { saveFactState, saveStats } from '../platform/storage';
import { newFactState, reviewFact } from '../srs/sm2';
import { topicForFact } from '../srs/facts';
import { ICONS } from './icons';
import { $, esc, paintHeader } from './dom';
import { ROUND_SIZE, S, ctxKey, factStates, typedModeOn } from './state';

function makeQuestion(): Question {
  const gen = S.view.topic === 'mix' ? GEN[rnd(Object.keys(GEN))] : GEN[S.view.topic!];
  let q: Question;
  let tries = 0;
  do {
    q = gen();
    tries++;
  } while (q.q === S.lastQ && tries < 5);
  S.lastQ = q.q;
  return q;
}

function topicLabel(): string {
  if (S.view.topic !== 'mix') return TOPICS.find((x) => x.id === S.view.topic)!.title;
  return 'Mixed';
}

/** the left-hand label above the question card, per mode */
const metaLeft = (): string =>
  S.view.page === 'review' ? `Review · ${S.reviewQueue.length} due` : topicLabel();

function paintQuestion(): void {
  const box = $('quizBox');
  const qHtml = esc(S.current!.q).replace(/___/g, '<span class="blank">&nbsp;</span>');
  const typed = typedModeOn() && isTypeable(S.current!);
  const body = typed
    ? `<div class="typedrow"><input id="typedIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Type your answer" aria-label="Your answer"><button class="bigbtn" data-check>Check</button></div>`
    : `<div class="opts">${S.current!.options.map((o, i) => `<button data-opt="${i}">${esc(o)}</button>`).join('')}</div>`;
  box.innerHTML = `
    <div class="quizbar">
      <label class="switch"><input type="checkbox" id="soundToggle" ${S.settings.sound !== false ? 'checked' : ''}> Sound</label>
      <label class="switch"><input type="checkbox" id="typedToggle" ${typedModeOn() ? 'checked' : ''}> Type answers</label>
    </div>
    <div class="qmeta"><span>${metaLeft()}</span><span>Session: ${S.session.ok}/${S.session.n} correct</span></div>
    <div class="qcard">
      <div class="qtype">${typed ? 'Type the answer' : 'Choose the correct answer'}</div>
      <div class="qtext">${qHtml}</div>
      ${S.current!.hint ? `<div class="qhint">${esc(S.current!.hint)}</div>` : ''}
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
  paintProgress();
  if (typed) $('typedIn').focus();
}

/** redraw the current question in place, e.g. after switching answer mode */
export function repaintQuestion(): void {
  if (S.view.page === 'review' && !S.reviewQueue.length) return;
  paintQuestion();
}

function paintCaughtUp(): void {
  $('quizBox').innerHTML = `
      <div class="qcard">
        <div class="qtype">Review</div>
        <div class="qtext">All caught up! Nothing due right now.</div>
        <div class="qhint">Practice any topic to add new facts, or come back when the next review is due.</div>
        <div class="nextrow"><button class="bigbtn" data-home>&larr; Back to topics</button></div>
      </div>`;
}

/** draw the next question for whichever mode is active */
export function advance(): void {
  if (S.round.n >= ROUND_SIZE) S.round = { n: 0, ok: 0 };
  if (S.view.page === 'review') {
    // skip facts we can no longer render (e.g. removed vocabulary)
    while (S.reviewQueue.length && !topicForFact(S.reviewQueue[0])) S.reviewQueue.shift();
    if (!S.reviewQueue.length) {
      paintCaughtUp();
      return;
    }
    const fact = S.reviewQueue[0];
    S.current = GEN[topicForFact(fact)!](fact);
  } else {
    S.current = makeQuestion();
  }
  paintQuestion();
}

function paintScorebar(): void {
  const bar = document.getElementById('sbar');
  if (!bar) return;
  if (S.session.n === 0) {
    bar.innerHTML = '';
    return;
  }
  const okPct = (S.session.ok / S.session.n) * 100;
  bar.innerHTML = `<div class="ok" style="width:${okPct}%"></div><div class="no" style="width:${100 - okPct}%"></div>`;
}

const RING_LEN = 2 * Math.PI * 26; // matches r="26" in the ring SVG

function paintRing(): void {
  const row = document.getElementById('roundrow');
  if (!row) return;
  const done = S.round.n >= ROUND_SIZE;
  row.classList.toggle('celebrate', done);
  const fg = row.querySelector<SVGCircleElement>('.ring-fg')!;
  fg.style.strokeDasharray = String(RING_LEN);
  fg.style.strokeDashoffset = String(RING_LEN * (1 - S.round.n / ROUND_SIZE));
  $('ringNum').innerHTML = `${S.round.n}<span class="of">/${ROUND_SIZE}</span>`;
  $('roundLbl').textContent = done ? `Round complete: ${S.round.ok}/${ROUND_SIZE} correct!` : 'This round';
  $('roundSub').textContent = done
    ? (S.round.ok === ROUND_SIZE ? 'Perfect round!' : 'Next question starts a fresh round.')
    : `Answered this session: ${S.session.n}`;
}

function paintProgress(): void {
  paintScorebar();
  paintRing();
}

/** stats + SRS bookkeeping shared by both answer modes */
function recordAnswer(isOk: boolean): void {
  S.session.n++;
  if (isOk) S.session.ok++;
  S.round.n++;
  if (isOk) S.round.ok++;
  S.stats.answered++;
  if (isOk) S.stats.correct++;
  const key = ctxKey();
  S.stats.byTopic[key] = S.stats.byTopic[key] || { a: 0, c: 0 };
  S.stats.byTopic[key].a++;
  if (isOk) S.stats.byTopic[key].c++;
  void saveStats(S.stats);
  paintHeader();
  paintProgress();
  if (!isOk) playWrong();
  else if (S.round.n >= ROUND_SIZE) playRoundComplete();
  else playCorrect();

  // SRS: every answered question (any mode) grades the facts it exercises
  const now = Date.now();
  for (const f of S.current!.facts) {
    const next = reviewFact(factStates.get(f) ?? newFactState(f, now), isOk, now);
    factStates.set(f, next);
    void saveFactState(next);
  }
  if (S.view.page === 'review') {
    const primary = S.reviewQueue[0];
    // the generator substitutes a random question when it cannot render the
    // queued fact (stale vocabulary from an older wordbank). That fact is then
    // never graded, so its due date never moves: drop it or the queue sticks.
    if (!S.current!.facts.includes(primary)) S.reviewQueue.shift();
    S.reviewQueue = S.reviewQueue.filter((f) => {
      const st = factStates.get(f);
      return st !== undefined && st.due <= now;
    });
    // a missed fact stays in the session but goes to the back of the queue
    if (!isOk && S.reviewQueue.includes(primary)) {
      S.reviewQueue = S.reviewQueue.filter((f) => f !== primary);
      S.reviewQueue.push(primary);
    }
  }
}

function showFeedback(isOk: boolean, extraHtml = ''): void {
  const fb = $('fb');
  const sayText = canSpeakDutch() ? spokenText(S.current!) : null;
  const listen = sayText
    ? `<button class="listenbtn" data-say aria-label="Listen to the Dutch sentence">${ICONS.volume} Listen</button>`
    : '';
  fb.innerHTML = `<div class="feedback ${isOk ? 'ok' : 'no'}">
    <span class="verdict">${isOk ? 'Correct' : 'Wrong. The answer is: ' + esc(S.current!.answer)}</span>
    ${esc(S.current!.why)}${extraHtml}</div>
    <div class="nextrow">${listen}<button class="bigbtn" data-next>Next question &rarr;</button></div>
    ${sayText ? '<div class="voicenote">Audio uses your device\'s Dutch voice; quality varies by device.</div>' : ''}`;
  fb.querySelector<HTMLButtonElement>('[data-next]')!.focus();
}

export function answer(idx: number): void {
  if (!S.current || $('fb').innerHTML) return;
  const chosen = S.current.options[idx];
  const isOk = chosen === S.current.answer;
  recordAnswer(isOk);

  const box = $('quizBox');
  box.querySelectorAll<HTMLButtonElement>('.opts button').forEach((b, i) => {
    b.disabled = true;
    const val = S.current!.options[i];
    if (val === S.current!.answer) b.classList.add('correct');
    else if (i === idx) b.classList.add('wrong');
    else b.classList.add('dim');
  });
  if (!isOk) box.querySelector('.qcard')?.classList.add('shake');
  showFeedback(isOk);
}

/** one side of the near-miss diff: `a` marked up against `b` */
const marks = (a: string, b: string, cls: string): string =>
  charDiff(normalizeAnswer(a), normalizeAnswer(b))
    .map((p) => (p.same ? esc(p.ch) : `<span class="${cls}">${esc(p.ch)}</span>`))
    .join('');

export function checkTyped(): void {
  if (!S.current || $('fb').innerHTML) return;
  const input = $('typedIn') as HTMLInputElement;
  if (!normalizeAnswer(input.value)) {
    input.focus();
    return;
  }
  const { ok, nearMiss } = gradeTyped(S.current, input.value);
  recordAnswer(ok);
  input.disabled = true;
  $('quizBox').querySelector('.qcard')?.classList.add(ok ? 'pop' : 'shake');

  let extra = '';
  if (!ok && nearMiss) {
    extra = `<div class="diffbox">
      <div class="row"><span class="lbl">You typed</span><span>${marks(input.value, S.current.answer, 'diffc')}</span></div>
      <div class="row"><span class="lbl">Answer</span><span>${marks(S.current.answer, input.value, 'diffok')}</span></div>
      <div class="row" style="margin-top:6px">So close! Check the highlighted letters.</div>
    </div>`;
  }
  showFeedback(ok, extra);
}
