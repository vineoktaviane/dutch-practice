// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { TOPICS } from '../src/data';

// the service worker virtual module only exists inside the Vite build
vi.mock('virtual:pwa-register', () => ({ registerSW: () => {} }));

function click(el: Element | null): void {
  expect(el, 'expected element to click').toBeTruthy();
  (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

const $ = (sel: string) => document.querySelector(sel);

beforeAll(async () => {
  document.body.innerHTML = `
    <header><div class="wrap head-in">
      <div class="head-txt"><h1>Dutch Grammar Trainer</h1>
        <div class="head-sub"><span id="totalCount">…</span></div></div>
      <div class="stat-box"><span class="n" id="hdrAnswered">0</span><span class="n" id="hdrAcc">–</span></div>
    </div></header>
    <main class="wrap" id="app"></main>
    <footer><div class="wrap"><span id="footTotals"></span><button id="installBtn" hidden></button></div></footer>`;
  await import('../src/main');
});

describe('app UI smoke', () => {
  it('renders the home grid: all topics + review + mixed practice', () => {
    const cards = document.querySelectorAll('#app .tcard');
    expect(cards.length).toBe(TOPICS.length + 2); // topics + review + mixed
    expect($('#totalCount')!.textContent).toMatch(/^\d{1,3}(,\d{3})*\+$/);
    expect($('#footTotals')!.textContent).toContain(`${TOPICS.length} topics`);
  });

  it('shows Learn content for a topic', () => {
    click($('#app button[data-learn="dehet"]'));
    expect($('#app .learn')).toBeTruthy();
    expect($('#app .learn')!.innerHTML).toContain('het-words');
    expect($('#app .topic-title')!.textContent).toBe(TOPICS[0].title);
  });

  it('filters topic cards without affecting lesson content or practice state', () => {
    click($('#app .topbar [data-home]'));
    click($('#app button[data-category="Verbs"]'));
    const visibleCards = () => [...document.querySelectorAll<HTMLElement>('[data-topic-card]')].filter(card => !card.hidden);
    expect(visibleCards().length).toBeGreaterThan(0);
    expect(visibleCards().every(card => card.dataset.category === 'Verbs')).toBe(true);
    expect(document.querySelector('[data-topic-card][aria-pressed]')).toBeNull();

    const search = $('#topic-search') as HTMLInputElement;
    search.value = 'perfect';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(visibleCards().map(card => card.dataset.topicCard)).toEqual(['perfect', 'imperfectum']);
    search.value = 'unmatched search';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(visibleCards()).toHaveLength(0);
    expect(($('#topic-empty') as HTMLElement).hidden).toBe(false);
    click($('#app [data-clear-filters]'));
    expect(visibleCards()).toHaveLength(TOPICS.length);
    expect(search.value).toBe('');
    click($('#app button[data-learn="dehet"]'));
    expect($('#app .s-diff')!.textContent).toContain('Dutch vs English');
  });

  it('explains grammar jargon when a term button is clicked', () => {
    const term = $('#app .learn .term') as HTMLButtonElement;
    expect(term, 'expected at least one glossary term in the Learn page').toBeTruthy();
    click(term);
    const gloss = $('#app .learn .gloss');
    expect(gloss).toBeTruthy();
    expect(gloss!.textContent!.length).toBeGreaterThan(10);
    expect(term.getAttribute('aria-expanded')).toBe('true');
    // clicking again closes it
    click(term);
    expect($('#app .learn .gloss')).toBeNull();
    expect(term.getAttribute('aria-expanded')).toBe('false');
  });

  it('runs a full practice round: question → answer → feedback → next', () => {
    click($('#app button[data-tab="quiz"]'));
    expect($('#quizBox .qcard')).toBeTruthy();
    const opts = document.querySelectorAll<HTMLButtonElement>('#quizBox .opts button');
    expect(opts.length).toBeGreaterThanOrEqual(2);

    click(opts[0]);
    expect($('#quizBox .feedback')).toBeTruthy();
    expect($('#quizBox .feedback')!.textContent!.length).toBeGreaterThan(10);
    expect($('#hdrAnswered')!.textContent).toBe('1');
    expect($('#hdrAcc')!.textContent).toMatch(/^(0|100)%$/);
    // all options locked after answering
    document
      .querySelectorAll<HTMLButtonElement>('#quizBox .opts button')
      .forEach((b) => expect(b.disabled).toBe(true));

    click($('#quizBox [data-next]'));
    const fresh = document.querySelectorAll<HTMLButtonElement>('#quizBox .opts button');
    expect(fresh.length).toBeGreaterThanOrEqual(2);
    fresh.forEach((b) => expect(b.disabled).toBe(false));
  });

  it('supports mixed practice and back-navigation', () => {
    click($('#app .topbar [data-home]'));
    click($('#app button[data-quiz="mix"]'));
    expect($('#quizBox .qcard')).toBeTruthy();
    expect($('#app .qmeta')!.textContent).toContain('Mixed');
    click($('#app .topbar [data-home]'));
    expect(document.querySelectorAll('#app .tcard').length).toBe(TOPICS.length + 2);
  });

  it('answers via the 1–4 keyboard shortcuts', () => {
    click($('#app button[data-quiz="dehet"]'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    expect($('#quizBox .feedback')).toBeTruthy();
  });

  it('schedules missed facts for review and runs a review session', () => {
    // practice until at least one answer is wrong (a wrong fact is due immediately)
    click($('#app .topbar [data-home]'));
    click($('#app button[data-quiz="mix"]'));
    let gotWrong = false;
    for (let i = 0; i < 40 && !gotWrong; i++) {
      click(document.querySelector('#quizBox .opts button'));
      gotWrong = $('#quizBox .feedback')!.classList.contains('no');
      click($('#quizBox [data-next]'));
    }
    expect(gotWrong, 'expected at least one wrong answer in 40 random clicks').toBe(true);

    click($('#app .topbar [data-home]'));
    const revCard = $('#app .revcard')!;
    expect(revCard.textContent).toContain('facts tracked');
    expect(revCard.textContent).toMatch(/[1-9]\d* due now/);

    const revBtn = revCard.querySelector<HTMLButtonElement>('[data-review]')!;
    expect(revBtn.disabled).toBe(false);
    click(revBtn);
    expect($('#app .topic-title')!.textContent).toBe('Review');
    expect($('#app .qmeta')!.textContent).toContain('due');
    // answer the review question; correct or wrong, the session must continue
    click(document.querySelector('#quizBox .opts button'));
    expect($('#quizBox .feedback')).toBeTruthy();
    click($('#quizBox [data-next]'));
    // either a next question or the all-caught-up card
    expect($('#quizBox .qcard')).toBeTruthy();
  });

  it('typed mode: toggle, type an answer, get feedback, persists to next question', () => {
    click($('#app .topbar [data-home]'));
    click($('#app button[data-quiz="dehet"]'));

    const toggle = $('#typedToggle') as HTMLInputElement;
    expect(toggle).toBeTruthy();
    expect(toggle.checked).toBe(false);
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change', { bubbles: true }));

    const input = $('#typedIn') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(document.querySelector('#quizBox .opts')).toBeNull();

    const before = Number($('#hdrAnswered')!.textContent);
    input.value = 'de'; // always a legal gender answer, correct ~75% of the time
    click($('#quizBox [data-check]'));
    expect($('#quizBox .feedback')).toBeTruthy();
    // no Dutch voice in jsdom, so the audio button must be hidden entirely
    expect($('#quizBox [data-say]')).toBeNull();
    expect(Number($('#hdrAnswered')!.textContent)).toBe(before + 1);
    expect(input.disabled).toBe(true);

    // toggle state survives into the next question
    click($('#quizBox [data-next]'));
    expect($('#typedIn')).toBeTruthy();
    expect(($('#typedToggle') as HTMLInputElement).checked).toBe(true);

    // empty input is not graded
    const count = Number($('#hdrAnswered')!.textContent);
    click($('#quizBox [data-check]'));
    expect(Number($('#hdrAnswered')!.textContent)).toBe(count);
  });

  it('fills the round ring, celebrates at 10, then starts a fresh round', () => {
    click($('#app .topbar [data-home]'));
    click($('#app button[data-quiz="plural"]'));
    expect($('#roundrow')).toBeTruthy();
    expect($('#ringNum')!.textContent).toBe('0/10');

    for (let i = 1; i <= 10; i++) {
      click(document.querySelector('#quizBox .opts button'));
      // motion feedback: a miss shakes the question card, a hit does not
      const wrong = $('#quizBox .feedback')!.classList.contains('no');
      expect($('#quizBox .qcard')!.classList.contains('shake')).toBe(wrong);
      expect($('#ringNum')!.textContent).toBe(`${i}/10`);
      if (i < 10) click($('#quizBox [data-next]'));
    }
    expect($('#roundrow')!.classList.contains('celebrate')).toBe(true);
    expect($('#roundLbl')!.textContent).toContain('Round complete');

    click($('#quizBox [data-next]'));
    expect($('#ringNum')!.textContent).toBe('0/10');
    expect($('#roundrow')!.classList.contains('celebrate')).toBe(false);
  });

  it('sound toggle: on by default, stays off across questions once disabled', () => {
    const t = $('#soundToggle') as HTMLInputElement;
    expect(t).toBeTruthy();
    expect(t.checked).toBe(true);
    t.checked = false;
    t.dispatchEvent(new Event('change', { bubbles: true }));

    click(document.querySelector('#quizBox .opts button'));
    click($('#quizBox [data-next]'));
    expect(($('#soundToggle') as HTMLInputElement).checked).toBe(false);
  });
});
