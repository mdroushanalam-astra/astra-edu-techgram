# TECHGRAM — CURRENT STATE
## The living snapshot. Update after EVERY session — this is the front door.

> **Read me alone:** this page is refreshed after every session and is written to stand on its own — what works, what doesn't, what's next, and how to verify it. Non-technical readers: `FOUNDER_GUIDE.md` tells the same story in plain language.

**Snapshot:** 2026-10-02, ~14:30 (local) · Kernel 0.1.0+ (commits `d535e9b`→`b44fa3c`→`6c21c66`→`c5229c8`→freeze) · **111/111 tests green, typecheck clean** · Phase: **V1-A — TEACHING LAYER COMPLETE, backend freeze inspection PASSED** · Git: `main`, 5 commits · Session model: GLM-5.3-Flash (Z.ai) via ZCode

---

## 1. One-paragraph position

The full closed loop now exists in the TypeScript kernel: envelope → events → belief (graph-prior Kalman) → memory → exam Monte-Carlo → CAT diagnostic → AOM → robust planner → **composer (B7) → teacher (B8: 14 moves over 84 verified atoms) → student turns → typed evidence → belief/memory/misconception update (B10) → AOM prediction errors** — with receipts on every layer, plus mock post-mortem + attempt coach (B11) and the behaviour engine (B9, internal flags only). The freeze inspection proves it end-to-end: a 10-day closed loop produces TRUE learning vs a no-teaching control, beliefs track hidden truth (error <0.25), weak topics get scheduled and improve, 3-day logs replay bit-for-bit, and not one decision touches an LLM. What remains for V1-A: Brain Lab web (8 screens) + content depth (84→150 atoms, 80→500 items). V1-B (student PWA + sync) is gated on V1-A.

## 2. What works (verified — see EXPERIMENTS_AND_TESTS for numbers)

| Capability | Status | Proof |
|---|---|---|
| Learning Envelope (7 rules + no-upgrade) | ✅ live | `test/envelope.test.ts` |
| Belief engine (prior, EKF, decay, Elo 2nd opinion, honest bands) | ✅ live | `test/belief.test.ts` |
| Memory engine (Techgram Memory Model, spacing rule) | ✅ live | `test/memory.test.ts` + ADR-006 |
| **B5.5 Action Outcome Model** (predict→record→act→observe→error→approve, closed-loop ban) | ✅ live | `test/aom.test.ts` + end-to-end loop test |
| Exam Monte-Carlo (negative marking, attempt policy) | ✅ live | `test/exam.test.ts` |
| CAT diagnostic (info gain, 20–25 items, bands) | ✅ live | `test/diagnostic.test.ts` |
| Planner (robust, VoI, prereq sequencing, triage, review quota; gains 100% AOM-sourced) | ✅ live | `test/planner.test.ts` + sweep §5 |
| Event fabric (idempotent, replay == fold, bit-identical) | ✅ live | `test/events.test.ts` + replay test |
| Receipts (AOM version, per-block predictions, assumptions, outcome join) | ✅ live | `test/planner.test.ts` |
| **G0 four worlds** (friendly/misspecified/adversarial/sealed-hidden) | ✅ planner useful in ALL; edge grows hostile | `test/g0_worlds.test.ts` + EXPERIMENTS §10 |
| Brain Lab demo (CLI) | ✅ runs end-to-end | `npm run brainlab` |
| Git version control | ✅ `main`, 2 commits | `git log` |
| Python prototype | 🗄️ archived reference (50/50) | EXPERIMENTS §2 |

## 3. What does NOT exist yet (honest)

- **B7 session composer + B8 teacher** (12-move state machine, atoms, hint ladders, doubts cascade) — no teaching surface yet; "sessions" are planner blocks + simulated items.
- **B11 mock post-mortem + attempt coach** (the data-light wow).
- **B9 behaviour engine** (features, archetypes, probes, notification policy).
- **Any frontend/PWA, sync server, persistence** — kernel is pure functions; nothing persists students yet.
- **Content depth:** 80/500 items; 150 atoms = 0; PYQ weight table is coarse (per-topic expected questions).
- **Misconception engine consumption** (tags exist; B10 posterior + CONTRAST wiring pending).
- **Git:** no repo initialized — single-copy risk.

## 4. Next actions (V1-A completion, then V1-B)

1. **Brain Lab web (8 screens, ADR-014 pt.32)** — the public proof page; the CLI demo already runs all acts.
2. **Content sprint:** atoms 84→150 (2 variants for top 20 concepts), items 80→500, PYQ weights refine — **needs founder/mentor verification hours (the critical path)**.
3. **B11 wiring into the PWA surface** (mock centre) + B9 flags feeding the planner (lighten/rest).
4. **V1-B (only after V1-A gates hold):** PWA shell (offline queue, service worker), sync server + recompute-and-verify, tamper tests, chaos day.
5. **Pilot:** 20–30 aspirants, 3+ weeks, pre-registered kill/continue criteria (G3).
6. **Overdue hygiene:** none — git live; keep committing per session.

## 5. Known risks & open questions

- **Fixed-order margin is thin (+1–2 marks aggregate)** — the honest weak spot; expected to grow with real-world messiness, uplift data, and personalised memory params; do not oversell in public copy.
- **Content verification throughput** is the critical path — needs founder/mentor hours committed.
- **No git repo** — initialize before the next code session (10 minutes, high value).
- **Level-error growth in long sims** — conservative gain priors under-predict fast learners; slow-loop re-fitting is the designed cure (registered, not hidden).
- Kernel params are all `assumed` — replace via empirical Bayes only at ~500 students (assumptions register in 04_ARCHITECTURE §8).

## 6. How to run / verify

```
npm test            # 58 tests + CI gates
npm run brainlab    # 4-act public demo
npm -w kernel run typecheck
```

## 7. Pointers

**Non-technical:** `FOUNDER_GUIDE.md` (the whole project in plain language + dictionary) · Soul: `00_CHARTER.md` · Memory: `PROJECT_JOURNAL.md` · Evidence: `EXPERIMENTS_AND_TESTS.md` · Changes: `DECISIONS.md` · Machine pointer: `RESUME.json` · Protocol: `README.md` · Architecture spec: `04_ARCHITECTURE.md` · Roadmap: `05_ROADMAP.md`
