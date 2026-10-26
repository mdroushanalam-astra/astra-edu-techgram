# TECHGRAM — ARCHITECTURE (WORKING SPECIFICATION)

> **Current status (10 October 2026):** connected authority and reference frontend implemented; Founder review/release/pilot gates open. See the dated addendum and CURRENT_STATE. Older sections retain historical context.

## The V1 brain, module by module. This is the build contract.

> **Change control:** any modification to this specification requires an entry in `DECISIONS.md` (ADR) — no silent architecture changes. Implementation status is tracked in `CURRENT_STATE.md`; build evidence in `EXPERIMENTS_AND_TESTS.md`.

*Consolidates: v2 Notebook (Parts 0–27) + v2x Execution Plan, with every contradiction resolved per `01_COMPLETE_AUDIT.md`. Everything here is binding. Superseded ideas from the current Python prototype are marked `[PORT]` (port the invariant), `[SUPERSEDED]` (replace the math), or `[LAB]` (lives in Python forever).*

---

## 0. SYSTEM SHAPE

```
┌──────────────────────────── SURFACES (cherries) ──────────────────────────────┐
│ Onboarding · Plan/Calendar · Session UI+Teacher · Mock Centre · Forecast ·    │
│ Progress/Share · Notifications · Brain Lab                                    │
└──────────────▲─────────────────────────────────────────────▲─────────────────┘
        slot requests (decide)                       events (observe)
┌──────────────┴─────────────────────────────────────────────┴─────────────────┐
│                 KERNEL  (pure, versioned, replayable, NO LLM)                │
│   observe · state · decide · forecast · explain · learnOffline               │
├──────────────────────────────────────────────────────────────────────────────┤
│ B1 Events │ B2 Belief │ B3 Memory │ B4 Exam │ B5 Diagnostic │ B6 Planner     │
│ B7 Composer │ B8 Teacher │ B9 Behaviour │ B10 Diagnosis │ B11 PostMortem     │
│ B12 Receipts + Envelope                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ B0 KNOWLEDGE ASSETS: graph · items · atoms · PYQ weights · misconceptions ·  │
│                      exam spec (all versioned, signed)                       │
└────────────▲─────────────────────────────────────────────────▲──────────────┘
     params packs (signed, versioned)                    event sync
┌────────────┴──────────────┐   ┌──────────── Node sync server ─────────────┐
│  PYTHON LAB (offline)     │   │ sync · recompute-and-verify · nightly     │
│  simulator · calibration  │   │ jobs · calibration storage · content      │
│  fitting · Brain Lab      │   │ compiler · LLM gateway (ONLY LLM import)  │
└───────────────────────────┘   └───────────────────────────────────────────┘
```

**Runtime topology (decided):**
- **Kernel = TypeScript**, one package shared by the PWA (on-device) and the Node server (verification + nightly jobs). Same code, same golden tests, bit-identical results.
- **Student state lives on-device** as an append-only event log + snapshots. The server stores the same events and **recomputes state to verify** — a tampered client cannot corrupt truth.
- **Python = the Lab**: simulator, calibration analysis, parameter fitting, Brain Lab. The current FastAPI prototype's numeric engines seed this lab; its test suite is the porting contract.
- **LLM gateway** exists only server-side in the communication module. No import path from the kernel (CI-enforced).
- Stack: TypeScript kernel · Next.js/React PWA (service worker + IndexedDB queue) · Node API · Postgres (events as JSONB, partition by month later) · pgvector · Python lab (numpy/scipy) · LLM gateway (provider-agnostic, circuit breaker, cache).

---

## 1. KERNEL API — the only thing features may call

```ts
interface Kernel {
  observe(e: StudentEvent): Receipt<void>;              // idempotent
  state(studentId: ID, at?: Time): StudentState;        // projection of events
  decide(req: DecisionRequest): Decision;               // the universal call
  forecast(studentId: ID, plan: Plan, horizon: Days): Forecast;   // counterfactual-lite
  explain(decisionId: ID): StructuredExplanation;       // never free text
  learnOffline(batch: EventBatch): ProposedParams;      // human-gated deploy
}

type Slot =
  | "NEXT_SESSION" | "NEXT_STEP_IN_SESSION" | "TEACHER_MOVE"
  | "MOCK_PLAN" | "FORECAST" | "NOTIFICATION"
  | "PARENT_REPORT_SECTION" | "THREAD_SUGGESTION";      // threads post-pilot

interface DecisionRequest { studentId: ID; slot: Slot; now: Time; context: Ctx; }
interface Decision {
  slot: Slot; chosen: Action; candidates: ScoredAction[];
  propensity: number;            // logged for off-policy evaluation
  constraints: ConstraintCheck[]; envelope: EnvelopeSummary[];
  expected: Prediction[];        // what we think will happen
  paramsVersion: string; receiptId: ID;
}
```

