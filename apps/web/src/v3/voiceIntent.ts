/**
 * VOICEINTENT ENGINE [ADR-033] — prosody as typed data, not hardcoded scripts.
 * Every Astra line carries {pace, energy, pauses, emphasis, interruptible};
 * this engine maps intent → TTS behaviour (or text-first cadence), chunks by
 * sentence for natural breath, and returns a CANCEL function so the student
 * can interrupt her mid-sentence (interruption is first-class).
 */

import type { VoiceOut } from "../voice/tts.js";

export interface VoiceIntent {
  text: string;
  pace?: "slow" | "normal" | "quick";
  energy?: "quiet" | "warm" | "focused" | "excited";
  pauseBeforeMs?: number;
  pauseAfterMs?: number;
  emphasis?: string[];
  interruptible?: boolean;
}

export interface SpeakHandlers {
  onWord?: (wordsSoFar: number, total: number) => void;
  onEnd?: () => void;
}

function splitChunks(text: string): string[] {
  const parts = text.match(/[^.!?…]+[.!?…]*/g) ?? [text];
  return parts.map((p) => p.trim()).filter(Boolean);
}

const prosodyFor = (i: VoiceIntent) => ({
  rate: i.pace === "slow" ? 0.88 : i.pace === "quick" ? 1.07 : 0.97,
  pitch:
    i.energy === "excited" ? 1.13 :
    i.energy === "warm" ? 1.06 :
    i.energy === "quiet" ? 0.97 : 1.0,
});

/**
 * Speak one intent. Returns cancel(). Handles both TTS (chunked, prosody per
 * chunk, emphasis slightly brighter) and text-first (cadence simulation that
 * still honours pauses so the orb/rhythm stay identical either way).
 */
export function speakIntent(v: VoiceOut, intent: VoiceIntent, h: SpeakHandlers): () => void {
  const chunks = splitChunks(intent.text);
  const totalWords = intent.text.split(/\s+/).filter(Boolean).length;
  const { rate, pitch } = prosodyFor(intent);
  let cancelled = false;
  let ended = false;
  const timers: number[] = [];
  let spoken = 0;

  const finish = () => { if (!cancelled && !ended) { ended = true; h.onEnd?.(); } };

  const cancel = () => {
    cancelled = true;
    timers.forEach((t) => clearTimeout(t));
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  };

  const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

  const speakChunkTTS = (idx: number) => {
    if (cancelled) return;
    if (idx >= chunks.length) {
      if ((intent.pauseAfterMs ?? 0) > 0) timers.push(window.setTimeout(() => { if (!cancelled) finish(); }, intent.pauseAfterMs));
      else finish();
      return;
    }
    const chunk = chunks[idx]!;
    const hasEmphasis = (intent.emphasis ?? []).some((e) => chunk.toLowerCase().includes(e.toLowerCase()));
    const u = new SpeechSynthesisUtterance(chunk);
    if (v.voice) u.voice = v.voice;
    u.rate = Math.min(1.4, rate + (hasEmphasis ? 0.05 : 0));
    u.pitch = Math.min(1.8, pitch + (hasEmphasis ? 0.07 : 0));
    u.onboundary = () => { spoken += 1; if (!cancelled) h.onWord?.(spoken, totalWords); };
    u.onend = () => {
      if (cancelled) return;
      const gap = 110 + (intent.energy === "quiet" ? 160 : 40) + (idx === chunks.length - 1 ? 0 : 60);
      timers.push(window.setTimeout(() => speakChunkTTS(idx + 1), gap));
    };
    u.onerror = () => { if (!cancelled) speakChunkTTS(idx + 1); };
    window.speechSynthesis.speak(u);
  };

  const speakChunkText = (idx: number) => {
    if (cancelled) return;
    if (idx >= chunks.length) {
      if ((intent.pauseAfterMs ?? 0) > 0) timers.push(window.setTimeout(() => { if (!cancelled) finish(); }, intent.pauseAfterMs));
      else finish();
      return;
    }
    const chunk = chunks[idx]!;
    const words = chunk.split(/\s+/).filter(Boolean);
    const cadence = intent.pace === "slow" ? 320 : intent.pace === "quick" ? 250 : 285;
    words.forEach((w, wi) => {
      timers.push(window.setTimeout(() => {
        if (cancelled) return;
        spoken += 1;
        h.onWord?.(spoken, totalWords);
        if (idx === chunks.length - 1 && wi === words.length - 1) {
          const tail = (intent.pauseAfterMs ?? 200);
          timers.push(window.setTimeout(() => { if (!cancelled) h.onEnd?.(); }, tail));
        }
      }, wi * cadence));
    });
    timers.push(window.setTimeout(() => speakChunkText(idx + 1), words.length * cadence + 130));
  };

  const start = () => {
    if (cancelled) return;
    if ((intent.pauseBeforeMs ?? 0) > 0) {
      timers.push(window.setTimeout(() => (v.tier === "tts" ? speakChunkTTS(0) : speakChunkText(0)), intent.pauseBeforeMs));
    } else {
      if (v.tier === "tts") speakChunkTTS(0); else speakChunkText(0);
    }
  };
  start();

  return cancel;
}
