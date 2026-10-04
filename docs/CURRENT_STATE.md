# TECHGRAM — CURRENT STATE
## The living snapshot. Update after EVERY session — this is the technical front door.

> **Read me alone:** refreshed after every session; stands on its own. Non-technical readers: `FOUNDER_GUIDE.md` tells the same story in plain language.
> **Integrity:** all counts in this file are backed by `COUNTERS.json` (generated from the code by `npm run counters`) and enforced by `kernel/test/docs_integrity.test.ts`. If this page contradicts reality, the docs-integrity test fails — fix reality or the doc, never silently.

**Snapshot:** 2026-10-04, ~15:45 (local) · Kernel 0.1.0+ · **237/237 tests green (kernel 228 in 26 files + frontend contracts 9), typecheck clean** · Phase: **S4 IN THE LOOP [ADR-041, Journal Entry 43] — the cognitive frontier is CLOSED: on top of the closed developmental loop [ADR-040], the Executive now runs LIVE strategy experiments — a ledger pattern becomes a falsifiable proposal, a matched A/B in the simulator decides on TRUE learning (keep/reject, ties reject), kept parameters are ADOPTED into future sessions and measurably change decisions; rejected proposals change nothing (the veto is proven). The five pre-pilot questions [ADR-039] ALL pass: decide ✓ explain ✓ predict itself ✓ investigate itself ✓ change behavior ✓. NEXT (founder's explicit order): PHASE 4 expression — gated on the founder's go; frontend v4 screens 9–15 in parallel**

---

## 1. One-paragraph position

System A (the frozen brain) is untouched and frozen: envelope → events → belief (graph-prior Kalman) → memory → exam Monte-Carlo → CAT diagnostic → AOM → robust planner → composer → teacher (15 moves over verified atoms) → evidence → belief/memory/misconception update → AOM prediction errors, receipts on every layer, behaviour/agency/allocation wired [ADR-023..030], goal-agnostic (UPSC Polity + CBSE Cl-8 as config). System B (the cognitive runtime) now has a **closed developmental loop** [ADR-040] **and a live improvement cycle** [ADR-041]: `cognitive/developmental-session.ts` composes S0–S4 into the Executive (S1 self-predictions BEFORE every decision, structural S2 judging after every turn, `deriveSelfInsights()` mapping the SelfErrorLedger to self-knowledge injected into later workspaces, every insight carrying a behavioral lever); `cognitive/strategy-experiments.ts` closes the improvement cycle — a ledger pattern (≥3 same-tag errors) becomes ONE falsifiable strategy proposal, a matched A/B simulator (same world, same seeds, ONLY the parameter differs) decides on TRUE learning, kept parameters are adopted into future sessions (`config.strategy`), rejected ones change nothing, ties reject. The counterfactual is architecture (`learningEnabled:false` = same experience, zero influence, factory settings). The deep gate is a REAL session flow: every executive directive becomes an ExperiencePlan (validated seam) and is conducted into ordered steps (80 plans / 390 steps per gate run). The five pre-pilot questions [ADR-039]: decide ✓ · explain ✓ · predict itself ✓ · investigate itself ✓ · change behavior ✓. All evidence remains SIMULATED — real-student efficacy UNKNOWN UNTIL PILOT.

## 2. What works (verified — see EXPERIMENTS_AND_TESTS for numbers)

| Capability | Status | Proof |
|---|---|---|
| **THE DEVELOPMENTAL LOOP** (S1 before decisions → S2 structural judging → ledger → insights → different decisions) | ✅ INTEGRATION-TESTED [ADR-040] | `test/counterfactual.test.ts` (rewritten OPEN→CLOSED) |
| **S4 IN THE LOOP** (ledger pattern → falsifiable proposal → matched A/B → keep/reject on true learning → ADOPTED strategy changes future decisions; rejected = identical traces; ties reject) | ✅ INTEGRATION-TESTED [ADR-041] | `test/strategy-experiments.test.ts` (13 tests) |
| **StrategyParameters** (the Executive's own tunables, explicit + versioned; frozen-organ params untouchable) | ✅ live | `cognitive/executive.ts` + S4 tests |
| **Self-model levers in the Executive** (early/aggressive/reluctant/late/caution — each changes candidate generation or scoring) | ✅ live | `cognitive/executive.ts` + counterfactual test |
| **DEEP GATE: executive beats linear on TRUE MARKS** — 12 vs 10, 12/12 seeds +1..+3; belief error 0.20 vs 0.40; accuracy 53% vs 20% | ✅ MATCHED-BASELINE-VALIDATED (simulated) | `cognitive/deep-gate.ts` + counterfactual test |
| **Conductor in a real session flow** (directive → ExperiencePlan → validate → conduct → advance; 80 plans/390 steps per gate run) | ✅ INTEGRATION-TESTED | `deep-gate.ts` + counterfactual test |
| C1 Cognitive Executive (workspace → candidates → constraints → consequence-aware select → receipt) | ✅ live [ADR-035] | `test/executive.test.ts` |
| S0–S4 developmental core (genesis, selfPredict, ledger, self-inquiry, strategy experiments, phase2 gate) | ✅ live | `test/phase2.test.ts` |
| ExperiencePlan seam (six channels + validateExperiencePlan) + Conductor | ✅ live [ADR-038/039] | `test/phase3.test.ts` |
| Universal primitives + ownership boundaries (13 organs, no-upgrade law) | ✅ live | `test/phase0.test.ts` |
| Learning Envelope (7 rules + no-upgrade) | ✅ live | `test/envelope.test.ts` |
| Belief engine (prior, EKF, decay, Elo 2nd opinion, honest bands) | ✅ live | `test/belief.test.ts` |
| Memory engine (Techgram Memory Model, spacing rule) | ✅ live | `test/memory.test.ts` + ADR-006 |
| B5.5 AOM (predict→record→act→observe→error→approve; closed-loop ban) | ✅ live | `test/aom.test.ts` |
| Exam Monte-Carlo + CAT diagnostic | ✅ live | `test/exam.test.ts` / `test/diagnostic.test.ts` |
| Planner (robust, VoI, prereq sequencing; 100% AOM-sourced) | ✅ live | `test/planner.test.ts` |
| **G0 four worlds** (friendly/misspecified/adversarial/sealed-hidden) | ✅ planner useful in ALL | `test/g0_worlds.test.ts` + §10 |
| B7 composer / B8 teacher / B10 misconceptions / B11 post-mortem / B9 behaviour | ✅ live | `test/closed_loop.test.ts` / `test/postmortem_behaviour.test.ts` |
| Personalisation State v1 + Allocation wires + Agency Transfer + opportunity cost | ✅ live [ADR-024/030] | `test/personalisation.test.ts` / `test/allocation.test.ts` |
| Brain Freeze v0.1 (signed boundary; frozen organs behaviorally unchanged) | ✅ SIGNED [ADR-031] | `docs/BACKEND_FREEZE_CHECKLIST.md` |
| Chaos/failure injection + docs-integrity gate + anti-Goodhart audit | ✅ live | `test/chaos_injection.test.ts` / `test/docs_integrity.test.ts` |
| Frontend: v4 Obsidian & Amber screens 1–8 + metrics debrief (neon workspace, Astra with face, the Mountain) | ✅ built + browser-verified | `apps/web/src/v4/*` |
| Frontend contracts (claim-provenance evidence graph, scene graph, voice tiers) | ✅ live | `apps/web/test/contracts.test.ts` |

## 3. What does NOT exist yet (honest — the true remaining gaps)

- **Expression & Presence (Phase 4):** the Conductor emits ordered steps but nothing renders them in the product UI yet — expression work is GATED on the founder's explicit order (his standing directive: stop here until he says go).
- **Level-3 self-modification (representation):** ADR-041 deliberately demonstrates levels 1–2 only (parameter/strategy); representation-level change stays on the not-built list.
- **The S4 harness is a compact declared-constants world** — exercising proposals against the full four-world harness is future hardening.
- **Content floor** — the bank holds **105 verified items · 104 verified atoms** (13 topics / 54 concepts) against the V1-A floor of 500 items / 150 atoms; PYQ weight table coarse. **Founder/mentor verification hours = the critical path.**
- **Wave-2 backend pieces:** sync server (recompute-and-verify), student auth, push delivery. Gated.
- **Real-student evidence:** all developmental-loop, gate, and strategy-experiment evidence is SIMULATED-world; calibration curves need the pilot (G3). Real-student efficacy UNKNOWN UNTIL PILOT.
- **Hindi/bilingual atoms** (`lang` field exists; content not authored).
- **Mains scoring, Connect, Career, K12 launch, minors** — deferred per ADR-011; K12 content is prep, not launch (ADR-020).

## 4. Next actions (ordered)

1. **PHASE 4 — EXPRESSION (founder-gated, HIS explicit stop order):** Conductor steps → Presence Layer → renderer; "why-this" moments and visible self-correction in the product UI. DO NOT START without the founder's go.
2. **Frontend v4 (parallel, founder-directed):** screens 9–11 session polish + teacher wrap-up → 13–15 → motion pass → Real-World Layer.
3. **Content sprint (parallel, Founder + mentor):** items 105→500, atoms 104→150 — **still the true critical path.**
4. **Exercise the S4 harness against sealed hidden worlds** before any public claim (ADR-016 claim discipline).
5. **Wave-2 (gated):** persistence → sync/recompute → tamper test → offline chaos → student PWA.
6. **Limited public beta:** 20–30 aspirants, 3+ weeks, 4-layer measurement (Learning / Retention / Decision quality / **Agency** [ADR-029]) — pre-registered G3 criteria, Founder recruits.

## 5. Risks & standing uncertainty register [adopted 2026-10-02]

| Bucket | Level | What it means |
|---|---|---|
| Engineering | 🟢 low-medium | Core architecture credible; 224 tests + chaos injection + probes; the developmental loop now counterfactual-proven [ADR-040] |
| Product | 🟡 HIGH | Will students find the loop useful enough to return? Unknown until pilot |
| Scientific / learning-effect | 🔴 VERY HIGH | Does the AOM predict real interventions? Does durable learning improve? Needs delayed outcomes from real students — the honest frontier |

Also: content-verification throughput is the schedule risk; friendly-world planner margin is thin (+0.4 — re-baselined honestly); deep-gate evidence is simulated-world (the world's learning rule is declared, not measured); multi-worker deployment rules out the singleton pattern in Wave-2 server design.

## 6. How to run / verify

```
npm test                        # 237 tests (kernel 228 + frontend contracts 9) incl. G0 four-worlds + chaos injection + docs-integrity gate + the loop-closure counterfactual
npx tsx kernel/src/cognitive/deep-gate.ts   # (import runDeepGate) the matched-baseline gate — see EXPERIMENTS §17
npm run counters                # regenerate docs/COUNTERS.json from the code
npm run brainlab                # CLI demo (5 acts)
npm -w kernel run typecheck
cd apps/web && npm run dev      # the v4 product (dev)
cd apps/brainlab && npm run preview  # Wave-1 web (production build)
```

## 7. Pointers
> **Observable-State Law [ADR-023]:** all personalisation is a model of the student's OBSERVABLE learning state and behaviour — explicitly uncertain, never internal-state claims, never labels. The Engagement Ethics Wall bans guilt/urgency/exploitation mechanics permanently.
> **The developmental law [ADR-037/040]:** no self-update without evidence; no strategy change without a falsifiable hypothesis and an evaluation path; the counterfactual (`learningEnabled:false`) is the standing proof that self-knowledge — not the passage of time — changes behavior.

**Non-technical:** `FOUNDER_GUIDE.md` · Soul: `00_CHARTER.md` · Star: `02_NORTH_STAR.md` · Memory: `PROJECT_JOURNAL.md` · Evidence: `EXPERIMENTS_AND_TESTS.md` · Changes: `DECISIONS.md` (ADR-001…041) · **Freeze boundary: `BACKEND_FREEZE_CHECKLIST.md`** · Ideas registry: `08_VISION_LEDGER.md` · Machine pointer: `RESUME.json` · Protocol: `README.md` · Architecture: `04_ARCHITECTURE.md` · Roadmap: `05_ROADMAP.md` · Master roadmap: `10_MASTER_ROADMAP.md` · Frontend: `06_FRONTEND_BLUEPRINT.md` · K12 research: `07_OPEN_MATERIALS_RESEARCH.md` · Counts: `COUNTERS.json`