**Engine contract (the key engineering pattern):** every engine is a pure function
`f(prev_state, event, params, time, seed) → (state, events, receipt)` — no hidden I/O, no LLM, no wall-clock reads, randomness only via a logged seeded RNG. Any decision replays bit-for-bit.

---

## 2. MODULE SPECIFICATIONS

### B0 — Knowledge Assets (the bottleneck; treat like engineering)
| Asset | V1 minimum | Notes |
|---|---|---|
| Polity topics | ~35 | Level-2 nodes; diagnostic runs here |
| Polity concepts | ~150 | Prerequisite edges + **confusability edges** |
| Verified items | **~500** (≥3/concept; 5–6 for high-weight) | concept tags, expert difficulty 1–5, expected time, **distractor→misconception tags**, rationale |
| Content atoms | ~150 (explanation/example/mistake/hint-ladder) | 2 variants for top ~20 concepts (uplift seeds) |
| PYQ weight table | 10–15 yrs of Prelims mapped to concepts | gives `w_c` to the planner |
| Misconception ontology v0 | ~60–100 labelled confusions | authored from distractors |
| Exam spec | paper size, marks, negative marking, cutoff prior | historical cutoffs |
| Sectional mocks | 2 × 50Q | never reused in diagnostics |

Content compiler (offline): sources (licensed/original — **never assume NCERT public domain**) → chunk → concept-tag → LLM drafts atoms → automatic checks (source grounding, entity/number match, reading level, banned phrases) → **risk-weighted human review** (facts/numbers 100% reviewed) → signed versioned atom. Wrong-fact reports pause serving.

### B1 — Event Fabric `[PORT: from prototype events.py, hardened]`
- Append-only, typed, provenance-tagged; state is a projection; **idempotency key unique**; `schema_version` on every event; out-of-order and duplicate tolerant.
- V1 event set: prototype's 12 (assessment_completed, item_response, session_started/completed/abandoned, help_requested, content_skipped, confidence_reported, goal_set, revision_completed, login, schedule_viewed) **plus**: `hint_level_used`, `answer_changed`, `time_to_first_action`, `notification_opened`, `schedule_overridden`, `scorecard_imported`, `explanation_read_time`.
- Rule: **log raw, derive later.** Signals not logged are lost forever.

### B2 — Belief Engine (the core of data-light intelligence)
- **State:** per student, mean `μ ∈ R^N` + covariance `Σ ∈ R^{N×N}` over logit mastery of N≈150 concepts. (22.5k numbers — trivial on a phone.) Reported mastery = `σ(μ)` ± interval from Σ after ×1.2 inflation.
- **Prior = structure:** `Σ0 = V · normalize(a·11ᵀ + b·TTᵀ + c·K_graph + d·I)` — general / topic / graph-smooth / concept-specific shares `(0.25, 0.25, 0.15, 0.35)`, `V ≈ 1.4`, `K_graph = (L + 0.3I)⁻¹` from the prereq Laplacian. All `assumed` until empirical Bayes at ~500 students.
- **Prior mean μ0:** onboarding (attempts, months, self-rating capped `self_reported`) + **imported test-series scorecards** (highest-information onboarding item).
- **Observation model:** `P(correct) = g + (1−g)·σ(a(θ_c − b))`, `g=0.25`, `a≈0.9`; `b` from expert map `{−1.2,−0.6,0,0.6,1.2}`, Elo-refined ≥30 responses/item; 2PL only ≥200–300. `[SUPERSEDES: prototype IRT-as-runtime]`
- **Update = rank-1 EKF** (one answer updates the answered concept *and every correlated concept* via `Σ[:,c]` — this is the whole trick behind "inferring" prerequisites):

```ts
function observe(st, item, y /*0|1*/, evidenceW) {
  const c = item.concept;
  const z = sigmoid(item.a * (st.mu[c] - item.b));
  const h = item.g + (1 - item.g) * z;            // predicted P(correct)
  const H = (1 - item.g) * item.a * z * (1 - z);  // dh/dθ
  const R = Math.max(h * (1 - h), 1e-3) / evidenceW;
  const s = H * H * st.S[c][c] + R;
  const col = st.S.map(r => r[c]);
  for (let i = 0; i < N; i++) st.mu[i] += col[i] * H / s * (y - h);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++)
    st.S[i][j] -= col[i] * col[j] * H * H / s;
}
```

