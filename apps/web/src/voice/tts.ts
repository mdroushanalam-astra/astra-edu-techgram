/**
 * VOICE OUT [ADR-032] — capability-gated. speechSynthesis with a first-run
 * quality probe; text-first fallback means the session NEVER depends on it.
 * Word-boundary events drive Astra's visemes.
 */

export interface VoiceOut { tier: "tts" | "text_first"; voice: SpeechSynthesisVoice | null; quality: number }

export function probeVoiceOut(): VoiceOut {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { tier: "text_first", voice: null, quality: 0 };
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return { tier: "text_first", voice: null, quality: 0 };
  const en = voices.filter((v) => v.lang.startsWith("en"));
  const pool = en.length ? en : voices;
  // heuristic quality: neural/named voices score higher; localService is a plus offline
  const scored = pool.map((v) => {
    let q = 0.45;
    const n = v.name.toLowerCase();
    if (/neural|natural|premium|enhanced|google|siri/.test(n)) q += 0.3;
    if (v.localService) q += 0.15;
    if (/compact|espeak|pico|festival/.test(n)) q -= 0.2;
    return { v, q: Math.max(0.1, Math.min(0.95, q)) };
  }).sort((a, b) => b.q - a.q);
  const best = scored[0]!;
  return best.q >= 0.55
    ? { tier: "tts", voice: best.v, quality: best.q }
    : { tier: "text_first", voice: null, quality: best.q };
}

export interface SpeakHandlers { onWord?: (i: number, total: number) => void; onEnd?: () => void }

/** Speak an utterance with the chosen voice. No-op in text_first tier. */
export function speak(v: VoiceOut, text: string, h: SpeakHandlers = {}): void {
  if (v.tier !== "tts" || typeof window === "undefined" || !("speechSynthesis" in window)) {
    // text_first: simulate a gentle reading cadence so Astra still "speaks" visually
    const words = text.split(/\s+/).length;
    const step = Math.max(220, Math.min(420, 34000 / Math.max(1, text.length) * 12));
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      h.onWord?.(i, words);
      if (i >= words) { clearInterval(iv); h.onEnd?.(); }
    }, step);
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (v.voice) u.voice = v.voice;
  u.rate = 0.97; u.pitch = 1.04; u.volume = 1;
  const total = text.split(/\s+/).length;
  let i = 0;
  u.onboundary = () => { i += 1; h.onWord?.(i, total); };
  u.onend = () => h.onEnd?.();
  u.onerror = () => h.onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
