# TECHGRAM — CORRECTED MASTER ROADMAP

> **Current status (10 October 2026):** connected authority and reference frontend implemented; Founder review/release/pilot gates open. See the dated addendum and CURRENT_STATE. Older sections retain historical context.


> **STATUS [2026-10-04]: PHASES 0–6 ALL COMPLETE AT KERNEL LEVEL, EACH WITH ITS GATE EARNED.**
> Phase 0 foundation [ADR-038/040 evidence, commit 5270d24] · Phase 1 deep gate [EXPERIMENTS §17: executive 12 vs linear 10 on 12/12 seeds, belief error halved] · Phase 2 loop CLOSED with counterfactual proof [ADR-040] · Phase 3 body integrated (Conductor executes every decision in the gate flow) · Phase 4 Expression [ADR-042: LLM OFF/ON byte-identical, ethics wall at the voice] · Phase 5 World Adapter + THE THIRTY [ADR-043: 30/30 scenarios, 30W/0L, mean +3.13] · Phase 6 demo [ADR-044: the arc BY the machinery + perturbation counterfactuals] — then the Layer Interaction Study [ADR-045: 24 students, influence by ablation] and the Strengthening Pass [ADR-046: staleness targeting closes the advanced-student inversions; proportional self-model; live calibration channel].
> Evidence: EXPERIMENTS_AND_TESTS.md §17–§23 · reports: PHASE5_EXPERIMENT_REPORT.md, LAYER_INTERACTION_REPORT.md · 291 tests, all rigs permanent CI gates.
> **NEXT: Phase 7 (the real human pilot) — gated on the founder, the content floor, and Wave-2.**

## Frozen Techgram Brain → Universal Cognitive Engine → Techgram Embodiment → Pilot

### Status: THE authoritative roadmap — replaces the conflated C/G/S consolidation (Entry 38). Adopted verbatim-in-structure from the founder's corrected roadmap document (2026-10-04).

---

# 0. THE CORRECTION

There are two different systems in the history of this project. **They must not be merged.**

### System A — The Frozen Techgram Brain

The existing Techgram decision-making system: designed, implemented, tested, hardened, and intentionally frozen. It includes the existing organs: event/state infrastructure, Belief Engine, Memory Engine, Exam Model, CAT, Planner, AOM, Teacher/teaching loop, Personalisation State, Behaviour inference, Misconception machinery, Simulator, Replay/determinism, Receipts, Ethics Wall, Return Model, LLM gateway/degradation, UPSC Polity world model, and the testing/validation infrastructure.

**This system is NOT Phase 0 of the new cognitive project. It is the FROZEN BASELINE on which the new architecture operates.**

### System B — The New Cognitive Engine

The new work: temporal cognitive coordination, workspace formation, executive control, prediction across world and self, self-model formation, self-prediction, prediction-error tracking, uncertainty investigation, strategy modification, evidence-based self-improvement, metacognition, communication policy, coherent experience planning.

**This system is NOT YET a completed cognitive model.** Some contracts and architectural ideas exist. Some implementation pieces may exist. But the cognitive model itself must be built and demonstrated.

---

# 1. FOUNDING CONSTITUTION

> **The engine may change its beliefs, predictions, strategies, representations, and self-model from evidence, but it may never rewrite the evidence, the external evaluator, or the ground truth in order to make itself appear better.**

This is not a feature. It is an architectural law. The system may modify beliefs, predictions, hypotheses, strategies, parameters, representations, self-model, preferences, action policies — only through permitted evidence/update paths. It may never modify historical evidence, immutable observations, external evaluation results, ground-truth simulator state, evaluator criteria, or provenance records to rationalize an outcome.

# 2. SECOND CONSTITUTION — DECISION OWNERSHIP

COGNITIVE ENGINE → DECISION → EXPERIENCE PLAN → CONDUCTOR → PRESENCE → VOICE → LLM → UI. **Never:** LLM → decision, UI → decision, voice → decision, renderer → learning state. The renderer may express intelligence; it may never invent intelligence. The LLM may voice or paraphrase a decision; it may never become the authority that generated the decision.

