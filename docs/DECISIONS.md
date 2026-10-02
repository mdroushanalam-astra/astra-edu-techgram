# TECHGRAM — DECISION REGISTER (ADR)
## Every idea or architecture change: what changed, why, what was rejected, and what it cost.

> **Read me alone:** each decision below states its own context and consequences — no other document is needed to judge it. ("ADR" = Architecture Decision Record: a dated, numbered entry for one decision.) Plain-language translations: `FOUNDER_GUIDE.md` §10.

**Provenance:** ADR-001…013 were decided in GLM-5.3-Flash (Z.ai) sessions via ZCode, directed by the Founder, on 2026-10-02 — unless stated otherwise inside an ADR. **From ADR-014 onward, every ADR must record a `Decided by:` line** (human + exact model ID) per the MODEL STAMP RULE in `README.md` §3.

**Protocol:** every change to vision, architecture, algorithms, scope, or process gets an entry HERE (superseding entries reference their predecessor) + a Journal entry + updated docs. Statuses: PROPOSED → ACCEPTED → SUPERSEDED(by) / RETIRED. The Charter (`00_CHARTER.md`) can only change through this register.

---

### ADR-001 — Runtime kernel in TypeScript; Python becomes the Lab — ACCEPTED (2026-10-02)
**Context:** the Python/FastAPI prototype (50/50 tests) proved the loop, but the v2x execution plan specified a shared client/server kernel for the offline-first, on-device moat (M5) — the hardest thing to retrofit.
**Decision:** build the brain as a pure TypeScript package (`kernel/`) shared by PWA and Node server; Python stays for simulation, calibration, fitting (`lab/`); the Python backend is archived as reference — its envelope rules and test contracts port; its runtime math is superseded.
**Rejected:** Python-only path (closes the on-device door; two-stack rewrite later costs more).
**Consequence:** the prototype's 50 tests become porting contracts; numeric engines seed the Python lab.

### ADR-002 — FSRS-lite replaces SM-2 at runtime — ACCEPTED (2026-10-02, from v2 ruling)
**Why:** SM-2 (1990) is a fixed heuristic; FSRS-style Difficulty/Stability/Retrievability fits empirical review data better and integrates with the belief engine's time update (forgetting + mastery = one coherent state). SM-2 survives in the Python lab as a baseline comparator.
**Consequence:** `memory.ts` stability/difficulty/retrievability with concept-type priors (factual 3d / conceptual 8d / applied 12d — assumed until ~50 reviews/student).

