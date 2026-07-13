import type { Question } from './types';

/**
 * Phase 4: audio playback of prompts/answers via the Web Speech API.
 * Strictly feature-detected: if the device has no Dutch voice, the UI
 * shows no audio button at all (by design). No speech recognition.
 */

let voices: SpeechSynthesisVoice[] = [];

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function refreshVoices(): void {
  voices = window.speechSynthesis.getVoices();
}

export function initSpeech(): void {
  if (!speechSupported()) return;
  refreshVoices();
  // voices often load asynchronously
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

/** best available Dutch voice: prefer nl-NL, then any nl-* */
export function dutchVoice(): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null;
  if (!voices.length) refreshVoices();
  const nl = voices.filter((v) => v.lang?.toLowerCase().replace('_', '-').startsWith('nl'));
  if (!nl.length) return null;
  const nlnl = nl.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('nl-nl'));
  return nlnl.find((v) => /google|natural|online/i.test(v.name)) ?? nlnl[0] ?? nl[0];
}

export function canSpeakDutch(): boolean {
  return dutchVoice() !== null;
}

export function speakDutch(text: string): void {
  const voice = dutchVoice();
  if (!voice) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.9; // slightly slow for learners
  window.speechSynthesis.speak(u);
}

/**
 * The Dutch sentence to speak for an answered question, or null when there
 * is nothing sensible to say. Pure and testable:
 * - fill the blank with the correct answer
 * - questions without a blank (e.g. 'Past participle of "werken"?') speak
 *   just the answer
 * - strip parenthetical hints like "(werken)", quotes and ellipses
 * - position-skeleton answers (containing "…") cannot be reconstructed
 */
export function spokenText(q: Question): string | null {
  if (q.answer.includes('…')) return null;
  let s = q.q.includes('___') ? q.q.replace(/___/g, ` ${q.answer} `) : q.answer;
  s = s
    .replace(/\([^)]*\)/g, ' ')
    .replace(/→/g, ', ')
    .replace(/…/g, ' ')
    .replace(/["“”]/g, ' ')
    .replace(/\s+([.,!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return s || null;
}