# 3. THIRD CONSTITUTION — DEVELOPMENT

No developmental update without evidence. No strategy update without: (1) a falsifiable hypothesis, (2) an evaluation path, (3) observed evidence, (4) a comparison against the previous strategy/model, (5) a versioned update. No representation change merely because a narrative sounds compelling.

# 4. ARCHITECTURE — CORRECTED

HUMAN/ENVIRONMENT → OBSERVE → **UNIVERSAL PRIMITIVES** (Evidence · Observation · State · Belief · Prediction · Hypothesis · Goal · Value · Action · Outcome · Constraint · Provenance · StateTransition · Decision) → **NEW COGNITIVE RUNTIME/MODEL** (Workspace · Executive · World Prediction · Self Model · Self Prediction · Self Error · Self Inquiry · Improvement · Metacognition · Communication Policy) → ExperiencePlan → **FROZEN TECHGRAM WORLD/BRAIN** (Belief · Memory · CAT · Planner · AOM · Exam Model · Teacher · Personalisation · Behaviour · Misconceptions · Receipts) → **EXECUTION BODY** (Conductor · Presence · Blackboard · Voice · Evidence UI · LLM Renderer) → HUMAN.

### Critical distinction

The boxes at the top are not all currently implemented. The frozen Techgram brain is real. The universal primitives are partly established. **THE COGNITIVE RUNTIME IS THE NEW FRONTIER.**

# 5. BASELINE — FROZEN TECHGRAM BRAIN

**Status: COMPLETE / FROZEN.** Preserve the existing brain as the baseline. Do not casually refactor its organs. Do not rename them because the new architecture has prettier terminology. Do not rebuild the planner or belief engine as part of the cognitive project. Do not turn the teacher into the Executive. Do not move decision authority into the LLM. The frozen brain becomes an experimental substrate.

Baseline capability: events → state → belief/memory → candidate actions → planner → teacher/action → outcome → receipt.

# 6. PHASE 0 — COGNITIVE ARCHITECTURE FOUNDATION

**Purpose:** establish the NEW cognitive layer's contracts and boundaries (not an architecture freeze of the whole system — the old brain is already frozen).

**Build:**

6.1 **Universal primitives**: Observation, Evidence, Belief, Prediction, PredictionOutcome, Hypothesis, Goal, Value, Constraint, Action, Outcome, Decision, Explanation, Provenance, StateTransition. These are primitives — NOT themselves the cognitive model.

6.2 **Ownership boundaries** — no duplicate ownership: Belief Engine → mastery beliefs; Memory Engine → forgetting/retrieval state; AOM → action-outcome predictions; Behaviour → observable behaviour hypotheses; Personalisation → measured personalisation variables; SelfModel → hypotheses about the system itself; Prediction Registry → forecast records and outcomes; Executive → current decision; Workspace → current cognitive context.

6.3 **ExperiencePlan** — the seam between cognition and execution: { learning, presence, expression, evidence, experience, agency }. **ExperiencePlan is an output of cognition, not a second brain.**

**Phase 0 Gate:** contracts compile · ownership boundaries explicit · frozen organs behaviorally unchanged · existing tests green · no cognitive layer silently mutates frozen organ state · ExperiencePlan produced as a typed contract · existing Techgram behavior reproducible.

**Exit:** the new cognitive layer can exist beside the frozen brain without corrupting or redefining it.

# 7. PHASE 1 — COGNITIVE EXECUTIVE

The Executive is NOT a magical "brain class" — it is a closed-loop controller over the existing organs.

7.1 **Cognitive Workspace** per decision turn: Goal, focus, concepts, beliefs, uncertainties, predictions, prediction errors, time, fatigue/load, recent actions/outcomes, plan progress, constraints, relevant self-model, relevant history. The Workspace assembles; it does not own.

7.2 **Candidate generation**: retrieve, explain, diagnose, practice, switch concept, difficulty up/down, break, ask question, show graph, remain silent, continue, end session. Candidates must have reasons/evidence.