- **Evidence channels (squeeze more bits per interaction):** response time (rapid guess → `evidenceW=0`), confidence 1/2/3 (weights 0.5/1.0/1.3; **sure+wrong** boosts misconception posterior; **guess+correct** down-weighted and re-asked), hints used (each level halves evidence), elimination interactions (partial credit), imported scorecards (noisy pseudo-observations).
- **Time update (forgetting, coherent with B3):** `d = exp(−Δt/S_c)`; `μ_c ← μ0_c + d·(μ_c − μ0_c)` (decays toward prior mean, not zero); `Σ ← DΣD + (I−D²)∘diag(Σ0)`. Learning = control input: `μ_c += gain(u, m, c)` with added variance. Gains are `assumed` (retrieval +0.30±0.15 per effective 10 min; worked example +0.35; re-reading +0.10; interleaved +0.25), scaled by `(1−mastery)`.
- **Honest reporting (non-negotiable):** inflate variance ×1.2–1.25 (simulation finding); report `mean ± 80% CI, n_eff, last_observed, evidence_mix`; `n_eff < 3` → render **"unknown-ish" grey** regardless of mean; **second opinion**: per-topic Elo; `|Elo − filter| > threshold` → `model_disagreement=true`, widen bands, raise the topic's information value. `[PORT: prototype's reconciliation-preserves-disagreement principle]`

### B3 — Memory Engine: **Techgram Memory Model** (custom, DSR-inspired) `[RENAMED 2026-10-02, ADR-019 — not literally reduced FSRS; benchmark vs FSRS/SM-2/exponential once review traces exist; status: assumed]`
- Per concept: stability `S_c` (days), difficulty `D_c`, last review, reps, lapses. Retrievability `R(t) = (1 + t/(9S))⁻¹`.
- Initial stability by concept type (`assumed`): factual ~3d, conceptual ~8d, applied ~12d; shrink toward student-specific as reviews accumulate (personalize at ~50+ reviews).
- Update: correct → `S' = S·(1.6 + 0.8·(1−R_at_review))` cap ×3; wrong → `S' = max(0.5, 0.4·S)`, lapses++.
- Feeds B2's time update — **forgetting and mastery are one coherent state**. Scheduling is the planner's job (B6), by marginal exam-day gain, not fixed intervals.

### B4 — Exam Model + Monte-Carlo
- Exam spec is data (100Q × 2 marks, −2/3 negative, cutoff prior from history, blueprint = PYQ weights).
- **2,000-draw simulation of exam day:** θ drawn from belief propagated to exam day under a plan (forgetting included); per-question correctness from item model; attempt policy = confidence-calibrated break-even; marks with negative marking → score distribution, **P(score ≥ cutoff) as a scenario number with its own (wide, early) uncertainty**.
- Claims policy: always displayed as *"model-based scenario, not a prediction"*, assumptions one tap away. Never a bare "X% chance to clear".
- What-if forecasts: `forecast(planA vs planB)` → Δ expected marks and Δ clearing probability with intervals; gain parameters labelled `assumed`.

### B5 — Adaptive Diagnostic (CAT, closed-form information gain)
- Item value: `value(i) = H_i²·q_c / (H_i²·Σ_cc + R_i)`, `q_c = Σ_j w_j·Σ_jc²` (exam-weighted uncertainty reduction). Constraints: topic coverage floors, no repeats, difficulty in the student's 50–70% success band.
- Stop at 20–25 items or when posterior sd of expected score drops below target.
- Results screen: **score band + per-topic confidence map (grey = unknown-ish) + "what we know / don't know" + 2–3 one-tap "sharpen" actions.** Never a bare percentage. An entry ticket, not a verdict.

### B5.5 — Action Outcome Model (AOM) — [ADDED 2026-10-02, ADR-015; build in Phase 2]
The organ that turns the planner from a heuristic optimizer into a decision engine. Answers: *given this student state, concept, action, duration, and context — what distribution of outcomes should we expect?* Outputs per action: Δmastery, Δretention, exam-value (marks), fatigue, uncertainty-reduction — each with confidence and `assumed|measured` status.
- **V1 (no data):** the AOM *is* the versioned prior table (the learning-science gains) + the **never-self-fooling loop**: `PRIOR → PREDICTION (recorded in the receipt BEFORE the action) → ACTION → OBSERVED OUTCOME → PREDICTION ERROR → MODEL UPDATE (human-gated, versioned)`. The planner consumes AOM outputs and never hardcodes gains.
- **Closed-loop hallucination ban:** a gain value may never be "validated" by a simulator that assumed it; only real outcomes or explicitly independent simulator worlds (ADR-016) may update AOM parameters. The `assumed → measured` badge migration is the AOM's public face.

### B6 — Planner (the real differentiator)
- **Objective:** maximise expected exam-day marks (later: P(clear)) over remaining days, **averaged over K≈16 posterior draws** (robust; optionally CVaR-weight the worst quartile) **+ value-of-information bonus** for uncertainty-reducing actions in high-weight areas.
- Actions: `learn(c) · review(c) · practice(c) · diagnose(topic) · mock(sectional) · rest` with prior minutes/load tables.
- Score: `score = (mean_draws[Δ w_c · examProb(action)] + λ·VoI) / minutes` — greedy fill under constraints.
- **Constraints:** available minutes; prerequisite order (unless remediating); fatigue/variety; plan-stability penalty (no whipsawing); minimum coverage floors; **triage mode** in the final ~60 days (parameter schedule, not special code: consolidation + mocks up, new low-weight topics penalised).
- Output: plan JSON with blocks, expected marks gain, uncertainty, assumptions, receipt id. Receipt explains every block as "gain per minute to your exam".

### B7 — Session Composer
- 40 min is a **default parameter, not dogma** (25/40/55 testable later). Segment mix from the plan: `[due-review retrieval 5–8] → [new/weak concept 12–15] → [practice w/ feedback 10] → [transfer/interleave 5] → [calibration + wrap 3–5]`. Interrupted segments roll forward with a stability penalty.

### B8 — Teacher (scripted state machine) `[PORT: prototype TeachingBrief + fallback instinct]`
- 12 deterministic moves with selection conditions: `DIAGNOSTIC_PROBE · EXPLAIN · WORKED_EXAMPLE · FADE_EXAMPLE · RETRIEVAL_PROMPT · HINT_L1/L2/L3 · CONTRAST · SELF_EXPLAIN_PROMPT · TRANSFER_ITEM · CALIBRATION_PROMPT · ENCOURAGE_REFRAME · SUMMARISE_CLOSE`. (Full rule table in v2x §10.2 — e.g. sure+wrong → CONTRAST + misconception counter; 2 wrong + fast → reframe + difficulty −0.5 logit.)
- **The move is the intelligence; the sentence is decoration.** Rendering tiers, in order: (1) stored atom text for (atom, lang, length); (2) NLG template filling atom fields; (3) LLM paraphrase under **fact-lock** (no entities/numbers absent from the atom); (4) raw atom. LLM = tier 3 of 4.
- Doubts cascade: normalise/language-id → duplicate-cache hit → small local intent classifier → retrieve atoms + templated answer → (optional, low-confidence) grounded LLM answer, fact-locked, cached → else "saved for thread/mentor". Embeddings and classifiers are ML but **not generative dependence**.

### B9 — Behaviour Engine (rules first)
- Daily deterministic features: adherence, active days (14d), median start hour + spread, abandonment minute, hint rate, rapid-guess rate, answer-change rate, avoidance patterns, confidence–accuracy gap, notification response by hour.
- **Archetype flags (rules → action changes, never student-facing labels):** difficulty-driven exit → scaffold/lower difficulty; passive consumption → retrieval-first; help-dependent → hint fading; productive struggle → maintain challenge; cramming → spaced framing + forgetting forecast; avoidant → small-win entry task; overconfident → calibration drills; **burnout drift → lighter plan + human-support nudge, never escalation**.
- **Belief probes:** e.g. 3 missed sessions → hypotheses {schedule mismatch, difficulty, motivation, interruption, notification ignored}, hand-set likelihoods → if top posterior < 0.5, one-tap probe; answer enters as `self_reported` (confidence capped 0.5). `[PORT: prototype's belief-state idea, made concrete]`
- Notifications: ≤1/day, at median start − 15 min, skip if plan done, halve after 2 ignored, quiet hours. Outcome = **learning-relevant return**, not opens.

### B10 — Diagnosis + Misconception Engine
- Root-cause score per prerequisite: `suspect(p) = (1−σ(μ_p)) · corr_post(p,c) · edge_strength`; suspect + uncertain → **diagnostic probe on p first**; suspect + certain → remediate p first. `[PORT: prototype's bottleneck rerouting, now with posterior correlation]`
- Misconceptions: tagged distractor → misconception id; per-student Beta counters (sure+wrong ×2). **Three tiers [REVISED 2026-10-02, ADR-019]:** **Candidate** (n≥1 → investigate) / **Probable** (n≥3 + consistent evidence → targeted probe) / **Confirmed-for-action** (n≥3–4 + sure-wrong + repeated context → CONTRAST + targeted items). High-frequency unlisted distractor patterns → candidates for new ontology nodes (human review). This is moat M2 accruing.

### B9.5 — Personalisation State v1 [ADR-024, added 2026-10-02]
Measured behavioural features computed from the event log and consumed by planner/teacher/notifications: momentum · fatigue slopes (time + error) · frustration signature · load tolerance · measured optimal session length · chronotype window (only when logged) · avoidance map · recovery rate. Observable-State Law [ADR-023] governs all claims. Tests: `test/personalisation.test.ts`.

### B11 — Mock Post-Mortem + Attempt-Policy Coach (the data-light wow)
- Per question: answer, correctness, time, confidence, answer-changes, position, pre-mock belief `p_c`.
- Deterministic classification: knowledge gap / trap (tagged distractor + confident) / careless (fast + knew) / time pressure / bad guess (−2/3 + opportunity) / **over-skip** (expected value shown) / **unclassified shown as unclassified**. Output: "You lost ~22 marks: 9 knowledge gaps (3 topics), 5 traps (Art. 19 vs 21 ×3), 3 careless, 3 bad guesses, 2 over-skips. Following your own break-even policy ≈ +5 marks."
- Attempt policy: 4 options, −1/3 → break-even `p* = 0.25` risk-neutral (0.30–0.35 near cutoff); coach uses the student's **calibrated** confidence→accuracy mapping.

### B12 — Receipts + Envelope `[PORT: prototype evidence.py + epistemics.py, enriched]`
- **Envelope fields:** value, unit, knowledge_type (assessed/inferred/predicted/self_reported/computed/unknown/decayed), observation_basis (mock_test/session_quiz/diagnostic/item_response_pattern/behavioral_log/self_declaration/system_default/state_fusion/llm_rubric), observed_at, valid_until, decay_model/halflife, confidence, sample_size, uncertainty, value_semantics (exact/lower_bound/estimate), model_id/version. Constructor rules from the prototype port 1:1 **plus the no-upgrade invariant**: derived type ≤ strongest input type (an LLM rubric score can never become high-confidence `assessed`).
- **Receipt JSON:** decision, slot, inputs (with intervals + basis), prediction (if-no-action vs if-action), candidate actions with scores, selection reason, constraints checked, confidence, assumptions (`assumed`/`measured` + sensitivity), unknowns, expected outcome, **what-would-change-my-mind**, params_version, propensity. Actual outcome + prediction error joined later.
- Receipts are **user-visible** ("Why this?" — template-rendered from JSON, LLM optional polish) — this is what no wrapper can fake.

---

### B12 — Session-Experience Layer [ADR-027/028, added 2026-10-02 — an UPGRADE of B7/teach_loop, not a second brain]
Single-brain invariant (ADR-027.7): no parallel session planner. B7 becomes **the compiler from brain decisions + student state + content into an executable learning session**:
- **SessionSpec → SessionPlan (narrative arc)**: orientation → prior-knowledge probe → hook → discovery → micro-quiz → concept construction → real-world application → transfer → retrieval → synthesis → **open loop** (curiosity) — minute-budgeted, every segment carrying objective, concepts, teacher-move hint, expected evidence, personalization policy, fallback, completion condition.
- **PreferenceState** [AOM-style]: preference hypothesis → predicted response → observed → prediction error → update. No personality labels — estimates with n and error.
- **CuriosityState**: educationally-useful curiosity only (relevance + difficulty-fit + novelty + student interest − interruption cost); student-generated questions preserved as evidence.
- **StudentArtifact**: student-produced cognition (notes/answers/explanations) with **reasoning lineage** (claim → reason → evidence → confidence → correction → later reasoning). Powers THEN/NOW conceptual-change moments and notebook linkage.
- **BreakPolicy**: from measured fatigue slopes — \"your response time rose 28% over 9 questions; recommend a 12-minute break.\"
- **SessionOutcome**: planned vs actual, mastery deltas, misconception changes, preference signals, return outcome, predicted vs observed — the AOM's session-grade fuel.
- **Mismatch detection**: \"I thought you preferred diagrams; examples work better for you — adjusting.\" A trustworthy system must know when its model of the student is wrong, and say so.
- **Social slots** [ADR-028]: anonymous aggregate social proof + compatibility-based study-room invitations as brain decisions; the social product is post-beta (gated).
- **Golden replay gate**: Class 8 → IAS → Geomorphology → 40 min → LLM OFF, Worlds A–H (clean/false-confidence/low-energy/resistant/unusual-preference/preference-wrong/no-LLM/missing-asset). A machinery gate, not an efficacy proof.

### B13 — Agency Transfer + the Allocation Wires [ADR-029/030/031, added 2026-10-03 — FROZEN]
- **agency.ts**: 8 decision types (topic/retrieval/difficulty selection, misconception detection, session length, break timing, help seeking, strategy) × 3 observed modes (accepted_recommendation 0 / proposed_with_reason 0.5 / decided_independently 1); shrinkage-smoothed index (k=5); stages `techgram_led`/`shared`/`student_led` (behavioural descriptors, never labels); `agency_observed` event replays bit-identically; `first_independent_decision` milestone in the validation surfaces.
- **ANTI-GOODHART (structural):** `agencySurface()` renders stage names + counts + next transfer move ONLY — the raw scalar is omitted by construction. No rendered surface may show a gamifiable mastery/agency number.
- **Planner consumes measured behaviour** [ADR-030]: PersonalisationState + B9 flags change plans (rest-day → review-only 15m; lighten → ×0.5; load tolerance → ×1.1 day cap; fatigue slopes → learn 20m/practice 15m; avoidance → ×0.6 soft penalty, due reviews immune), every change logged in `plan.personalisationApplied` and surfaced in the receipt.
- **Opportunity cost:** `plan.foregone` + receipt `opportunity_cost` — every plan names the best action it did not buy, and why.
- **Mismatch minimum:** `predictionErrorStats` — ≥3 consecutive relative prediction misses >0.5 flag the human-gated loop.
- **Validation surfaces** (S3, ADR-027/028): growth receipt, capability journey, changed-my-mind, milestones, curiosity ledger — bands everywhere, evidence-only claims.
- **FROZEN [ADR-031]:** the whole of §2 is a signed freeze boundary (docs/BACKEND_FREEZE_CHECKLIST.md). Allowed: correctness/security/perf/compliance. A frontend-discovered hole may be raised as an ADR with evidence.

## 3. GOAL SPEC (how everything later is config)

```json
{ "id": "upsc_cse_prelims_2027", "deadline": "2027-05-24",
  "evaluation": { "type": "exam", "sections": [
      { "name": "GS1", "questions": 100, "marks_each": 2, "negative": 0.66,
        "cutoff_prior": [88, 98] } ] },
  "targets": [ { "concept": "polity.fr.art21", "weight": 0.8, "target_level": 0.85 } ],
  "constraints": { "hours_per_day": 6, "min_coverage": { "GS1": 0.9 } },
  "payoff": "expected_marks" }
```
JEE/K12/Career = different graph + weights + payoff. **No kernel changes.** This is the mechanism that makes the long-term vision cheap.

---

## 4. DEGRADATION TIERS (the product never crashes)

| Tier | Condition | Experience |
|---|---|---|
| T0 | LLM healthy | Full conversational teaching, Q&A |
| T1 | LLM slow/limited | Cached verified atoms; Q&A queued or nearest-atom retrieval |
| T2 | LLM down | **Template rendering**: structured cards, quiz, plan, receipts — decisions identical |
| T3 | LLM + vector search down | Static content packs, dashboard, spaced-repetition quiz |
| T4 | Network down | **Offline PWA**: local event queue, local copy of today's plan + items; sync later (server recomputes to verify) |

**Offline honesty caveats [ADDED 2026-10-02, ADR-019]:** the invariant is *"network unavailable → Techgram still functions,"* NOT "browser storage is immortal." Browser storage has quotas/eviction policies — mitigate with persistent-storage requests, explicit export/backup, encrypted local state, sync verification, and recovery tests. Separately: **notification delivery is network/platform-dependent** (push requires a server path) — core intelligence is offline; delivery channels are not. Never conflate the two in claims.

Engineering rules: circuit breaker + timeout on every LLM call; **deterministic fallback written FIRST for every LLM touchpoint** (the prototype's `generate_opening_dialogue` instinct, done systematically); idempotent ingestion; schema validation at boundaries; engines pure and synchronous; **precompute tomorrow's plan + session packs nightly** (morning needs zero heavy compute); monthly game-day with the LLM host blocked.

---

## 5. LLM CHERRY (modes + dependency index)

| Mode | LLM does | When | Guardrail |
|---|---|---|---|
| **M0** | Nothing | Default, outage, offline | Entire product works |
| **M1** | Paraphrase chosen atom; grounded open-doubt answers | Online, budget allows | Fact-lock vs atoms; every answer cached |
| **M2** | Mains rubric scoring as **sensor** | Pilot only | `basis=llm_rubric`, confidence capped until human-calibrated |
| **M3** | Offline content drafting | Compiler | Human review before serving |

**LDI (measure, publish internally):** LDI-tokens <5% · LDI-decisions **= 0% (CI-enforced)** · zero-LLM session rate >95% · monthly outage drill.

---

## 6. TESTING & ANTI-FRAGILITY (what "brutal" means operationally)

1. **Simulator first — now FOUR WORLDS [G0 redefined 2026-10-02, ADR-016]:** World A *Friendly* (per Techgram assumptions — the current lab), World B *Misspecified* (different forgetting/gains/noise/adherence), World C *Adversarial* (sabotaged beliefs, overreported confidence, halved gains, one wrong prereq edge, abrupt availability), World D *Hidden benchmark* (frozen world configs the developers never see; run before releases). A simulator built from the planner's own assumptions cannot be the proof — public claims cite World D or real-pilot data only. The simulator still ranks algorithms and catches bugs; it does not prove real-world efficacy.
   **Brain Lab public demo = 8 screens [adopted 2026-10-02]:** (1) meet the synthetic student (goal, days left, hidden truth) → (2) Techgram's initial belief + unknowns + uncertainty level → (3) why THIS next question (weight × uncertainty × info gain) → (4) answer → belief before/after with intervals → (5) tomorrow's plan with reasons → (6) what-if: syllabus-order comparison → (7) 60-day race vs 4 schedulers against hidden truth → (8) **unplug-the-LLM toggle: decisions identical** + one-brain/many-cherries view.
2. **Replay + determinism:** any state/decision reproducible from `events + params_version + seed`; golden-replay tests after every refactor.
3. **Property tests:** mastery ∈ [0,1]; consistent evidence shrinks intervals monotonically; correct never lowers mastery (within one model); retrievability decreases with time; plan ≤ available minutes; no concept scheduled before unresolved hard prereqs; **no-upgrade invariant**; idempotency.
4. **Chaos game-days:** kill LLM/vector/queue/network; skew clocks; duplicate/late/malformed events; flood sync; downgrade app version → no crash, no corruption, clean recovery.
5. **Shadow mode + canary:** new params compute in shadow, compare agreement/calibration, canary 5%, auto-rollback, **human gate on every parameter deploy**.

**Acceptance gates:** G0 simulator (planner beats baselines, pre-registered margin, ≥5 archetypes) · G1 replay · G2 no-LLM · G3 pilot retention · G4 calibration band · G5 learning vs control schedule · G6 outcome cohort.

---

## 7. INSTRUMENTATION FROM DAY 1 (the moat sensors)

Every randomised choice logs **exposure + propensity**; every exposure logs **p_before** and joins the **delayed check outcome** (uplift residual); every distractor choice is logged (misconception discovery); **outcome-label consent** captured at onboarding; raw timings and hint events kept forever (features can be re-derived). Exploration floor ε≈0.15 only among verified variants, only on the ~20 two-variant concepts. No uplift claims until sample sizes support them.

---

## 8. ASSUMPTIONS REGISTER (every guess in V1, and what replaces it)

| Assumption | V1 value | Replaced by | Data needed |
|---|---|---|---|
| Variance shares (a,b,c,d) | .25/.25/.15/.35 | Empirical Bayes | ~500 students |
| Prior total variance | 1.4 | Fitted | ~500 |
| Item difficulty `b` | expert 1–5 map | Elo → 2PL | 30+ / 200–300 resp/item |
| Discrimination `a` | 0.9 fixed | Fitted | 200–300/item |
| Guess floor `g` | 0.25 | Per-item/student | 1k+ responses |
| Variance inflation | ×1.2 | Coverage-calibrated | Calibration data |
| Initial stability | 3/8/12 days by type | Fitted + personalised | ~50 reviews/student |
| Learning gains per action | table (B2) | Estimated from outcomes | Randomised exposures |
| Cutoff prior | Historical | Updated yearly | Official data |
| Rapid-guess threshold | 0.15×expected time | Per-item time models | Time distributions |
| Confidence weights | .5/1/1.3 | Calibrated | Confidence data |
| Archetype rules | Hand-set | Validated | 1k+ sessions |

Receipts show `assumed` vs `measured` per parameter — nobody mistakes a guess for a finding.

---

## 9. REPO LAYOUT

```
techgram/
  packages/kernel/        # TS kernel — pure, no I/O, no LLM (CI-enforced)
    src/{events,envelope,belief,memory,exam,diagnostic,planner,composer,
         teacher,behaviour,diagnosis,postmortem,receipts}/
    test/  (property · golden-replay · no-LLM · simulator-regression)
  apps/pwa/               # Next.js PWA — offline queue, sync, rendering
  apps/api/               # Node — sync, recompute-and-verify, nightly jobs, LLM gateway
  lab/                    # Python — simulator, calibration, fitting, Brain Lab
    sim/  calib/  fit/
  content/                # graph · items · atoms · PYQ weights · misconceptions · exam spec
                          # (versioned, signed; compiler + reviewer workflow)
  backend/                # [ARCHIVED REFERENCE] Python prototype — test contracts ported,
                          # numeric engines seed lab/
  docs/                   # this document set
```

---

## 10. PRIVACY, SAFETY, COMPLIANCE (designed in, not bolted on)

- **18+ at launch** (minors' DPDP/COPPA-grade consent deferred with K12).
- DPDP-aligned: consent versioning, purpose limitation, data minimisation (on-device state = the privacy story), deletion honoured.
- No sensitive inference: burnout drift = scheduling signal + human-referral nudge; never a diagnosis, never a label.
- Wellbeing guardrails outrank engagement: daily load caps, rest days, no streak-shaming, notification caps.
- Fairness: calibration checked across language/device/region groups.
- Content correction flow pauses a flagged atom immediately; correction is an event, auditable like everything else.

---

## 11. SYSTEM B — THE COGNITIVE RUNTIME [ADR-035..046, built 2026-10-04]
The frozen brain above (System A) is untouched — behavioral invariance is test-enforced (shadow-belief deep-compare in every Layer Study scenario; Phase 0 purity tests). Above it sits the cognitive runtime:
- `cognitive/executive.ts` — C1: workspace → candidates → constraints (contract + ethics) → consequence-aware select → receipt. Owns StrategyParameters (its only self-tunables) + proportional self-model levers + the live calibration channel [ADR-041/046].
- `cognitive/self-development.ts` — S0–S4: genesis, self-prediction, the Self-Error Ledger, VoI self-inquiry, strategy experiments, the phase2 gate.
- `cognitive/developmental-session.ts` — THE COMPOSED LOOP: S1 predict before every decision → decide with insights → S2 structural judging → ledger → deriveSelfInsights → next decisions. Counterfactual switch: learningEnabled:false.
- `cognitive/strategy-experiments.ts` — proposal → matched A/B → keep/reject on TRUE learning → adoption into future sessions.
- `cognitive/expression.ts` — typed utterances under the claim-provenance law; the ethics wall enforced AT THE VOICE; why-this + earned self-correction; density control; board payloads; the bounded LLM bridge.
- `cognitive/conductor.ts` + `experience-plan.ts` — the seam and the execution steps.
- `cognitive/targeting.ts` — staleness-aware need [ADR-046]: long-untouched concepts get a bounded maintenance boost.
- `adapter/world-adapter.ts` + `adapter/worlds.ts` — THE UCS BOUNDARY: worlds (UPSC Polity, CBSE-8, synthetic), 10 student archetypes, prior weights (the Executive may aim with) strictly apart from external weights (the evaluator — brain-inaccessible).

**The laws:** the Executive decides → the Conductor executes → Presence expresses → the LLM voices → the UI renders (never the reverse) · no self-update without evidence (the counterfactual switch is the standing proof) · anti-Goodhart (the evaluator is never consulted by the brain — ablation-proven) · every layer traced and ablation-measured [ADR-045].

*Spec complete. Cognitive-runtime sequence: `10_MASTER_ROADMAP.md` (Phases 0–6 COMPLETE). V1-A product sequence: `05_ROADMAP.md`.*

## 12. Active product boundary — 10 October 2026 [ADR-047–049]

React journey → authenticated Python API → owned/locked learner transaction → compiled TypeScript runtime → atomic projection/command history → public LearningView. Current routes: `/auth/register|login`, `/students`, `/student/onboard`, `/learning/{student_id}/start|answer`. Start/answer use UUIDs, issued item IDs/revisions; server-held content grades answers. Future correct options/private context do not reach the client before submission. Fresh DB sessions, locks and configured secrets replace cache/shared-session authority; production requires PostgreSQL/migrations.

The active frontend uses one presentation layer and preview/connected adapters. Real code owns controls/diagrams/drawing; art is presentation. Local notes/preferences cannot rewrite server evidence. Connected mode requires API availability; complete offline sync remains open. Python is active infrastructure, superseding archived-only descriptions. No new cognitive subsystem was added in the UI phase. The production adapter does not use simulator-gain strategy adoption, LLM actions or unobserved behavioural inference. Deployment/enterprise/pilot gates remain unearned.

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
