import { GLOSSARY } from '../data';
import { saveSettings } from '../platform/storage';
import { speakDutch, spokenText } from '../platform/speech';
import { setSoundEnabled } from '../platform/sound';
import { $, app } from './dom';
import { dueFactIds } from './due';
import { S, ctxKey, resetSession } from './state';
import { advance, answer, checkTyped, repaintQuestion } from './quiz';
import { filterTopics, renderHome, renderReview, renderTopic } from './screens';

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

app.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button');
  if (!b) return;
  if (b.disabled) return;
  if (b.dataset.category) {
    filterTopics(b.dataset.category);
    return;
  }
  if (b.dataset.clearFilters !== undefined) {
    const search = document.getElementById('topic-search') as HTMLInputElement | null;
    if (search) search.value = '';
    filterTopics('All topics', '');
    return;
  }
  if (b.dataset.g) {
    toggleGloss(b);
    return;
  }
  if (b.dataset.home !== undefined) {
    S.view = { page: 'home' };
    renderHome();
    return;
  }
  if (b.dataset.learn) {
    S.view = { page: 'topic', topic: b.dataset.learn, tab: 'learn' };
    renderTopic();
    return;
  }
  if (b.dataset.quiz) {
    S.view = { page: 'topic', topic: b.dataset.quiz, tab: 'quiz' };
    resetSession();
    renderTopic();
    return;
  }
  if (b.dataset.tab) {
    S.view.tab = b.dataset.tab as 'learn' | 'quiz';
    renderTopic();
    return;
  }
  if (b.dataset.review !== undefined) {
    S.view = { page: 'review' };
    resetSession();
    S.reviewQueue = dueFactIds(Date.now());
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
    const text = S.current && spokenText(S.current);
    if (text) speakDutch(text);
    return;
  }
  if (b.dataset.next !== undefined) {
    advance();
    return;
  }
});

app.addEventListener('input', (e) => {
  const input = e.target as HTMLInputElement;
  if (input.id === 'topic-search') filterTopics(undefined, input.value);
});

/* quizbar toggles: sound is global, typed mode persists per context */
app.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.id === 'soundToggle') {
    S.settings.sound = t.checked;
    setSoundEnabled(t.checked);
    void saveSettings(S.settings);
    return;
  }
  if (t.id !== 'typedToggle') return;
  S.settings.typed[ctxKey()] = t.checked;
  void saveSettings(S.settings);
  // the card is already answered: repainting would clear the feedback and
  // re-enable the options, letting the same question be graded twice
  if ($('fb').innerHTML) return;
  repaintQuestion();
});

document.addEventListener('keydown', (e) => {
  if (S.view.page !== 'topic' && S.view.page !== 'review') return;
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