7.3 **Constraint evaluation**: prerequisites, time, safety, evidence quality, fatigue, session constraints, product policy, Ethics Wall.

7.4 **Executive selection**: learning value, information value, uncertainty, action-outcome predictions, opportunity cost, time, goal relevance, recent prediction errors, personalization state, recovery needs, agency opportunities.

7.5 **Decision Receipt**: decision, evidenceRefs, candidateActions, alternativesConsidered, predictedBenefit, uncertainty, constraints, executiveVersion, timestamp — the decision must be inspectable.

7.6 **Directive decomposition** — never one giant nextMove. Separate Learning Action / Communication / Presentation / Augmentation / Rationale. Silence is a valid communication state.

**Phase 1 GATE:** Frozen Linear Teacher vs New Cognitive Executive under matched conditions — same student, world, content, seed, evidence, time budget, action availability; only decision architecture changes. Measure: learning gain, information gained, prediction quality, unnecessary interventions, action efficiency, missed opportunities, interruptions, break decisions, LLM calls, stability, receipt completeness, calibration.

**The gate is NOT "the Executive exists." The gate is: does the Executive produce measurably better — or at least meaningfully better — decisions than the existing linear teacher under controlled matched conditions? If not, Phase 1 is not complete.**

# 8. PHASE 2 — DEVELOPMENTAL COGNITIVE CORE

The system begins to model **itself**.

**S0 — DEVELOPMENTAL GENESIS.** No hardcoded personality. Begins with capabilities, tools, knowledge, constraints, sensors, evaluators, environment — then performs structured self-investigation: What can I do / not do? What can I predict? Where am I uncertain? How reliable are my predictions? What errors do I make? Which strategies work/fail? What information can I access/not access? What changes when the environment changes? Result: the Initial SelfModel — consisting of **hypotheses**, not metaphysical truths.

**S1 — SELF-PREDICTION.** The system predicts not only the world but ITSELF: "I expect this action to succeed." "I expect I will need two attempts." "I expect my current strategy to fail under this condition." "I expect the student to reject this explanation." "I expect my confidence to be poorly calibrated here." Store SelfPrediction → actual outcome → self-prediction error. This creates the distinction: **WORLD PREDICTION ERROR vs SELF PREDICTION ERROR.**

**S2 — SELF-ERROR LEDGER.** Structured, historical, auditable prediction failures. Example: Prediction "Retrieval will produce sufficient evidence" → Observed: student remained uncertain → Error: underestimated uncertainty → Repeated pattern: 3 similar failures → Hypothesis: current diagnostic threshold too aggressive → Status: candidate strategy revision.

**S3 — VALUE-OF-INFORMATION SELF-INQUIRY.** Do not investigate everything. "What uncertainty about myself is worth resolving next?" Do I systematically overestimate action success? Underestimate fatigue? Poorly calibrated in unfamiliar topics? Does strategy A fail for a specific student pattern? Is my current self-model wrong? Select experiments by expected information value.

**S4 — SELF-IMPROVEMENT — the first truly important developmental gate.** Demonstrate: history → self-model hypothesis → prediction → action → observed error → investigation → strategy/model update → **DIFFERENT FUTURE BEHAVIOR**. A database record changing is NOT enough — the machinery generating future decisions must change.

**Phase 2 GATE — Cases A–I:** (A) experience produces an error; (B) the system detects it; (C) it identifies uncertainty; (D) it chooses an informative investigation; (E) it updates a permitted part of itself; (F) the next equivalent situation produces different behavior; (G) the changed behavior is measurable; (H) the update is reversible/versioned/auditable; (I) ground truth and evaluation remain untouched. **This is the actual developmental intelligence gate.**

# 9. PHASE 3 — EXPERIENCE BODY

Only after the cognitive loop works.

9.1 **ExperiencePlan** — six channels: LEARNING, PRESENCE, EXPRESSION, EVIDENCE, EXPERIENCE, AGENCY.

9.2 **Session Conductor** — executes an ExperiencePlan; does NOT decide the learning strategy; manages timing, transitions, segment execution, interruptions, resume, board focus, interaction state, completion, graceful failure.

