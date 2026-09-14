import { S } from './state';

/** escapes text, not attribute values - every interpolated attribute in this
    app is a number or a build-time constant */
export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** required element: a missing id here is a broken index.html, not a state */
export const $ = (id: string): HTMLElement => document.getElementById(id)!;

/** optional element: header and footer chrome the quiz can live without */
export const $opt = (id: string): HTMLElement | null => document.getElementById(id);

export const app = $('app');

export function paintHeader(): void {
  $('hdrAnswered').textContent = String(S.stats.answered);
  $('hdrAcc').textContent = S.stats.answered
    ? Math.round((S.stats.correct / S.stats.answered) * 100) + '%'
    : '-';
}
