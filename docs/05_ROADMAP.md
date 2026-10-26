# TECHGRAM — ROADMAP (PHASES, GATES, DATES)

> **Current status (10 October 2026):** connected authority and reference frontend implemented; Founder review/release/pilot gates open. See the dated addendum and CURRENT_STATE. Older sections retain historical context.

## Solo builder + AI-assist + one content expert/mentor. ~16–20 weeks to public V1. Every phase has a gate; no feature ships ahead of its gate.

> **RELEASE LADDER [2026-10-03, ADR-031 — THE GOVERNING SEQUENCE, supersedes the phase table below for ordering]:**
> G0–G2 simulator gates ✅ → **Gate-0b independent inspection ✅ (5 defects found & fixed — live probes + chaos tests)** → **Gate-1 BRAIN FREEZE v0.1 ✅ SIGNED (docs/BACKEND_FREEZE_CHECKLIST.md — no new cognitive subsystems before real-user evidence)** → Gate-2 Brain Lab deploy (internal instrument + public proof page; NO further polish cycle) ⬜ → Gate-3 content COVERAGE gate ⬜ **(8 dimensions per goal: coverage × measurement × diagnosis × teaching × retrieval × transfer × provenance × style-variation — never a raw count) — runs in PARALLEL with frontend** → **FRONTEND design gate (open now; the enterprise product — the founder decides the design; G4 Product Experience Gate to be defined at design sign-off)** ⬜ → Gate-4 Wave-2 infrastructure ⬜ → Gate-5 compliance ⬜ → Gate-6 limited public beta (**UPSC adults first**; K12/minors behind the Gate-5 compliance ADR) ⬜.
> Suite: 291/291 tests · kernel 31 files + web · typecheck clean · typecheck+counters enforced. **For the cognitive-runtime build (System B), the governing sequence is now `10_MASTER_ROADMAP.md` (corrected, founder-adopted; Phases 0–6 COMPLETE) — the phase tables below remain the V1-A product-sequence history.**

**Timeline basis:** the v2x execution plan's 10-week schedule assumes a team of 2–3 + content expert; solo is 16–20 weeks. The content track runs in parallel from Week 1 and is the true critical path. If a second builder joins, compress phases 2–4.