9.3 **Presence Layer** — gaze, gesture, silence, speech timing, visual emphasis, teacher state, board attention, transition timing. Presence must never change the learning decision.

9.4 **Evidence UI** — Why this? What evidence led here? What does Techgram know? What is uncertain? What changed? Evidence is part of the experience, not a debugging overlay.

**Phase 3 GATE:** a stranger experiences observe → decision → action → feedback → evidence → adaptation without knowing the internal architecture. Coherent even when: LLM unavailable, voice unavailable, network gone, atom missing, student interrupts, session resumes later.

# 10. PHASE 4 — EXPRESSION

10.1 **Communication Policy**: verbosity, tone, timing, humor, explanation depth, silence, question frequency — expresses the cognitive decision, does not create it.

10.2 **Blackboard**: receives structured cognitive output (concept, relationship, comparison, graph, prediction, evidence, progression) — does not invent the underlying educational content.

10.3 **Voice**: capability-gated — Tier 0 text / Tier 1 browser TTS / Tier 2 enhanced / Tier 3 optional external-local. No voice capability becomes a dependency for intelligence.

10.4 **LLM Bridge**: can paraphrase, explain, render, handle open-ended language, provide bounded conversational richness. Cannot: select the learning action, rewrite state, override the Executive, invent evidence, alter ground truth, silently update the self-model.

**Phase 4 GATE:** LLM OFF vs LLM ON — decisions, learning actions, state transitions, predictions, evidence must remain IDENTICAL. LLM ON makes the experience richer; it must not make the brain smarter by secretly taking control.

# 11. PHASE 5 — TECHGRAM WORLD ADAPTER

World: UPSC Polity, concepts, curriculum, prerequisites, PYQs, exam structure. Sensors: answers, confidence, response time, hint use, elimination, notes, delayed recall, mock performance, session behavior. Actions: teach, retrieve, practice, diagnose, explain, interleave, review, rest, switch strategy. Outcomes: correctness, delayed retention, transfer, confidence calibration, mock performance, adherence, prediction error.

The cognitive engine should not need to know that "geomorphology" or "UPSC" exists — the Techgram adapter tells it what those things mean.

# 12. PHASE 6 — BRAIN LAB

Expose the machinery publicly, not marketing claims. Core demonstration: OBSERVE → REPRESENT → PREDICT → DECIDE → ACT → OBSERVE OUTCOME → DETECT ERROR → INVESTIGATE → UPDATE → ADAPT, with receipts underneath. Allow the viewer to change evidence, uncertainty, goal, available time, student state — and watch the decision change. Much stronger than claiming "living brain."

# 13. PHASE 7 — REAL HUMAN PILOT

20–30 adult users. Initial domain: UPSC Prelims GS Polity. Do not expand to every subject during this gate.

Four measurement layers: **13.1 Learning** (immediate performance, delayed retrieval, retention, transfer, misconception reduction) · **13.2 Decision quality** (predicted vs observed outcomes, calibration, action selection quality, information efficiency, unnecessary intervention rate, prediction error) · **13.3 Development** (strategy changes, prediction calibration changes, self-model changes, future decisions change) · **13.4 Human agency** (student proposes strategy, explains reasoning, detects own uncertainty, challenges Techgram, predicts own performance, selects/rejects an intervention).

The long-term objective is not "Techgram makes every decision forever" — it is **Techgram eventually helps the human become better at making their own learning decisions.**

# 14. PILOT GATE

Evidence for the full loop: Observe, Represent, Predict the world, Predict actions, Predict itself, Decide, Act, Observe outcome, Detect world prediction error, Detect self prediction error, Investigate valuable uncertainty, Change strategy, Change future behavior because of history, Explain the decision, Express the entire loop coherently to a human. The twelve-capability framing stands, with world-vs-self prediction kept explicit.

# 15. PHASE 8 — ORGANISM LAB (post-pilot)

