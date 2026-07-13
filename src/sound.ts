/* Answer sounds synthesized with the Web Audio API: no audio files to
   load or precache, so the offline story is unchanged. The context is
   created lazily on the first answer click (a user gesture, so autoplay
   policies allow it). */

let ctx: AudioContext | null = null;
let on = true;

export function setSoundEnabled(v: boolean): void {
  on = v;
}

function ensureCtx(): AudioContext | null {
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** one short enveloped note; glideTo bends the pitch over the duration */
function note(c: AudioContext, freq: number, at: number, dur: number, type: OscillatorType, peak: number, glideTo?: number): void {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, at + dur);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(peak, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(c.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

/** two quick rising notes: a bright "ding" */
export function playCorrect(): void {
  if (!on) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  note(c, 660, t, 0.12, 'sine', 0.12);
  note(c, 880, t + 0.08, 0.18, 'sine', 0.12);
}

/** soft low thud, deliberately gentle: a miss should not sting */
export function playWrong(): void {
  if (!on) return;
  const c = ensureCtx();
  if (!c) return;
  note(c, 180, c.currentTime, 0.2, 'triangle', 0.1, 110);
}

/** small ascending arpeggio when a round of questions is completed */
export function playRoundComplete(): void {
  if (!on) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  note(c, 523.25, t, 0.12, 'sine', 0.1);
  note(c, 659.25, t + 0.09, 0.12, 'sine', 0.1);
  note(c, 783.99, t + 0.18, 0.24, 'sine', 0.11);
}
