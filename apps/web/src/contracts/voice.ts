/**
 * SPRINT 0 — VOICE CAPABILITY TIERS [ADR-032]
 * Voice is never a dependency for learning. The honest contract (ChatGPT
 * refinement adopted): browser TTS and on-device Whisper are viable but
 * NOT uniform across devices — memory, latency, thermal, battery, mic
 * permissions and browser differences are real. So: capability-gated
 * tiers, resolved at runtime, with text/tap universal at Tier 0.
 */

export interface VoiceCapabilities {
  /** speechSynthesis present + at least one usable voice. */
  ttsOut: boolean;
  /** Median TTS voice quality score from the first-run probe (0..1). */
  ttsQuality: number;
  /** WebGPU available (WebGPU EP of ONNX Runtime Web). */
  webgpu: boolean;
  /** Device memory hint from navigator (GB), when exposed. */
  deviceMemoryGb?: number;
  /** getUserMedia permission state for the microphone. */
  micPermission: "granted" | "prompt" | "denied" | "unknown";
  /** On-device ASR model already downloaded (Wi-Fi consent flow). */
  asrModelReady: boolean;
  /** Hardware class from the perf harness (sprint 1). */
  perfClass: "low" | "mid" | "high";
}

export type VoiceOutTier = "tts" | "text_first";
export type VoiceInTier = "local_asr" | "network_asr_optional" | "text_only";

/**
 * Resolve the OUTPUT tier. Teacher speech is additive; the session must
 * survive (gracefully, beautifully) with text-first presentation.
 */
export function resolveVoiceOutTier(c: VoiceCapabilities): { tier: VoiceOutTier; reason: string } {
  if (c.ttsOut && c.ttsQuality >= 0.55) return { tier: "tts", reason: "usable system voice detected" };
  return { tier: "text_first", reason: "no acceptable voice — text-first presentation (session never breaks)" };
}

/**
 * Resolve the INPUT tier. Local-first (audio never leaves the device),
 * network only as an explicit opt-in, text-only as the always-present floor.
 */
export function resolveVoiceInTier(c: VoiceCapabilities): { tier: VoiceInTier; reason: string } {
  if (c.micPermission === "denied") return { tier: "text_only", reason: "microphone denied — respect it" };
  if (c.asrModelReady && c.perfClass !== "low" && (c.webgpu || (c.deviceMemoryGb ?? 0) >= 4)) {
    return { tier: "local_asr", reason: "on-device model ready + capable hardware (WebGPU or ≥4GB)" };
  }
  if (c.perfClass !== "low") return { tier: "network_asr_optional", reason: "capable device, model not downloaded — offer opt-in" };
  return { tier: "text_only", reason: "low perf class — text/tap is the honest floor" };
}

/** The first-run voice probe score: a cheap synthesized sample + user's "can you hear this well?" */
export const VOICE_PROBE_THRESHOLD = 0.55;
