# TECHGRAM — CURRENT STATE
## The living snapshot. Update after EVERY session — this is the front door.

> **Read me alone:** this page is refreshed after every session and is written to stand on its own — what works, what doesn't, what's next, and how to verify it. Non-technical readers: `FOUNDER_GUIDE.md` tells the same story in plain language.

**Snapshot:** 2026-10-02, ~11:45 (local) · Kernel 0.1.0 · **58/58 tests green, typecheck clean** · Phase: **1 complete → V1-A (The Brain) next** · Branch: n/a (no git repo yet — see risks) · Session model: GLM-5.3-Flash (Z.ai) via ZCode · **Spec updated by external review adjudication (ADR-014…019) — code intentionally unchanged (founder instruction)**

---

## 1. One-paragraph position

The complete deterministic intelligence core exists and is proven in the TypeScript kernel: envelope → events → belief (graph-prior Kalman) → memory (FSRS-lite) → exam Monte-Carlo → CAT diagnostic → robust exam-date planner with receipts → simulator-verified against baselines. Zero LLM anywhere. A Polity seed (10 topics / 40 concepts / 80 tagged items) gives it something to reason over. What does NOT exist yet: the teaching surface (composer/teacher/atoms), mock post-mortem, behaviour engine, and any UI. The Python prototype is archived as reference. The doc system (Charter/Journal/Experiments/Decisions/README protocol) went live this session.

## 2. What works (verified — see EXPERIMENTS_AND_TESTS for numbers)

| Capability | Status | Proof |
|---|---|---|
| Learning Envelope (7 rules + no-upgrade) | ✅ live | `test/envelope.test.ts` |
| Belief engine (prior, EKF, decay, Elo 2nd opinion, honest bands) | ✅ live | `test/belief.test.ts` |
| Memory engine (FSRS-lite, spacing rule) | ✅ live | `test/memory.test.ts` + ADR-006 |
| Exam Monte-Carlo (negative marking, attempt policy) | ✅ live | `test/exam.test.ts` |
| CAT diagnostic (info gain, 20–25 items, bands) | ✅ live | `test/diagnostic.test.ts` |
| Planner (robust, VoI, prereq sequencing, triage, review quota) | ✅ live | `test/planner.test.ts` + sweep §5 |
| Event fabric (idempotent, replay == fold, bit-identical) | ✅ live | `test/events.test.ts` + replay test |
| Receipts (assumptions, unknowns, outcome join) | ✅ live | `test/planner.test.ts` |
| Planner beats baselines (archetype aggregate) | ✅ +2.4 vs fixed / +6.2 vs random (30d) | sweep §5 |
| Brain Lab demo | ✅ runs end-to-end | `npm run brainlab` |
| Python prototype | 🗄️ archived reference (50/50) | EXPERIMENTS §2 |

## 3. What does NOT exist yet (honest)

- **B7 session composer + B8 teacher** (12-move state machine, atoms, hint ladders, doubts cascade) — no teaching surface yet; "sessions" are planner blocks + simulated items.
- **B11 mock post-mortem + attempt coach** (the data-light wow).
- **B9 behaviour engine** (features, archetypes, probes, notification policy).
- **Any frontend/PWA, sync server, persistence** — kernel is pure functions; nothing persists students yet.
- **Content depth:** 80/500 items; 150 atoms = 0; PYQ weight table is coarse (per-topic expected questions).
- **Misconception engine consumption** (tags exist; B10 posterior + CONTRAST wiring pending).
- **Git:** no repo initialized — single-copy risk.

## 4. Next actions (V1-A "The Brain" first — ADR-017; build order per ADR-015/016/018)

1. **B5.5 Action Outcome Model:** extract gain priors from planner params into a versioned `aom.ts`; record predictions in receipts BEFORE actions; wire `joinOutcome` + prediction-error into the session loop. The never-self-fooling loop becomes code.
2. **Four simulator worlds (G0 re-run):** extend `lab.ts` with World B (misspecified) and World C (adversarial) configs; freeze a World D hidden-benchmark pack; re-run the gate — expect honest re-baselining of the friendly-world numbers.
3. **B7+B8:** session composer + teacher state machine + first 30–50 verified atoms — makes a *teachable* loop.
4. **B11:** mock post-mortem + attempt-policy coach (two 50Q sectional mocks; deterministic error classification).
5. **B9 behaviour engine (priority RAISED, ADR-018):** daily features, archetype hypotheses (internal only), belief probes, notification policy — the personalization engine.
6. **Brain Lab web (8 screens)** + PWA shell + sync + server recompute-and-verify (chaos + tamper tests).
7. **Content sprint:** items 80→500 (quality bar per ADR-014 point 38), atoms 0→150, PYQ weights refine.
8. **Git init (overdue).**

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
