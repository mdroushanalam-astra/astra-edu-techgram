# TECHGRAM — CURRENT STATE
## The living snapshot. Update after EVERY session — this is the front door.

> **Read me alone:** this page is refreshed after every session and is written to stand on its own — what works, what doesn't, what's next, and how to verify it. Non-technical readers: `FOUNDER_GUIDE.md` tells the same story in plain language.

**Snapshot:** 2026-10-02, ~15:10 (local) · Kernel 0.1.0+ (8 commits, latest `6eb4466`) · **116/116 tests green, typecheck clean** · Phase: **V1-A complete except Brain Lab web + content depth — FRONTEND GREEN-LIT (2 waves)** · Git: `main` · Session model: GLM-5.3-Flash (Z.ai) via ZCode

---

## 1. One-paragraph position

The full closed loop now exists and is proven in the TypeScript kernel: envelope → events → belief → memory → exam model → diagnostic → AOM → planner → composer → teacher (14 moves over 105 verified atoms) → evidence → state — plus mock post-mortem + attempt coach (B11), behaviour engine (B9, internal flags only), misconception tiers (B10), four-world simulator gate, receipts everywhere, zero LLM decisions. **Two new proofs this session: (1) GOAL-AGNOSTICISM — the same brain runs CBSE Class 8 Science (K12 seed: 14 concepts / 25 items / 21 atoms, original licensing-clean content) with ZERO kernel changes; (2) the full audit — 116/116 tests, G0 four-worlds green in-run, 0 type errors.** Frontend GREEN-LIT in two waves: Wave-1 Brain Lab web (pure presentation over the kernel — the brain is TypeScript and runs client-side), Wave-2 Student PWA + sync server. Blueprint: `06_FRONTEND_BLUEPRINT.md` · K12 licensing research: `07_OPEN_MATERIALS_RESEARCH.md`.

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
