# TECHGRAM — BRAIN FREEZE v0.1 — SIGNED CHECKLIST
## The cognitive architecture is frozen. The next mountain is reality, not engineering.

> **What this is:** the explicit, signed boundary of the brain freeze [ADR-031, Gate-1 of the release ladder]. "Freeze" means: **no new cognitive subsystem before real-user evidence.** This document is the contract every future session reads before touching the kernel.

**Frozen at:** 2026-10-03, Gate-0 audit passed · **Suite:** 174/174 tests, 20 files, typecheck clean · **Model:** GLM-5.3-Flash (Z.ai) via ZCode · **Directed by:** the Founder · **Audit evidence:** `EXPERIMENTS_AND_TESTS.md` §16, probes in `scripts/freeze_probes.mts`

---

## 1. WHAT IS FROZEN (the cognitive architecture)

| Organ | Module(s) | Frozen contract |
|---|---|---|
| Envelope (provenance on every fact) | `envelope.ts` | 7 rules + no-upgrade invariant |
| Event fabric (state = projection of events) | `events.ts` | typed events, idempotency keys, spacing rule, `agency_observed`; replay is bit-identical |
| Belief engine (graph-prior Kalman) | `belief.ts` | rank-1 EKF, honest bands, Elo second opinion, grey = nEff<3 |
| Memory (Techgram Memory Model) | `memory.ts` | S/D/R cells, spacing rule, growth cap |
| Exam Monte-Carlo | `exam.ts` | 2000-draw exam day, negative marking, attempt policy |
| CAT diagnostic | `diagnostic.ts` | information-gain selection, 20–25 items, bands |
| AOM (Action Outcome Model) | `aom.ts` | predict→record→act→observe→error→learn; closed-loop ban in `approve()`; approval stamped on the pack |
| Planner (the allocator) | `planner.ts` | robust draws, VoI, prereq gate, two-pass fill, triage; consumes PersonalisationState + BehaviourFlags; `foregone` = opportunity cost |
| Composer / Teacher | `composer.ts`, `teacher.ts` | 15-move machine over verified atoms; renders, never decides |
| Teaching loop | `teach_loop.ts` | injected Responder (the frontend plugs in here) |
| Misconception engine | `diagnosis.ts` | candidate/probable/confirmed tiers |
| Behaviour + Personalisation | `behaviour.ts` | measured features, internal flags, no labels |
| Agency Transfer | `agency.ts` | 8 decision types × 3 modes, shrinkage stages, scalar NEVER rendered |
| Preference / Curiosity / Artifacts | `preference.ts`, `curiosity.ts`, `artifact.ts` | AOM-style prediction-error learning; educational curiosity; reasoning lineage |
| Social decision slots | `social.ts` | aggregate-only proof, alias-only invites, consent downstream |
| Validation surfaces | `validation.ts` | growth receipt, capability journey, changed-my-mind, milestones (incl. `first_independent_decision`) |
| Receipts | `receipts.ts` | every decision auditable; `opportunity_cost` + `personalisation` audit trail |
| Mismatch minimum | `aom.ts` `predictionErrorStats` | ≥3 consecutive relative misses → flag to the human-gated loop |

## 2. THE FREEZE RULES

**Allowed without ceremony:** bug fixes · numerical stability · security · performance · missing correctness · compliance · test coverage · docs.

**Banned until real-user evidence (the "one tiny addition before beta" answer is NO):** new cognitive subsystems · new decision organs · new planning modes · new personalisation signals · re-architecting anything in §1. A genuine architectural hole discovered BY THE FRONTEND may be raised as an ADR — with evidence, not vibes.

**Deliberately NOT frozen (designed change):** content banks (sprint) · AOM/Return-Model *parameters* (assumed→measured via the human-gated loop only) · Wave-2 modules built ON frozen contracts (persistence, sync, auth) · GoalSpec configs (K12) · the frontend (next phase).

## 3. GATE-0 AUDIT EVIDENCE (what "audited" means here)

1. **Diff review:** every wire traced to its module (see §1 map).
2. **No-second-brain check:** single `planDay` implementation; single `composeSession` path; zero LLM imports in the kernel (structural G2).
3. **Live probes** (`npx tsx scripts/freeze_probes.mts`) — transcripts, not unit tests. **Probe 2 caught a real bug the whole suite missed:** approved AOM packs carried no record of the approver — fixed (packs now stamp `approvedBy`/`approvedAt`).
4. **Failure injection** (`kernel/test/chaos_injection.test.ts`, 11 tests): unknown-concept events no longer crash replay (fixed); NaN days/uncertainties rejected (fixed); duplicate idempotency keys, out-of-order logs, zero/negative budgets, negative daysToExam — all behave.
5. **Duplicate-concept sweep:** retired a dead second `agencyIndex()` in `social.ts` that returned a raw gamifiable scalar (anti-Goodhart violation-in-waiting).
6. **Test-quality scan:** ~449 assertions / 19 files; the 12 `toBeDefined()` sites are pre-conditions before deeper assertions, not terminal checks.
7. **Honest limits of this audit (read before citing it):** simulator evidence proves MACHINERY, not efficacy; AOM/Return-Model parameters are `assumed`; calibration needs real students (G3+). Tests are evidence, not proof.

## 4. THE RELEASE LADDER (adopted [ADR-031], ChatGPT's gate proposal + adjustments)

| Gate | What | Status |
|---|---|---|
| G0–G2 | Simulator gates, replay, no-LLM | ✅ passed earlier |
| **Gate-0b: Independent inspection** | this audit (diff + probes + chaos + test quality) | ✅ **PASSED 2026-10-03** |
| **Gate-1: BRAIN FREEZE** | this document signed | ✅ **FROZEN v0.1** |
| Gate-2: Brain Lab deployment | deploy the existing build as the *internal instrument* + public proof page — no further polish cycle | ⬜ next |
| Gate-3: Content coverage gate | **coverage × measurement × diagnosis × teaching × retrieval × transfer × provenance × style-variation** — per goal, NOT a raw 500 count | ⬜ founder/mentor hours (parallel with Gate-4) |
| Gate-4: Wave-2 infrastructure | persistence → sync (recompute-and-verify) → tamper tests → offline chaos → identity | ⬜ gated |
| Gate-5: Compliance | minors/K12 ONLY behind a compliance ADR + verified content; beta cohort ruling below | ⬜ gated |
| Gate-6: Limited public beta | **first cohort = adults preparing for UPSC** — prove it there before ANY expansion; architecture is general, evidence must not pretend to be | ⬜ gated |
| G4 (product) | the Product Experience Gate for the enterprise frontend — defined at the frontend design gate | ⬜ being defined |

## 5. SIGNATURES

- **Founder directive (2026-10-03):** "go for a complete audit and test all probes … then brain lab and then stop at inspection gate for design of frontend" — this document executes that directive.
- **Audited & written by:** GLM-5.3-Flash (Z.ai) via ZCode, agentic runtime; the findings above are reproducible from this repo (`npm test`, `npx tsx scripts/freeze_probes.mts`).
- **Human approval of the freeze:** the Founder, by directing the freeze and adopting ADR-031.
