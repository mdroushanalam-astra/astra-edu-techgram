/**
 * Deterministic linear algebra + RNG.
 * Every function here is pure; randomness only via a seeded RNG that the
 * caller owns and logs. This is what makes replay bit-for-bit possible.
 */

/** mulberry32 — small, fast, seedable PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  next(): number; // uniform [0,1)
  normal(mu?: number, sd?: number): number; // Box-Muller
  int(maxExclusive: number): number;
  pick<T>(arr: T[]): T;
}

export function makeRng(seed: number): Rng {
  const base = mulberry32(seed);
  let spare: number | null = null;
  const rng: Rng = {
    next: () => base(),
    normal(mu = 0, sd = 1) {
      if (spare !== null) {
        const s = spare;
        spare = null;
        return mu + sd * s;
      }
      let u = 0, v = 0;
      while (u === 0) u = base();
      while (v === 0) v = base();
      const mag = Math.sqrt(-2 * Math.log(u));
      spare = mag * Math.sin(2 * Math.PI * v);
      return mu + sd * mag * Math.cos(2 * Math.PI * v);
    },
    int(maxExclusive: number) {
      return Math.floor(base() * maxExclusive);
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(base() * arr.length)];
    },
  };
  return rng;
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// ---------- dense matrix helpers (row-major Float64Array, N×N) ----------

export function matVec(A: Float64Array, x: Float64Array, N: number, out: Float64Array): Float64Array {
  for (let i = 0; i < N; i++) {
    let s = 0;
    const row = i * N;
    for (let j = 0; j < N; j++) s += A[row + j] * x[j];
    out[i] = s;
  }
  return out;
}

/** Gauss-Jordan inversion. Throws on singular matrix. */
export function invert(A: Float64Array, N: number): Float64Array {
  const aug = new Float64Array(N * 2 * N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) aug[i * 2 * N + j] = A[i * N + j];
    aug[i * 2 * N + N + i] = 1;
  }
  for (let col = 0; col < N; col++) {
    // pivot
    let pivot = col;
    let best = Math.abs(aug[col * 2 * N + col]);
    for (let r = col + 1; r < N; r++) {
      const v = Math.abs(aug[r * 2 * N + col]);
      if (v > best) {
        best = v;
        pivot = r;
      }
    }
    if (best < 1e-12) throw new Error(`invert: singular matrix at col ${col}`);
    if (pivot !== col) {
      for (let j = 0; j < 2 * N; j++) {
        const t = aug[col * 2 * N + j];
        aug[col * 2 * N + j] = aug[pivot * 2 * N + j];
        aug[pivot * 2 * N + j] = t;
      }
    }
    const d = aug[col * 2 * N + col];
    for (let j = 0; j < 2 * N; j++) aug[col * 2 * N + j] /= d;
    for (let r = 0; r < N; r++) {
      if (r === col) continue;
      const f = aug[r * 2 * N + col];
      if (f === 0) continue;
      for (let j = 0; j < 2 * N; j++) aug[r * 2 * N + j] -= f * aug[col * 2 * N + j];
    }
  }
  const inv = new Float64Array(N * N);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) inv[i * N + j] = aug[i * 2 * N + N + j];
  return inv;
}

/** Cholesky–Banachiewicz for SPD matrices. Throws if not PD. */
export function cholesky(A: Float64Array, N: number): Float64Array {
  const L = new Float64Array(N * N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i * N + j];
      for (let k = 0; k < j; k++) s -= L[i * N + k] * L[j * N + k];
      if (i === j) {
        if (s <= 1e-12) throw new Error("cholesky: matrix not positive definite");
        L[i * N + j] = Math.sqrt(s);
      } else {
        L[i * N + j] = s / L[j * N + j];
      }
    }
  }
  return L;
}

/** Sample from N(mu, Sigma) given a precomputed Cholesky factor L. */
export function sampleMVN(mu: Float64Array, L: Float64Array, N: number, rng: Rng, out: Float64Array): Float64Array {
  for (let i = 0; i < N; i++) {
    let s = 0;
    for (let j = 0; j <= i; j++) s += L[i * N + j] * rng.normal(0, 1);
    out[i] = mu[i] + s;
  }
  return out;
}

export function hashState(x: Float64Array): string {
  // FNV-1a over the bits — for replay determinism checks.
  let h = 0x811c9dc5;
  const view = new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
  for (let i = 0; i < view.length; i++) {
    h ^= view[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