### ADR-003 — Graph-prior Kalman belief engine is the primary estimator; Elo is the second opinion; BKT demoted out of runtime — ACCEPTED (2026-10-02, from v2 ruling)
**Why:** BKT has identifiability issues and needs per-skill data we don't have; the rank-1 EKF over (μ, Σ) with a structural prior is what makes little-data inference work at all (one answer updates correlated concepts via Σ[:,c]).
**Consequence:** disagreement between Elo and filter → `model_disagreement` flag, wider bands, higher information value (the prototype's "preserve disagreement" principle survives in a new body).

### ADR-004 — The planner values learning under a MAINTENANCE assumption — ACCEPTED (2026-10-02, build sprint)
**Context:** with a pure decay discount, the planner concluded learning 29 days before an exam was near-worthless (S=3–12d) and spent its days on 10-minute diagnostics; it lost to a random scheduler (125 vs 144 marks).
**Decision:** learn/practice/remediate gains are modelled with d=1 (the plan's own review schedule maintains taught concepts to exam day); reviews are valued by real stability growth. Receipts carry "assumed; maintained by plan reviews".
**Cost/risk:** if the plan fails to maintain (adherence collapse), realized gains < modelled — monitored via prediction_error on receipts; the sim's review mechanics validated the assumption (148 vs 149 marks of ideal fixed order).
**Evidence:** EXPERIMENTS §4 progression table.

### ADR-005 — Two-pass day fill; the review quota is a floor, not a lid — ACCEPTED (2026-10-02, build sprint)
**Context:** the single-pass fill skipped every high-value block while the review quota was unmet, then found fewer review minutes than the quota → 15-minute days (starvation).
**Decision:** pass 1 secures due reviews up to `min(minReviewShare, available review minutes)`; pass 2 fills remaining minutes by score. Block cap = floor(minutes/15).
**Evidence:** day plans went 15–30 min → 225–240 min; marks 130.6 → 148.3 (EXPERIMENTS §4).

### ADR-006 — Spacing rule at the event fabric: same-day responses = one memory review — ACCEPTED (2026-10-02, build sprint)
**Context:** one 25-min block emitting ~3 item responses tripled kernel stability per sitting (S≈13d vs truth ≈3.6d); the kernel stopped scheduling reviews and truth decayed.
**Decision:** `applyEvent` updates memory at most once per concept per logical day; belief still updates per response. Massed practice is one review; spacing is what grows stability.
**Evidence:** EXPERIMENTS §4; the spacing effect (Cepeda 2006) grounds it.

### ADR-007 — Prerequisite gate = ordering, not certainty — ACCEPTED (2026-10-02, build sprint)
**Context:** gating on belief σ(μ)≥0.55 lagged teaching by ~a day and idled dependent concepts (24/40 coverage).
**Decision:** gate opens on σ≥0.55 OR (nEff≥2 AND σ≥0.45). A prereq taught-and-failed (σ<0.45) stays shut — remediation is the task; an unstudied prereq blocks outright (property preserved: no hard-prereq skipping).
**Consequence:** param `prereqFloor=0.45` added; unlock cascade no longer starves days.

### ADR-008 — Paper-scale consistency for marks — ACCEPTED (2026-10-02, build sprint)
**Why:** blueprint weights summed to 19 questions but the paper is 100; expectedScore, trueExamMarks and planner gains must share one scale (×questions/Σw) or receipts contradict scenarios.
**Consequence:** all marks outputs are full-paper scale (~200); internal comparisons unchanged.

### ADR-009 — Diagnostic stops in the 20–25 item window — ACCEPTED (2026-10-02, build sprint)
**Why:** the early-stop (scoreSd < 4.0) fired at 10 items, under-delivering the honest-band promise; v2x specifies 20–25 items or a sd target.
**Decision:** early stop only at ≥20 items; max 25. Results screen stays bands + sharpen actions, never a bare percentage.

### ADR-010 — G0-lite measured as an archetype AGGREGATE, not single-seed/single-archetype — ACCEPTED (2026-10-02, build sprint)
**Why:** a consistent student on an ideal fixed order is the planner's hardest case (single-seed margins ±1 mark); the gate's claim is adaptation value, which only appears across archetypes.
**Decision:** CI gate = aggregate over 4 archetypes × seeds (30 days); single-archetype numbers still recorded in EXPERIMENTS §5 for honesty.

### ADR-011 — Scope cuts (standing) — ACCEPTED (2026-10-02, founder + audit)
**Decision:** PG/rooms/food **cut permanently for now** (founder instruction); Connect feed cut (concept-threads post-pilot); Career deferred 6+ months; K12 deferred 18+; minors excluded at launch; DKT/RL/counterfactual policies out of V1; Mains scoring pilot-only (LLM-as-sensor M2).
**Why:** "don't build four startups inside Techgram" + each cut's business/compliance reality.

### ADR-012 — The living documentation system — ACCEPTED (2026-10-02)
**Decision:** docs are part of the product. Charter (soul, immutable-except-via-register), CURRENT_STATE (snapshot), PROJECT_JOURNAL (append-only memory), EXPERIMENTS_AND_TESTS (evidence ledger), DECISIONS (this register), README (mother index + update protocol), RESUME.json (machine pointer). Protocol in README binds every future session.
**Why:** founder directive — a complete contextual memory any model can reconstruct; the audit culture is the moat's foundation.

### ADR-013 — PROPOSED (next gate): teacher as 12-move state machine over verified atoms — PENDING (2026-10-02)
**Proposal:** implement B7 composer + B8 teacher (moves: DIAGNOSTIC_PROBE … SUMMARISE_CLOSE) with rendering tiers (stored atom → template → fact-locked LLM paraphrase → raw atom) and the doubts cascade.
**Open question for founder:** who verifies atoms (founder/mentor review throughput), and the first atom batch size (recommend 150).

---

## EXTERNAL REVIEW ADJUDICATION — 2026-10-02 (ChatGPT critique of the governance set)

**Decided by:** Founder (directed the review be adjudicated) + GLM-5.3-Flash (Z.ai) via ZCode (adjudicator) · **Code changes: NONE** (founder instruction — all outcomes are spec/doc changes; code work queued for Phase 2).

### ADR-014 — Verdict table on the ChatGPT critique — ACCEPTED (2026-10-02)
Full review read line-by-line; each point adjudicated against the built kernel + governance set:

| # | ChatGPT's point | Verdict | Reason / disposition |
|---|---|---|---|
| 1 | North Star sharpened: "knows what it knows / doesn't know / what evidence reduces uncertainty / what's worth doing despite uncertainty" | **ACCEPT** | Charter/North Star already ~verbatim; wording adopted officially (ADR-019 edits) |
| 2 | "Brain is the product; features are slots" as constitutional law | **ACCEPT (already law)** | Feature Contract, Charter §3.9; ChatGPT independently confirms |
| 3 | Four meanings of "no data"; formula = STRONG PRIOR + ACTIVE SENSING + SMALL EVIDENCE + UNCERTAINTY MODEL + OPTIMIZER | **ACCEPT** | Our structure-as-prior philosophy exactly; formula language added to North Star |
| 4 | Real moat framing = "decision quality per unit of evidence" | **ACCEPT** | Excellent phrase; added to North Star + Goals intelligence benchmark |
| 5 | Missing organ: **Action Outcome Model** | **ACCEPT → ADR-015** | The strongest substantive point. Planner gains currently assumed priors; AOM makes action→outcome prediction an explicit, versioned, never-self-fooling organ |
| 6 | AOM must never fool itself (closed mathematical hallucination); PRIOR→PREDICTION→ACTION→OUTCOME→ERROR→UPDATE loop | **ACCEPT** | Receipts already carry the fields; the runtime loop (prediction recorded before action, error joined after) becomes spec law |
| 7–8 | Planner utility: E[gain] − time − fatigue − instability + VoI + prereq + retention value; downside-risk control | **PARTIAL ACCEPT** | Robust draws + VoI + prereq/retention already in kernel; fatigue cost deferred to B9 landing (spec noted). CVaR option already in arch doc |
| 9–10 | Simulator gate circularity; **four worlds** (friendly / misspecified / adversarial / hidden); G0 = "useful across unseen worlds" | **ACCEPT → ADR-016** | The most technically important criticism. Our lab already has partial World-B (noisy stabilities, ±0.4 logit difficulties, gain jitter, adherence archetypes) and we already documented the caveat honestly — but Worlds C/D don't exist. G0 redefined |
| 11–12 | Graph edge = prior correlation, never evidence; **prior-pressure metric** (evidence vs assumption attribution) | **ACCEPT** | Our EKF already works this way structurally; the attribution metric (posterior vs prior variance + nEff, reported as "evidence strength / prior dependence") added to spec |
| 13 | Evidence Budget: every question carries learning-value + information-value (questions are sensors) | **ACCEPT** | VoI + CAT info gain already implement this; adopted as official language |
| 14 | 20–25 item diagnostic output = bands + known/unknown + sharpen actions, never percentages | **ACCEPT (already law)** | Exactly our diagnostic summary spec |
| 15 | "FSRS-lite" misnomer; it's a **custom DSR-inspired model**; benchmark vs FSRS/SM-2/exponential when data exists | **ACCEPT → ADR-019** | Pedantically correct; honesty rename costs nothing |
| 16 | Knowledge state ≠ retrievability ≠ exam-day probability; the real question is "retrieve & apply under exam conditions on the date" | **ACCEPT (already built)** | pExam + memory-driven time update already do exactly this; noted explicitly |
| 17–18 | Teacher architecture correct; moves are a vocabulary not a cage; Teaching Brief structure | **ACCEPT (already spec)** | B8 brief structure confirmed; "moves are vocabulary" language added |
| 19 | "LLM is a replaceable voice" → "replaceable **interface and optional measurement instrument**" | **ACCEPT → ADR-019** | More accurate; sensor role was always in our design |
| 20–21 | Moat ordering right; on-device kernel is an **architectural advantage, not a moat** | **ACCEPT** | Consistent with our hygiene-vs-moat honesty; M5 reclassified explicitly |
| 22–23 | Explanation Effectiveness Graph = deepest moat; uplift needs causal discipline (randomization, overlap monitoring, doubly-robust, pre-specified estimands, hierarchical effects) — not bare residuals | **ACCEPT** | Adds rigor to M1 design; all post-data, spec'd now |
| 24 | Misconception threshold (P>0.6, n≥2) too aggressive → **candidate / probable / confirmed-for-action tiers** | **ACCEPT → ADR-019** | Fits our epistemics perfectly; B10 not yet built in TS so doc-only |
| 25 | Behaviour engine stays deliberately weak; hypotheses + one low-cost probe; never labels | **ACCEPT (already law)** | Constitution §2.5/§7; reinforced |
| 26 | Cut parent report from V1 | **ACCEPT (narrowed) → ADR-017** | Every surface costs UI/QA/privacy; moved to post-pilot, template-only, opt-in. Revisit at pilot if parent-pay story demands |
| 27 | Roadmap too aggressive for solo | **PARTIAL DENY** | We are *ahead* of the critique's own schedule (its Phases 0–2 ≈ our completed Phase 0+1, done in one sprint). Its dates assume a slower builder. But its underlying principle — gates over dates — was already our law. No date changes; discipline unchanged |
| 28–29 | **V1-A (The Brain, public, no users needed) / V1-B (Student Product)** split; Brain must pass before Product grows | **ACCEPT → ADR-017** | Perfect match with "prove the brain" + enables the 50-hour public release as V1-A |
| 30 | Three timescales (seconds / days / weeks-months) as fundamental | **ACCEPT (already spec)** | Fast/medium/slow loops already in North Star/audit lineage |
| 31 | Intelligence benchmark = 10 measures (prediction quality, calibration, decision quality, information efficiency, robustness, adaptation, explainability, independence, graceful uncertainty, outcome improvement) | **ACCEPT** | Consolidated into Goals as THE intelligence benchmark |
| 32–33 | Brain Lab 8-screen public demo; "one brain, many cherries" visible; truth vs belief vs interval screens | **ACCEPT** | Adopted as the Brain Lab web spec (CLI demo already has 4 of the 8 acts) |
| 34 | Offline nuance: browser storage eviction/quotas; persistent-storage requests, export/backup, sync verification; invariant = "functions offline," not "storage immortal" | **ACCEPT** | Added to architecture degradation section |
| 35 | Notification delivery is network/platform-dependent; core intelligence offline ≠ push offline | **ACCEPT** | Trivial but real conflation; fixed in docs |
| 36 | Minors deferral also a compliance-surface reduction (DPDP 2025 Rules) | **ACCEPT (already decided)** | Confirmed with better legal grounding |
| 37 | Restructured phase plan | **PARTIAL ACCEPT** | Keeps gates; our existing phases retained (we're mid-flight and ahead); V1-A/V1-B overlay adopted instead |
| 38 | Content = "high-information measurement and teaching instrument," not "500 questions"; superb 250 > mediocre 500; per-item fields incl. source, risk level, information value | **ACCEPT** | Item spec extended; 500 stays the target but quality bar is the law |
| 39 | Data model: Decision→Prediction→Action→Outcome→Prediction-error as first-class chain | **ACCEPT** | Already our receipts + events; made explicit as THE learning loop schema |
| 40–41 | Model-truth vs student-truth separation; **BeliefState as THE fundamental object** | **ACCEPT** | μ/Σ already do this; BeliefState composite formalized in spec |
| 44 | Constitution line: "The brain decides. Features render. Events remember. Outcomes teach the brain. LLMs may communicate or measure, but never own the decision." | **ACCEPT** | Adopted into Charter nearly verbatim |
| 45 | "Can you do this?" — yes, as a deterministic, uncertainty-aware, goal-conditioned decision engine useful from the first student; moat emerges by scale stages | **ACCEPT** | Matches our data-volume ladder exactly |
| 46–47 | Per-document verdicts; obsess over the 6 questions (better decision than baseline? explain? survive LLM-unplugged? survive wrong assumptions? learn from wrong? prove improvement?) | **ACCEPT** | Six questions adopted as the standing obsession test in Goals |
| — | Reviewer caveat: could not re-check historical source files (only the synthesis set) | NOTED | Our lineage was checked against sources at Entry 02; no action |

### ADR-015 — NEW MODULE B5.5: Action Outcome Model (AOM) — ACCEPTED (2026-10-02)
**Decided by:** GLM-5.3-Flash (Z.ai) via ZCode, adopting ChatGPT's proposal; founder-directed review.
**Decision:** add **B5.5 — Action Outcome Model** to the architecture between the belief engine and the planner. It answers: *given this student state, concept, action, duration, context — what distribution of outcomes should we expect?* (Δmastery, Δretention, exam-value marks, fatigue, uncertainty-reduction — each with confidence).
- V1 (no data): AOM **is** the versioned prior table (currently `gainPer10Min`) + the never-self-fooling loop: **PRIOR → PREDICTION (recorded in the receipt BEFORE action) → ACTION → OBSERVED OUTCOME → PREDICTION ERROR → MODEL UPDATE (human-gated, versioned)**.
- The planner consumes AOM outputs; it never hardcodes gains again.
- **Closed-loop hallucination ban:** a gain value may never be "validated" by a simulator that assumed the same value; only real outcomes (or explicitly independent worlds per ADR-016) update AOM parameters. The `assumed → measured` badge migration is the AOM's public face.
**Rejected:** building ML outcome models now (no data); leaving gains inside planner params (the critique's correct charge: that makes the planner "a sophisticated heuristic optimizer").
**Code impact (deferred to Phase 2, founder instruction):** extract `gainPer10Min` from planner params into `aom.ts`; populate `actual_outcome` + `prediction_error` in receipts; wire `joinOutcome` into the session loop.

### ADR-016 — G0 redefined: four simulator worlds — ACCEPTED (2026-10-02)
**Decided by:** GLM-5.3-Flash via ZCode, adopting ChatGPT's critique; founder-directed.
**Old G0:** "planner beats baselines in our simulator." **Necessary but insufficient — a simulator built from the planner's own assumptions can crown the planner in a world designed to agree with it.**
**New G0:** *"the planner remains useful — superior or competitive vs baselines — across multiple, partly unseen generative worlds":*
- **World A (Friendly):** truth generated per Techgram assumptions (current lab).
- **World B (Misspecified):** different forgetting dynamics, different gain magnitudes/ordering, heavier response noise, different adherence processes. (Partially exists: noisy stabilities, ±0.4 difficulties, gain jitter, archetypes — to be deepened.)
- **World C (Adversarial):** planner's beliefs sabotaged — an already-mastered concept flagged weak; overreported confidence; noisy response times; gains halved; one prerequisite edge wrong; abrupt availability changes.
- **World D (Hidden benchmark):** frozen world configurations whose parameters the kernel/planner developers never see; run before each release.
**Claim discipline:** public claims cite World D results or real-pilot data only. Worlds A–C are named as friendly/misspecified/adversarial in Brain Lab.
**Code impact (deferred):** extend `lab.ts` with world configs + a frozen `benchmark_worlds.json` (params never committed alongside planner changes... committed once, then sealed).

### ADR-017 — V1 split into V1-A (The Brain, public) and V1-B (The Student Product); parent report deferred — ACCEPTED (2026-10-02)
**Decided by:** GLM-5.3-Flash via ZCode, adopting ChatGPT; founder-directed (aligns with the 50-hour public-ready directive).
- **V1-A "The Brain" (public release, no users needed):** kernel + AOM + simulator worlds + receipts + Brain Lab web demo (8-screen spec: meet synthetic student → initial belief → why-this-question → belief updates before/after → tomorrow's plan + why → what-if syllabus-order comparison → 60-day race vs 4 schedulers with hidden truth → **LLM unplug toggle showing identical decisions** + one-brain/many-cherries view). Passes G0 (four worlds), G1 replay, G2 no-LLM.
- **V1-B "The Student Product":** onboarding → diagnostic → plan → session+teacher → mock+postmortem → forecast → receipts UI, offline-first PWA. **V1-B work may not start before V1-A gates pass.**
- **Parent report: moved OUT of V1** → post-pilot, template-only, opt-in (revisit if pilot shows parent-pay demand).
**Reason:** every extra surface multiplies UI/QA/privacy/testing cost; the founder's stated goal is *prove the brain*; V1-A makes the brain itself the public product — exactly the "features are cherries" philosophy made visible.

### ADR-018 — The Personalization Doctrine: measured behaviour over guessed emotion — ACCEPTED (2026-10-02)
**Decided by:** Founder's directive ("the intelligence layer should understand human patterns, emotions, behaviours better than any LLM; personalization so personal") + GLM-5.3-Flash adjudication.
**The honest reframe:** an LLM *guesses* a student's state from the vibe of one message — instantaneous, uncalibrated, unverifiable, forgotten tomorrow. Techgram **measures**: longitudinal behavioural evidence (response-time distributions, confidence-vs-accuracy calibration, hint ladders, answer-changing, abandonment minute, avoidance patterns, time-of-day adherence, review compliance) + belief probes the student answers in one tap. Over weeks this is a *calibrated, private, receipt-backed model of how this human actually learns* — which is strictly more reliable for personalization than any single-shot emotional read, and it improves with every session while an LLM's guess does not.
**The law (unchanged, now explicit):** we model **observable learning and engagement behaviour**; we do NOT diagnose emotion or mental state; no labels ("avoidant," "anxious") are ever emitted to anyone — internal hypothesis distributions drive *action changes only* (lighter plans, rest, human-referral nudge). This is simultaneously an ethics/compliance wall (minors, DPDP, no clinical claims) and a product advantage: parents and students trust measured facts over psychological guesses.
**Consequence:** B9 Behaviour engine priority is RAISED (it is the personalization engine), with the expanded signal set from the v2 notebook (§7.2) and the probe pattern (§7.4); B9's outputs feed the planner as context features (fatigue cost, session-length adaptation) — the concrete mechanism of "so personal."

### ADR-019 — Terminology and honesty corrections — ACCEPTED (2026-10-02)
1. **Memory model renamed:** "FSRS-lite" → **"Techgram Memory Model (custom, DSR-inspired)"** — it is not literally reduced FSRS; benchmark vs FSRS / SM-2 / simple exponential once review traces exist. Status: `assumed`.
2. **LLM phrase:** "the LLM is a replaceable voice" → **"a replaceable interface and optional measurement instrument"** (sensor role made explicit in the phrase).
3. **M5 reclassified:** on-device kernel = **architectural advantage**, not moat (a competitor can build one; they cannot build our accumulated event/outcome corpus).
4. **Misconception tiers replace the n≥2 threshold:** **Candidate** (n≥1 → investigate) / **Probable** (n≥3 + consistent evidence → targeted probe) / **Confirmed-for-action** (n≥3–4 + sure-wrong + repeated context → CONTRAST remediation).
5. **Uplift (M1) causal discipline added:** randomized exposure + logged propensity + minimum exposure floors + overlap monitoring + doubly-robust or hierarchical estimation + pre-specified estimands — no causal uplift claims from bare residuals.
6. **Charter constitution line adopted:** *"The brain decides. Features render. Events remember. Outcomes teach the brain. LLMs may communicate or measure, but never own the decision."*