> **STATUS UPDATE — 2 Oct 2026. Phase 0 + Phase 1 core COMPLETE in the TypeScript kernel (`kernel/`), ahead of schedule:**
> - Belief engine (graph-prior + rank-1 EKF + forgetting time-update + Elo second opinion + honest bands with ×1.2 inflation) ✅
> - Memory engine (FSRS-lite, massed-repetition spacing rule at the event-fabric level) ✅
> - Exam model (Monte-Carlo exam day, negative marking, attempt policy) ✅
> - CAT diagnostic (closed-form information gain, 20–25 items, bands + sharpen) ✅
> - Planner (robust over posterior draws, gain-per-minute, VoI diagnose, prereq gate with ordering-not-certainty rule, two-pass fill with review quota, triage) ✅
> - Event fabric (idempotent, replayable; replay == sequential fold proven) ✅
> - Receipts (assumptions tagged, what-would-change-my-mind, outcome join) ✅
> - Polity seed: 10 topics · 40 concepts · 80 items · 33 misconception tags ✅ (target 500 items)
> - **58/58 tests green + typecheck clean.** Simulator gates: estimator honesty, replay determinism, planner beats random across archetypes (+5 to +8 marks) and beats fixed-order in aggregate (+1–2 marks — honest; a consistent student on an ideal fixed order is the planner's hardest case).
> - Brain Lab demo: `npm run brainlab` · lab sweep: `npx tsx kernel/src/demo/debug_sweep.ts`
> **Next (Phase 2–3 compressed):** session composer B7 + teacher state machine B8 + atoms, mock post-mortem B11, behaviour engine B9, then PWA shell. The 50-hour sprint maps onto Phases 2–4 compressed.
>
> **RELEASE RESTRUCTURE [2026-10-02, ADR-017 — external ChatGPT review adopted]:** V1 is now two releases. **V1-A "The Brain" (public, no users needed):** kernel + **B5.5 Action Outcome Model (ADR-015)** + **four simulator worlds (ADR-016)** + receipts + the 8-screen Brain Lab web demo; must pass G0(four worlds)/G1/G2 before anything else. **V1-B "The Student Product":** onboarding→diagnostic→plan→session+teacher→mock→forecast→receipts UI, offline PWA — *may not start before V1-A gates pass*. Parent/progress-share report moved out of V1 to post-pilot (ADR-017). Next build session order: (1) B5.5 AOM extraction + prediction-error loop in receipts, (2) four worlds in the lab + G0 re-run, (3) B7/B8 teacher + atoms, (4) B11 mock post-mortem, (5) B9 behaviour (priority raised — the personalization engine, ADR-018), (6) Brain Lab web. **STATUS 2026-10-02 ~16:20: ALL SIX DONE + Wave-1 web BUILT and browser-verified (apps/brainlab, docs-integrity gate, ADR-022). ~20:15: PHASE-A PERSONALISATION CORE COMPLETE (ADR-023..026 — ethics wall + Observable-State Law, Personalisation State v1, Return Model v0, engagement experiments, MEMORY_OPEN, Vision Ledger docs/08; 134/134 tests). Wave-2 (PWA + sync) gated; content sprint is the critical path.**

---

## PHASE OVERVIEW

| Phase | Weeks | Deliverable | Gate (must pass to proceed) |
|---|---|---|---|
| 0 — Foundations | 1–2 | Decisions executed, schemas, simulator v1, content sprint started, pilot list built | CI green on empty kernel; simulator reproduces the cold-start numbers within tolerance |
| 1 — Kernel core | 3–6 | Belief engine, memory engine, exam model, ≥250 verified items | Estimator recovers hidden truth in sim (coverage 0.75–0.85); 250 items verified |
| 2 — Intelligence products | 7–10 | CAT diagnostic, planner, receipts, forecast, Brain Lab CLI | **G0**: planner beats all baselines on simulated pass-probability across ≥5 archetypes |
| 3 — Teaching + mocks | 11–14 | Teacher state machine, atoms, content compiler, behaviour engine, mock post-mortem | Full session runs with network off; post-mortem matches hand-labelled test set |
| 4 — Product shell | 15–18 | Offline-first PWA, sync + server recompute, calibration dashboard, LLM gateway (M1), chaos suite | **G1 + G2** green; tamper test passes; LDI measured; chaos day clean |
| 5 — Public V1 | 19–20+ | Brain Lab web demo, pilot hardening, launch checklist, **launch** | Launch checklist 100%; go/no-go vs pre-registered criteria |
| 6 — Pilot & learn | launch +3 wks | 20–30 aspirants, daily ops, calibration curves | **G3** (≥40% week-3 retention) decides kill/continue/re-scope |

---

## PHASE 0 — FOUNDATIONS (Weeks 1–2)

**Engineering:**
- Execute the language decision: new TS kernel package; archive `backend/` as reference; port the envelope rules + test contracts first (they are the porting spec).
- Define schemas: events (idempotent, versioned), Envelope, GoalSpec, Decision API types, receipt JSON. Write them as TypeScript types + JSON Schema — **types are the contract of record**.
- Build the Python **simulator v1** (latent mastery hierarchy, learning gains, forgetting, slip/guess, fatigue, adherence process, response-time/confidence behaviour; archetypes: consistent, crammer, avoidant, overconfident, drifter) with baselines (fixed order / random / weakest-first / Leitner). Port `diag_sim_cold_start.py` results as the regression fixture.
- Set up CI: typecheck, property tests, **no-LLM job**, replay job.

**Content (parallel, starts now):**
- Polity concept graph v0: 35 topics, first ~80 concepts with prereq + confusability edges.
- PYQ weight table: last 10–15 years of Prelims mapped to topics/concepts.
- First 50 items drafted (LLM-assisted) + **verified** with distractor→misconception tags.

**People:**
- Build the pilot recruit list (20–30 UPSC aspirants); 5 conversations this fortnight about their current planning — validate the "what/when/why-now" framing before the product exists (the Phase-0-with-husers discipline, compressed for solo).

**Gate 0:** CI green on empty kernel; simulator reproduces the audit's cold-start table (level error, weak-topic recall, coverage) within stated tolerance; ≥50 verified items; pilot list ≥30 names.

---

## PHASE 1 — KERNEL CORE (Weeks 3–6)

- **B2 Belief engine:** prior builder (general/topic/graph/graph-smooth shares), rank-1 EKF update, evidence channels (RT, confidence, hints, eliminations, scorecards), time update toward prior mean, ×1.2 inflation, Elo second opinion + `model_disagreement` flag.
- **B3 Memory engine:** FSRS-lite with type priors; feeds B2's time update (one coherent state).
- **B4 Exam model:** spec + 2,000-draw Monte Carlo; scenario framing per claims policy.
- Event store + reducers + idempotency + replay harness; golden-replay test #1 recorded.
- Python lab: estimator-accuracy harness (RMSE vs hidden truth, coverage, weak-topic recall by items-answered checkpoint).

**Gate 1:** simulator shows the filter recovering hidden truth (coverage within 0.75–0.85 after inflation; level error ≤ simulation baseline); item bank ≥250 verified; property tests green; replay deterministic.

---

## PHASE 2 — INTELLIGENCE PRODUCTS (Weeks 7–10)

- **B5 CAT diagnostic:** info-gain item selection, stopping rule, results screen (bands + grey unknowns + sharpen actions).
- **B6 Planner:** robust greedy marginal-gain-per-minute over K≈16 posterior draws + VoI bonus; constraints (prereqs, fatigue, variety, coverage floors, stability penalty); triage mode as parameter schedule.
- **B12 Receipts** full schema + template rendering ("Why this?" without any LLM).
- **Forgetting forecast** ("these 14 high-weight topics fall below 60% by exam day unless reviewed" — prior-based, labelled typical-learner model).
- **Brain Lab CLI:** run a synthetic student 60 days, watch beliefs converge, compare vs baselines, LLM on/off toggle.

**Gate 2 = G0:** planner beats every baseline on simulated exam-day score/pass-probability across ≥5 archetypes by a pre-registered margin; sensitivity analysis shows action rankings stable under ±50% gain-prior changes (else plans flagged `assumption_sensitive`); diagnostic beats random item selection in sim.

---

## PHASE 3 — TEACHING + MOCKS (Weeks 11–14)

- **B8 Teacher:** 12-move rule table; atom renderer (4 tiers); hint ladder; doubts cascade (cache → classifier → atoms → optional fact-locked LLM → queue).
- **Content compiler v0 + reviewer workflow:** risk-weighted review (facts 100%); reach ≥150 atoms, 2 variants for top ~20 concepts (uplift seeds registered).
- **B7 Composer:** segment mix per state and days-to-exam; resumable segments.
- **B9 Behaviour:** daily features, archetype rules → action changes, belief probes, notification policy.
- **B11 Mock engine:** two 50Q sectional mocks (never reused in diagnostics); post-mortem classification; attempt-policy coach with student-calibrated confidence.

**Gate 3:** a full session (compose → teach → practice → assess → state update → next plan → receipts) completes with **network off**; post-mortem matches hand-labelled error classes on a test set; wrong-fact report flow demonstrably pauses an atom.

---

## PHASE 4 — PRODUCT SHELL (Weeks 15–18)

- **PWA:** onboarding (incl. scorecard import) → diagnostic → today's plan → session UI → forecast → progress/share → settings; offline-first (service worker + IndexedDB event queue + local snapshot).
- **Sync server (Node):** idempotent event ingestion; **server-side recompute-and-verify** (tamper test); nightly jobs: tomorrow's plan + session packs precomputed; weekly calibration job.
- **Calibration dashboard** (internal): reliability curves, Brier, coverage, LDI, zero-LLM session rate.
- **LLM gateway (M1):** provider-agnostic adapter, circuit breaker, cache, fact-lock validator; banned-vocabulary enforcement.
- **Chaos suite:** LLM/vector/queue/network kill, clock skew, duplicate/out-of-order/malformed events, flood sync, version downgrade.

**Gate 4 = G1 + G2 + chaos:** deterministic replay green; full suite green with LLM key unset + host firewalled; chaos day clean; LDI measured (target: zero-LLM sessions >95% already visible in dogfooding); tamper test passes.

---

## PHASE 5 — PUBLIC V1 (Weeks 19–20+)

- **Brain Lab web page** (the public demo needing no users): pick a synthetic archetype → watch 60 simulated days with ground truth visible → plan changes with receipts → final exam-outcome comparison vs baselines → mock post-mortem on a synthetic mock → **LLM on/off toggle showing identical decisions**. Labelled clearly as synthetic; proves machinery + honesty, not real-world efficacy.
- **Pilot hardening:** load test, content QA pass, privacy review (DPDP, 18+), onboarding polish, error budgets.
- **Launch checklist:** claims policy copy pass (no banned claims), consent + data-minimisation flows, outcome-label consent at onboarding, kill/continue criteria published internally **before** launch.

**Gate 5 = GO/NO-GO:** checklist 100% green; founder signs the claims policy; pilot cohort scheduled.

---

## PHASE 6 — PILOT & LEARN (launch + 3 weeks, then ongoing)

- 20–30 aspirants, daily ops: review wrong-fact reports, tag new misconceptions, watch adherence.
- Measure: week-1/3 retention, zero-LLM session rate, first calibration curves, atom-variant residuals (underpowered is fine — they exist), adherence, forgetting-prediction error.
- Add concept-attached threads **only if** pilot users ask for community.
- **Day-90 decision meeting against the pre-registered kill/continue criteria** (`03_GOALS.md` §4).

**Post-pilot data ladder (what each volume unlocks):**
| Volume | Unlocks |
|---|---|
| <100 students | Bug-finding, UX tuning, content verification, clean logs |
| 100–1,000 | Elo item refinement, variance-share estimation, coverage recalibration, first uplift signals, outcome-label pilots |
| 1,000–10,000 | Personalised memory params (shrinkage), cohort priors, bandits with logged propensities, mock→real calibration |
| 10,000+ | Sequence models, population pedagogy findings, new exams/K12 via Goal Spec |

---

## STANDING RULES ACROSS ALL PHASES

1. **Definition of done for every module:** typed interface · pure functions · property tests · golden-replay test · no-LLM test green · receipt output · assumptions tagged.
2. **Content quota:** ~60–80 verified items/week and ~15–20 atoms/week, every week, from Week 1. If the quota slips two weeks running, engineering pauses and content catches up — the kernel is useless without it.
3. **Feature Contract enforced at review:** no feature without events + decide() + fallback + receipt + outcome metric.
4. **Gates are one-way:** failing a gate twice → stop features, fix the kernel.
5. **Cut list stands:** no feed, no career, no PG/hostel/food (founder instruction), no K12, no minors, no DKT/RL/counterfactual in V1.
6. **Nothing fixed silently:** every anomaly gets registered (the Astra rule) — a `docs/ANOMALY_REGISTER.md` entry with severity, reproduction, and disposition.

---

## WHAT "DONE" LOOKS LIKE (the one paragraph)

Twenty weeks from now there exists a Polity brain that plans a real aspirant's day against their real exam date, diagnoses *why* they missed questions through a prerequisite graph and misconception ontology, forecasts what they'll forget, teaches from verified atoms through a scripted pedagogy, decomposes their mocks into marks lost by cause and coaches their guessing policy — and every one of those decisions carries a receipt with its assumptions honestly labelled, proven in a public simulator demo, running fully offline, with the LLM unplugged and nothing changing. Twenty to thirty real aspirants are using it, the first calibration curves exist, and the moat sensors — uplift, misconceptions, outcomes, memory — have been quietly accruing proprietary data since the first session of the first user.

*Roadmap complete. The document set: `README.md`.*

---

# SESSION-EXPERIENCE GATES [ADR-027/028, 2026-10-02]
| Gate | Build | Pass condition |
|---|---|---|
| **S1 — Core contracts** | SessionSpec/SessionPlan/narrative segments · PreferenceState (AOM-style) · CuriosityState · StudentArtifact · BreakPolicy · SessionOutcome · social slots · integration into B7/teach_loop — no new brain | 7 ADR-027 invariants green in tests |
| **S2 — Golden replay** | Class 8 → IAS → Geomorphology → 40 min → LLM OFF + **Worlds A–H** (clean/false-confidence/low-energy/resistant/unusual-preference/preference-wrong/no-LLM/missing-asset) | All verification points + deterministic replay + graceful fallbacks. **A machinery gate, not an efficacy proof.** |
| **S3 — Validation surfaces** | Growth Receipt · Capability Journey · Changed-My-Mind · Teach-it-back · Curiosity Ledger · mismatch transparency · anonymous social proof | Surfaces render only kernel output |
| **S4 — Limited public beta** | Classes 6–10 + UPSC, invited cohort, full measurement list + Capability Gain metric + parent-summary payer experiment | Content floor per goal + compliance (minors) + Wave-2 backend |

**Sequencing law:** every hour adds verified content, reaches a real aspirant, or ships something a student can touch. No new intelligence subsystems before a real student uses the loop — only the session-experience layer above.

## Current delivery sequence — 10 October 2026 [ADR-047–049]

Original week estimates are historical planning, not a new launch date. Production foundation and reference frontend are implemented: one 15-stage journey and owned server learning. Founder visual acceptance remains pending. Sequence: frontend review → backend preference/artifact/voice scope/polishing → PostgreSQL/container/staging/restore → expert curriculum → consented adult UPSC pilot. Institutional roles/SSO/MFA/privacy, offline sync, push and broad launch are unfinished. Historical cognitive phase evidence is not replaced or re-earned here.

## Strategy review addendum — proposed, not implemented [ADR-050]

The Founder requested Classes 6–12 plus UPSC and stronger knowledge/personality with limited complexity. INTELLIGENCE_AND_KNOWLEDGE_PLAN.md proposes wiring existing composer/teacher/ExperiencePlan/expression into persisted connected sessions, then reviewed Markdown packs/local retrieval, bounded freshness/voice and phased release evidence. No additional executive or general-agent architecture is proposed. Current code, frozen baseline and release gates are unchanged; school deployment needs an adopted scope/Charter amendment and child/curriculum readiness. The plan is a researched recommendation, not a replacement adopted build sequence or finished capability.


## 11 October engineering delivery [ADR-051]
**Model:** OpenAI GPT-6-based Codex via Codex desktop (exact serving model ID unavailable; not guessed) · **Directed by:** Md Roushan · **When:** 2026-10-11T00:30:18+05:30.

Connected lessons now persist teaching steps, pause/resume, preferences, completion notes and reflections on the account. The existing kernel composer/teacher executes question and explanation steps; independent checks reject hints, and assisted/revealed answers do not create independent mastery or memory evidence. Eight original Geography Markdown lessons compile into 48 source-linked seed atoms with expert review explicitly pending. Local bounded source search, lesson-specific boards and browser-provided read-aloud are available. Live web, speech recognition, unrestricted conversation and translation are not configured.

Migration 0002_learning_journey must be applied before serving (production schema guard requires it). Owned commands use UUID/revision/step contracts and the existing transaction lock. Used-item rotation survives serialization; independent checks reject help; assistance carries no independent evidence weight. Versioned active lessons require explicit migration on pack changes. Executive recommendations and delivered teacher directives remain distinguishable. No new brain or cloud service was added.

Fresh checks: 306 JS / 69 Python passes, one PostgreSQL skip; kernel/web/scripts typechecks and both builds pass. Browser upgrade QA: `node scripts/frontend_upgrade_qa.cjs`, disposable API database only, report frontend/upgrade-qa.json. Preview QA remains `node scripts/frontend_qa.cjs`. Founder visual acceptance, expert curriculum review, load/restore/staging and enterprise operations remain open. Learners/pilots are later by Founder instruction; frozen Charter/audit and historical experiments remain intact.


## 12 October Geography reference integration [ADR-052]
**Model:** OpenAI GPT-6-based Codex via Codex desktop (exact serving model ID unavailable; not guessed) · **Directed by:** Md Roushan · **When:** 2026-10-12T11:31:32+05:30.

GEOGRAPHY_SOURCE_REVIEW.md records the full 1,483-line review. Exact synthesis is preserved/hashed/indexed into 85 subject sections; policies/schemas remain reference data. Bounded owned Library retrieval and mapped EXPLAIN excerpts use the existing server runtime. New Geography sessions pin versions; old unpinned sessions stay unchanged; independent questions withhold excerpts. No new planner/model/database. Reading does not update evidence. Eight assessed Geography concepts/16 seed items/48 atoms remain; whole-curriculum/grade-depth/UPSC certification unearned. Resolve edition/subject review and item ambiguity in a new immutable pack.

311 JS passes (295 kernel + 16 web); targeted Python five passes/17 warnings; reference browser QA passes four sizes without errors/overflow. Page localhost:5175: choose Geography, search monsoon/GIS in Library or start a new session. QA_REFERENCE=true enables reference QA; report frontend/reference-qa.json. Both builds/checks pass; deployment and learner/pilot gates remain open/deferred.


## 12 October assessed-unit expansion [ADR-053]
**Model:** OpenAI GPT-6-based Codex via Codex desktop (exact serving model ID unavailable; not guessed) · **Directed by:** Md Roushan · **When:** 2026-10-12T12:12:24+05:30.

The previously reference-only boundary is superseded for four authored foundation units: geomorphology, maps/motions, atmosphere and monsoon. New immutable catalog: 20 concepts / 80 private role-tagged questions / 120 atoms, seed subject review pending. Existing planner ranks an evidenced prerequisite frontier; existing teacher executes conditional explanation/support, a fresh no-hint check and distinct independent transfer. Role-tagged items and native diagrams replace arbitrary practice-as-transfer. One concept cycle per bounded session; partial budgets do not imply completion of every objective.

Old active grading stays on its original bank; historical notes/events remain while new catalog evidence is separate. Independent payloads withhold explanation/reference/diagram nodes. Unit preference persists in existing JSON; no new schema/model/planner/service. Library can choose a unit for the next session; unfinished sessions retain their old unit. Full grade/curriculum, expert review/calibration, open-response rubrics and operations remain open; pilots deferred. See GEOGRAPHY_UNITS.md.

Fresh verification: 320 JS passes (304 kernel + 16 web), 70 Python passes/one PostgreSQL skip/123 warnings, typechecks and connected build. Four-size units-qa.json covers natural completion, recovery/notes and Library-to-Monsoon-to-coordinate-prerequisite selection with preference recovered after login. Local connected app: localhost:5175, refresh/sign in and select Geography teaching unit.