15.1 Divergence (identical initial systems, different experiences — do the models diverge?) · 15.2 Transfer (does a learned strategy transfer between environments?) · 15.3 Persistent self-model (self-was / self-is / self-may) · 15.4 Representation evolution · 15.5 Multiple organisms — only after the single-system loop is understood.

# 16. WHAT WE ARE NOT BUILDING

❌ consciousness engine · ❌ personality engine · ❌ emotion detector · ❌ human-equivalent emotion claims · ❌ Theory-of-Mind engine · ❌ multi-agent society · ❌ AGI mode · ❌ giant autonomous LLM brain · ❌ engagement-maximisation engine · ❌ social network · ❌ school/location competition · ❌ manipulative streak mechanics · ❌ five unrelated memory systems · ❌ unrestricted self-modification · ❌ self-modifying evaluator · ❌ self-modifying ground truth. These can only enter experimental research if justified by a specific hypothesis.

# 17. THE THREE TYPES OF SELF-MODIFICATION

**Level 1 — Parameter adaptation** (threshold, weight, confidence, timing) — lowest risk. **Level 2 — Strategy adaptation** (strategy A repeatedly fails → strategy B selected) — more significant. **Level 3 — Representation adaptation** (current representation repeatedly produces systematic errors → new representation hypothesis → independently evaluated → adopted if superior) — highest risk; representation changes require especially strong evaluation.

# 18. WHAT THE SYSTEM MAY NEVER MODIFY

Historical evidence, ground truth, external evaluation, evaluation criteria, provenance, audit history. Otherwise the system can "improve" itself by changing the scoreboard — that is not intelligence, that is cheating.

# 19. TESTING STRATEGY

Unit tests (mechanism correct) · Property tests (invariants survive broad inputs) · Replay (same history → same state and decision) · Simulator (sensible under known synthetic worlds) · Matched comparison (new mechanism beats the baseline) · Chaos (failure degrades safely) · Real-world evidence (does anything work for humans?). Never confuse: passing tests ≠ algorithm works · simulator success ≠ student efficacy · demo success ≠ pilot success · pilot success ≠ proof of general intelligence.

# 20. THE FINAL ARCHITECTURAL STATE

HUMAN → EXPERIENCE → EXECUTION BODY (Conductor/Presence/Voice) → ExperiencePlan → COGNITIVE RUNTIME (Workspace/Executive/SelfModel/SelfPrediction/SelfError/SelfInquiry/Improvement) → TECHGRAM ADAPTER → FROZEN BRAIN ORGANS (Belief/Memory/CAT/Planner/AOM/Teacher/Personalisation/Behaviour/Misconceptions) → WORLD/HUMAN → EVIDENCE → LOOP.

# 21. THE ACTUAL ROADMAP STATUS

**Already frozen:** TECHGRAM BRAIN (Belief, Memory, CAT, Planner, AOM, Exam Model, Teacher, Personalisation, Behaviour, Misconceptions, Simulator, Receipts, Ethics, UPSC World). **New work:** COGNITIVE RUNTIME (Workspace, Executive, SelfModel, SelfPrediction, SelfError, SelfInquiry, Improvement, Metacognition). **Later:** EXPERIENCE BODY, EXPRESSION, BRAIN LAB, PILOT, ORGANISM LAB.

# 22. THE CORRECT CURRENT POSITION

Do NOT describe the position as: "Phase 0 mostly complete, Phase 1 built, Phase 3 partially built, therefore the cognitive engine is mostly constructed." **That inference is invalid.**

- **Frozen Techgram brain:** BUILT AND FROZEN.
- **Universal primitives:** PARTIALLY FORMALIZED / contracts exist.
- **Cognitive runtime:** NEW CONSTRUCTION.
- **Executive:** some architecture/contracts/implementation may exist, but its actual cognitive gate remains UNEARNED until matched behavioral testing passes.
- **Developmental core:** NOT YET DEMONSTRATED.
- **Self-model evolution:** NOT YET DEMONSTRATED.
- **Self-prediction:** NOT YET DEMONSTRATED.
- **Self-improvement:** NOT YET DEMONSTRATED.
- **Experience execution:** partially existing and can be adapted to consume the new cognitive layer.
- **Expression:** LATER.
- **Real human efficacy:** UNKNOWN UNTIL PILOT.

