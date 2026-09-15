import { TOPICS } from '../data';
import { CNT } from '../generators';
import { ICONS } from './icons';
import { app, esc } from './dom';
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

const TOPIC_ART: Record<string, { group: string; words: string[] }> = {
  dehet: { group: 'Nouns', words: ['de', 'het'] },
  plural: { group: 'Nouns', words: ['boek', 'boeken'] },
  adj: { group: 'Nouns', words: ['groot', 'grote'] },
  present: { group: 'Verbs', words: ['vandaag', 'ik werk'] },
  perfect: { group: 'Verbs', words: ['heb', 'gewerkt'] },
  modal: { group: 'Verbs', words: ['kan', 'mag', 'moet'] },
  wordorder: { group: 'Sentences', words: ['vandaag', 'werk', 'ik'] },
  negation: { group: 'Sentences', words: ['niet', 'geen'] },
  pronouns: { group: 'Nouns', words: ['ik', 'jij', 'wij'] },
  comparative: { group: 'Nouns', words: ['groot', 'groter'] },
  separable: { group: 'Verbs', words: ['staan', 'op'] },
  imperfectum: { group: 'Verbs', words: ['gisteren', 'werkte'] },
  er: { group: 'Sentences', words: ['hier', 'er'] },
  conjrel: { group: 'Sentences', words: ['omdat', 'want'] },
  omte: { group: 'Sentences', words: ['om', 'te'] },
  diminutive: { group: 'Nouns', words: ['huis', 'huisje'] },
  prepositions: { group: 'Sentences', words: ['in', 'op', 'onder'] },
  passive: { group: 'Verbs', words: ['wordt', 'gebouwd'] }
};
const browse = { category: 'All topics', query: '' };

/** Presentation-only filters never change lesson, quiz or review state. */
export function filterTopics(category = browse.category, query = browse.query): void {
  browse.category = category;
  browse.query = query;
  let count = 0;
  app.querySelectorAll<HTMLElement>('[data-topic-card]').forEach(card => {
    const matches = (category === 'All topics' || card.dataset.category === category)
      && card.dataset.search!.includes(query.trim().toLowerCase());
    card.hidden = !matches;
    if (matches) count++;
  });
  app.querySelectorAll<HTMLButtonElement>('button[data-category]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.category === category));
  });
  const empty = app.querySelector<HTMLElement>('#topic-empty');
  if (empty) empty.hidden = count > 0;
  const status = app.querySelector('#topic-results');
  if (status) status.textContent = `${count} ${count === 1 ? 'topic' : 'topics'}`;
}

/** back bar + title + content pane, shared by the topic and review screens.
    `afterBar` sits between the bar and the pane, where the tabs go. */
const shell = (title: string, paneInner: string, afterBar = '') =>
  `<div class="topbar"><button class="backbtn" data-home>&larr; Topics</button>
    <h2 class="topic-title">${title}</h2></div>${afterBar}<div class="pane">${paneInner}</div>`;

export function renderHome(): void {
  resetSession();
  let html = `<div class="home-top"><div class="home-intro"><span class="eyebrow">One small step, every day</span><h2>A little Dutch.<br>A little more confidence.</h2>
  <p>Simple explanations. A moment to practise.<br>Make the language feel a little more yours.</p></div><div class="home-actions">`;
  const now = Date.now();
  const due = dueFactIds(now).length;
  const tracked = factStates.size;
  const revMeta = tracked
    ? `<b>${due}</b> due now · <b>${tracked}</b> facts tracked${due === 0 ? ` · ${nextDueText(now)}` : ''}`
    : `Nothing tracked yet`;
  const mixBt = S.stats.byTopic['mix'] || { a: 0, c: 0 };
  html += `<div class="tcard mixcard"><div class="action-copy"><span class="eyebrow">Your next small step</span>
    <h3>Mixed Practice</h3><p>A little of everything. Build confidence one question at a time.</p>
    <div class="meta">${mixBt.a ? `${mixBt.c}/${mixBt.a} correct so far` : '10 questions per round'}</div>
    <div class="acts"><button class="go" data-quiz="mix">Start practising <span aria-hidden="true">→</span></button></div></div>
    <div class="hello-art" aria-hidden="true"><span>Hallo</span><span>Hoi!</span></div></div>`;
  html += `<div class="tcard revcard">${ticon('refresh', 'var(--brand)', 'var(--brand-soft)')}<div class="review-copy">
    <h3>Review</h3><p>${
      tracked
        ? 'A second look helps it stick. Missed answers come back sooner.'
        : 'Your practice builds a personal review list here.'
    }</p>
    <div class="meta">${revMeta}</div>
    <div class="acts"><button data-review ${due === 0 ? 'disabled' : ''}>Review now <span aria-hidden="true">→</span></button></div></div></div></div></div>`;
  html += `<section class="topic-browser" aria-labelledby="browse-title"><div class="browse-heading"><div><h2 id="browse-title">What would you like to learn?</h2><p>Explore a topic, read the rules, then give it a try.</p></div>
    <label class="topic-search"><span aria-hidden="true">⌕</span><span class="sr-only">Search grammar topics</span><input id="topic-search" type="search" placeholder="Find a grammar topic" value="${esc(browse.query)}"></label></div>
    <div class="browse-controls"><div class="topic-filters" aria-label="Topic categories">${['All topics', 'Nouns', 'Verbs', 'Sentences'].map(category => `<button data-category="${category}" aria-pressed="${category === browse.category}">${category}</button>`).join('')}</div><span class="result-count" id="topic-results" role="status"></span></div><div class="grid">`;
  for (const t of TOPICS) {
    const bt = S.stats.byTopic[t.id] || { a: 0, c: 0 };
    const m = TOPIC_META[t.id] ?? { icon: 'tag', color: 'var(--blue)', soft: 'var(--blue-soft)' };
    const art = TOPIC_ART[t.id];
    html += `<article class="tcard" data-topic-card="${t.id}" data-category="${art.group}" data-search="${esc(`${t.title} ${t.blurb}`.toLowerCase())}">
      <button class="topic-cover" data-learn="${t.id}" aria-label="Learn ${esc(t.title)}" style="--topic-soft:${m.soft};--topic-ink:${m.color}">
        <span class="topic-art" aria-hidden="true"><span class="art-icon">${ICONS[m.icon]}</span><span class="word-papers">${art.words.map(word => `<span class="word-paper">${word}</span>`).join('')}</span></span>
        <span class="topic-name">${t.title}</span></button><p>${t.blurb}</p>
      <div class="meta">${art.group} · <b>${CNT[t.id].toLocaleString('en-US')}</b> questions${bt.a ? `<span class="topic-progress">${bt.c}/${bt.a} correct</span>` : ''}</div>
      <div class="acts"><button data-learn="${t.id}" aria-label="Read rules for ${esc(t.title)}">Read rules</button><button class="go" data-quiz="${t.id}" aria-label="Practise ${esc(t.title)}">Practise <span aria-hidden="true">→</span></button></div></article>`;
  }
  html += `</div><div id="topic-empty" class="empty-topics" hidden><h3>No topics found</h3><p>Try a different word or choose another category.</p><button class="backbtn" data-clear-filters>Clear filters</button></div></section>`;
  app.innerHTML = html;
  filterTopics();
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
