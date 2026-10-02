# TECHGRAM — CURRENT STATE
## The living snapshot. Update after EVERY session — this is the front door.

> **Read me alone:** this page is refreshed after every session and is written to stand on its own — what works, what doesn't, what's next, and how to verify it. Non-technical readers: `FOUNDER_GUIDE.md` tells the same story in plain language.

**Snapshot:** 2026-10-02, ~13:00 (local) · Kernel 0.1.0+ (commits `d535e9b`, `b44fa3c`) · **77/77 tests green, typecheck clean** · Phase: **V1-A "The Brain" — AOM + four worlds DONE; teacher next** · Git: initialized (`main`, 2 commits) · Session model: GLM-5.3-Flash (Z.ai) via ZCode

---

## 1. One-paragraph position

The complete deterministic intelligence core exists and is proven — now with its learning organ. The TS kernel carries: envelope → events → belief (graph-prior Kalman) → memory → exam Monte-Carlo → CAT diagnostic → **B5.5 Action Outcome Model** (predictions recorded before every action, evidence-based outcomes, shrinkage learning, human-gated updates, closed-loop ban enforced in code) → robust planner → receipts. The simulator gate is now **four generative worlds** (friendly/misspecified/adversarial/sealed-hidden), and the planner passed all of them — its edge *grows* as worlds diverge from its assumptions. Zero LLM anywhere. Polity seed (10 topics / 40 concepts / 80 tagged items). What does NOT exist yet: the teaching surface (composer/teacher/atoms), mock post-mortem, behaviour engine, any UI. The Python prototype is archived as reference. Repo is now git-versioned.

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