# 23. THE REAL BUILD ORDER

FROZEN TECHGRAM BRAIN → PHASE 0 (universal primitives, ownership boundaries, ExperiencePlan seam) → PHASE 1 (Cognitive Workspace, Executive, Decision receipts, matched baseline gate) → PHASE 2 (S0 Genesis, S1 Self-Prediction, S2 Self-Error, S3 Self-Inquiry, S4 Self-Improvement) → PHASE 3 (ExperiencePlan execution, Conductor, Presence, Evidence UI) → PHASE 4 (Communication, Blackboard, Voice, LLM renderer) → PHASE 5 (Techgram World Adapter hardening) → PHASE 6 (Brain Lab) → PHASE 7 (20–30 adult pilot) → PHASE 8 (Organism Lab).

# 24. THE FINISH LINE

Not: "a living brain." The finish line is demonstrated behavior:

> **The system accumulates experience; forms and tests predictions about the world and itself; detects prediction errors; investigates valuable uncertainty; changes permitted internal models or strategies based on evidence; changes its future decisions because of that history; preserves immutable evidence and external evaluation; and can explain and express the resulting loop to a human.**

That is concrete. That is testable. And if we eventually demonstrate something beyond that, we can name it afterward.

# 25. THE ONE-SENTENCE POSITION

Externally: **Techgram is an adaptive learning system built on a general decision engine.** Internally: **we are building a developmental cognitive engine, initially embodied in education, whose intelligence is demonstrated by measurable changes in the machinery generating its future decisions** — a TARGET ARCHITECTURE, not a claim that the system already possesses such cognition.

# 26. THE NON-NEGOTIABLE CHRONOLOGY

1. We built the original Techgram decision brain. 2. We tested and hardened it. 3. We froze that architecture. 4. We then asked a larger question: can we build a general cognitive layer around/above it? 5. We developed C-series ideas. 6. Those became G-series ideas. 7. Those became S-series developmental ideas. 8. The consolidation attempted to merge them. 9. The consolidation accidentally blurred frozen Techgram brain + new cognitive runtime. 10. **This roadmap separates them again.** That distinction is now architectural law.

# 27. THE RULE FOR FUTURE LLMs / CODING AGENTS

Never infer: contract exists → mechanism exists. Never: mechanism exists → it works. Never: test passes → intelligence demonstrated. Never: simulated improvement → human efficacy. Never: self-model database changed → self-development occurred. Never: Executive class exists → cognition exists.

Every claim must identify its evidence level: **SPECIFIED → IMPLEMENTED → UNIT-TESTED → INTEGRATION-TESTED → SIMULATED → MATCHED-BASELINE-VALIDATED → REAL-WORLD OBSERVED → PILOT VALIDATED → GENERALIZED.** This prevents another roadmap from quietly turning architectural aspiration into accomplished fact.

# FINAL BUILD PRINCIPLE

**Do not rebuild the frozen Techgram brain. Do not pretend the cognitive model already exists. Build the missing cognitive runtime above the frozen brain. Prove each mechanism before giving it a larger philosophical name.**

The machine does not become "alive" because we gave it `SelfModel.ts`. It becomes interesting when experience → prediction → error → investigation → internal change → different future decision is real, reproducible, measurable, and resistant to cheating.

**That is the roadmap.**

## 10 October product delivery status [ADR-047–049]

Historical Phases 0–6 and simulator limits remain. The rendered product now implements the full reference journey and sidebar pages with one server-owned learning engine. Not every kernel demonstration feature is exposed: adapter supports supplied teaching, retrieval/diagnostic questions and topic switches; voice and simulated-gain strategy adoption remain unavailable/deferred.

Frontend review comes first, then backend polishing, operational/PostgreSQL/staging checks, content and adult pilot. Connected mode is API-dependent; full offline sync and institutional controls remain open. Generated current JavaScript total is 298 (282 kernel + 16 frontend); older 291 above is historical. Real learner efficacy is not established.

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
