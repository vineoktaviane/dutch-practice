import { TOPICS } from '../data';
import { CNT, TOTAL } from '../generators';
import { ICONS } from './icons';
import { app } from './dom';
import { dueFactIds, nextDueText } from './due';
import { S, factStates, resetSession } from './state';
import { advance } from './quiz';

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

/** back bar + title + content pane, shared by the topic and review screens.
    `afterBar` sits between the bar and the pane, where the tabs go. */
const shell = (title: string, paneInner: string, afterBar = '') =>
  `<div class="topbar"><button class="backbtn" data-home>&larr; Topics</button>
    <span class="topic-title">${title}</span></div>${afterBar}<div class="pane">${paneInner}</div>`;

export function renderHome(): void {
  resetSession();
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
    const bt = S.stats.byTopic[t.id] || { a: 0, c: 0 };
    const m = TOPIC_META[t.id] ?? { icon: 'tag', color: 'var(--blue)', soft: 'var(--blue-soft)' };
    html += `<div class="tcard">${ticon(m.icon, m.color, m.soft)}
      <h3>${t.title}</h3><p>${t.blurb}</p>
      <div class="meta"><b>${CNT[t.id].toLocaleString('en-US')}</b> questions${bt.a ? ` · you: ${bt.c}/${bt.a} correct` : ''}</div>
      <div class="acts"><button data-learn="${t.id}">Learn</button><button class="go" data-quiz="${t.id}">Practice</button></div></div>`;
  }
  const mixBt = S.stats.byTopic['mix'] || { a: 0, c: 0 };
  html += `<div class="tcard mixcard">${ticon('shuffle', '#FFC9A8', 'rgba(255,255,255,.12)')}
    <h3>Mixed Practice</h3><p>Random questions from all topics. Harder, because you do not know which rule is tested. Just like real Dutch.</p>
    <div class="meta"><b>${TOTAL.toLocaleString('en-US')}</b> questions${mixBt.a ? ` · you: ${mixBt.c}/${mixBt.a} correct` : ''}</div>
    <div class="acts"><button class="go" data-quiz="mix" style="flex:1">Practice everything</button></div></div>`;
  html += `</div>`;
  app.innerHTML = html;
}

export function renderTopic(): void {
  const t = TOPICS.find((x) => x.id === S.view.topic);
  const isMix = S.view.topic === 'mix';
  const tabs = isMix
    ? ''
    : `<div class="tabs">
      <button data-tab="learn" class="${S.view.tab === 'learn' ? 'on' : ''}">Learn</button>
      <button data-tab="quiz" class="${S.view.tab === 'quiz' ? 'on' : ''}">Practice</button></div>`;
  const pane =
    !isMix && S.view.tab === 'learn'
      ? `<div class="learn">${t!.learn_html}<div class="startrow"><button class="bigbtn" data-tab="quiz">Start practising &rarr;</button></div></div>`
      : `<div class="quiz" id="quizBox"></div>`;
  app.innerHTML = shell(isMix ? 'Mixed Practice' : t!.title, pane, tabs);
  if (isMix || S.view.tab === 'quiz') advance();
}

export function renderReview(): void {
  app.innerHTML = shell('Review', '<div class="quiz" id="quizBox"></div>');
  advance();
}
