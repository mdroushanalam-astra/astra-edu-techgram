# TECHGRAM — GOALS
## Long-term goals, the V1 public-release bar, and the constraints register. Every goal here is measurable or it doesn't belong in the document.

---

## 1. LONG-TERM GOALS (12–36 months)

| # | Goal | Definition of done | Why it matters |
|---|---|---|---|
| G-L1 | **Prove the loop on real students** | A cohort of 20–30 UPSC aspirants uses the system for 3+ weeks; week-3 retention ≥40%; qualitative "this told me something I didn't know" reported unprompted by multiple users | The thesis (plan + receipts + honest bands → return behaviour) is falsifiable and tested |
| G-L2 | **Prove calibration** | Reliability curves within a pre-agreed band after N≥500 predictions per predictor; published internally | Predictions that mean what they say — the trust asset |
| G-L3 | **Prove learning value** | Delayed (72h) retention under Techgram's schedule ≥ a control schedule in a randomized pilot (gate G5) | The difference between "clever" and "works" |
| G-L4 | **Plant the compounding moats** | Outcome-label consent from day 1; first mock→real calibration after the exam cycle; first atom-variant uplift estimates with intervals; misconception ontology growing from real wrong answers | The moat sequence starts accruing, not "later" |
| G-L5 | **Exam-agnostic kernel** | A second goal (JEE OR a career competency goal) ships as **GoalSpec config only** — zero kernel code changes | The long-term vision (K12, careers) is structurally cheap, not a rewrite |
| G-L6 | **Kernel is provably brutal** | Gates G0–G4 permanently green in CI; chaos game-day each quarter; LDI-decisions = 0% forever | The intelligence layer never regresses into a wrapper |

---

## 2. THE V1 PUBLIC RELEASE — GOAL AND DEFINITION OF DONE

**Goal statement:**

> Ship the first public version of the Techgram brain — **UPSC Prelims GS, Polity first** — that demonstrates the full closed loop **with no LLM and no network**, on real content, with every decision receipted, proven against a simulator with known ground truth, and instrumented so the first real user starts compounding the moat from their first session.

**V1 scope (IN):** onboarding + scorecard import · adaptive CAT diagnostic · belief engine · memory engine · exam model + Monte-Carlo scenarios · robust exam-date planner · 40-min session composer · scripted Teacher (atoms + templates) · behaviour rules + belief probes · diagnosis + misconception engine · mock post-mortem + attempt-policy coach · receipts + uncertainty UX · notifications (≤1/day policy) · forgetting forecast · offline-first PWA · **Brain Lab public demo** · LLM cherry (M0–M2).

**V1 scope (OUT — permanently for now, per founder instruction + audit):** open social feed · Career engine · **Student Life / PG / hostel / food (cut)** · K12 · parent accounts for minors · **parent/progress-share report (moved OUT of V1 → post-pilot, template-only, opt-in [ADR-017, 2026-10-02])** · DKT/RL/bandit policies in production · counterfactual policy simulator · Mains scoring in production (pilot-only, M2) · multi-exam content.

**STATUS [2026-10-02, external review §14]: the V1-A INTELLIGENCE-KERNEL GATE is substantially complete — we are on the public-release RUNWAY. Public V1-A ships only when the Brain Lab web page and the content-release floor are satisfied.**

**V1 is now two internal releases [ADR-017, 2026-10-02]:** **V1-A "The Brain"** (kernel + Action Outcome Model + four simulator worlds + receipts + the public 8-screen Brain Lab web demo; no users needed; must pass G0/G1/G2) and **V1-B "The Student Product"** (onboarding → diagnostic → plan → session+teacher → mock+postmortem → forecast → receipts UI, offline-first PWA). **V1-B work may not begin before V1-A's gates pass.**

### THE INTELLIGENCE BENCHMARK [ADOPTED 2026-10-02, external review point 31]
"Super intelligent" is measured by exactly ten things, not by model count, LLM size, or feature count: (1) prediction quality; (2) calibration (says-70%-happens-~70%); (3) decision quality vs sensible alternatives; (4) **information efficiency — learns more about the student from fewer interactions (our signature: decision quality per unit of evidence)**; (5) robustness when assumptions are wrong; (6) adaptation when reality disagrees; (7) explainability; (8) LLM independence; (9) graceful uncertainty; (10) eventual real outcome improvement.

### THE STANDING OBSESSION TEST [ADOPTED 2026-10-02; external reviews §47 + Insight 12]
The original eight questions remain the product's north test — **Who is this student? Where are they going? Where are they now? What is stopping them? What should happen next? Did it work? What changed? What should we do now?** — the brain answers most in simulation; "What is stopping them?" and "Did it work?" are the two real students will test.

Additionally, per ADR-023's Observable-State Law, all personalisation claims use the bounded formulation: *an increasingly detailed, explicitly uncertain model of the student's observable learning state and behaviour, used to choose better learning actions.*

[ORIGINAL TEXT BELOW]
### THE STANDING OBSESSION TEST [ADOPTED 2026-10-02, external review point 47]
Before any new feature or realm is ever discussed, Techgram must keep answering YES to six questions: Can it make a genuinely better next-step decision than a sensible human baseline, from goal + time + graph + ~20 questions + a few behavioural signals? · Can it explain why? · Does it survive the LLM unplugged? · Does it survive its assumptions being wrong? · Does it learn from being wrong? · Can it prove it is getting better? If yes — Teacher, Mock, Forecast, Notifications, Connect, Career are all cherries.

### Definition of done — the V1 intelligence bar (all must be TRUE at launch)

| # | The bar | Measured by |
|---|---|---|
| 1 | **Planner remains useful across MULTIPLE simulator worlds** — superior or competitive vs baselines (fixed order, random, weakest-first) in the **friendly** world (per Techgram assumptions, ≥4 archetypes) AND the **misspecified** world (different forgetting/gains/noise) AND **adversarial** scenarios (sabotaged beliefs, halved gains, wrong prereq edge), with a frozen **hidden-benchmark** world run before releases. Public claims cite hidden-world or real-pilot results only | Gate **G0 [REDEFINED 2026-10-02, ADR-016]** — a simulator built from the planner's own assumptions cannot be the proof |
| 2 | **100% deterministic replay** — any state/decision reproducible from `events + params_version + seed`; golden-replay suite green after every refactor | Gate **G1** |
| 3 | **100% of decisions LLM-free** — full test suite green with the LLM key unset and its host firewalled; import-graph test proves engines can't see the LLM | Gate **G2** |
| 4 | **Zero-LLM session rate >95%** measured in pilot; LDI-tokens <5% | Runtime metric |
| 5 | **Estimator recovers hidden truth in simulation** — level error, topic RMSE, 80% interval coverage ≈ 0.75–0.85 (with ×1.2 inflation), weak-topic recall ≥ simulation baseline at each checkpoint | Simulator regression tests in CI |
| 6 | **Every decision has a complete receipt** (inputs with intervals, expected effect, alternatives, assumptions tagged `assumed`/`measured`, unknowns, what-would-change-my-mind, params_version) | Property test: receipt completeness |
| 7 | **Works offline end-to-end** — onboarding through session completion with network off; sync reconciles by server-side recompute | Tamper + replay test |
| 8 | **Mock post-mortem matches hand-labelled error classes** on a test set (knowledge gap / trap / careless / time pressure / bad guess / over-skip / unclassified shown as unclassified) | Labelled test-set agreement |
| 9 | **Content floor met** — ~35 topics, ~150 concepts, ~500 verified items, ~150 atoms, PYQ weight table, misconception ontology v0, 2 sectional mocks never reused in diagnostics | Content inventory audit |
| 10 | **Chaos suite green** — kill LLM/vector/queue/network, duplicate/out-of-order/malformed events, clock skew: no crash, no state corruption, clean recovery | Chaos game-day |

**Claims you may make at launch:** "Explains every recommendation" · "Shows uncertainty instead of faking precision" · "Works offline" · "Plans around your exam date" · "Marks-loss breakdown from your mock" · "Learns your forgetting over time (after enough reviews)".

**Claims you may NOT make (yet):** "Guaranteed rank/selection" · bare "X% chance to clear" · "Proven to improve results" (until G5) · "Diagnoses learning issues" · "Knows your exact weak topics" in week 1 · any accuracy number without its calibration curve.

---

## 3. THE CONSTRAINTS REGISTER — AND HOW THE ARCHITECTURE ANSWERS EACH

| Constraint | Honest implication | Architectural answer |
|---|---|---|
| **No dataset** | Cannot train anything; item parameters and gain models start as *assumed* priors | Structure-as-prior (graph, PYQ weights, learning-science tables); wide intervals; day-1 instrumentation so real data replaces priors in the slow loop; cohort priors later (M8) |
| **No money** | No paid infra, no content team, no marketing | TS kernel on-device = near-zero compute cost; server = sync + verify + nightly jobs only; content authored with LLM drafts + founder/mentor human verification; distribution = Brain Lab demo + receipts as shareable proof, pilot recruited directly |
| **Small team (solo + AI assist)** | Cannot build 18 subsystems at once | Slots + Feature Contract mean features are config; the 100-session roadmap is re-sequenced solo (see Roadmap: 16–20 weeks); explicit cut list enforced |
| **No LLM dependence (founder hard requirement)** | The brain must be pure math | Design law + G2 + LDI-decisions = 0%; LLM exists only as optional rendering/sensing behind a circuit breaker |
| **Content correctness risk** | One wrong constitutional fact erodes trust | Verified atoms with provenance + risk-weighted human review + wrong-fact report flow that pauses serving |
| **Cold start per student** | New student = wide bands, nothing personal | Diagnostic CAT + scorecard import + population-default memory priors — honest "unknown-ish" grey until evidence |

---

## 4. KILL / CONTINUE CRITERIA (pre-registered — written BEFORE the pilot, not after)

**Continue to scale if, after the 3+ week pilot:**
- ≥40% of pilot users active in week 3 (G3);
- ≥5 unprompted qualitative "told me something I didn't know" reports;
- ≥95% zero-LLM sessions held in production;
- no critical content-correctness incidents (wrong-fact reports per 1,000 atoms served below threshold);
- calibration curve exists and is within the pre-agreed band (G4, even if wide).

**Kill or re-scope if:**
- week-3 retention <20% **and** users do not cite the plan/receipts/forecast as the reason they'd stay — the thesis (not just execution) is wrong;
- post-mortem or plan quality repeatedly rated below "a good coaching schedule" — the intelligence bar isn't met, stop shipping surfaces and deepen the kernel;
- content verification throughput cannot sustain ~500 verified items without burning out the reviewer — re-scope to 2 topics max.

**Intermediate kill-switch during build (any phase):** if a gate (G0/G1/G2) fails after two honest attempts, stop adding features and fix the kernel. Features never outrun the brain.

---

## 4.5 THE UNCERTAINTY REGISTER [adopted 2026-10-02, external review §26 — the honest state of the company]
| Bucket | Level | Meaning |
|---|---|---|
| Engineering | 🟢 low-medium | Core architecture credible: 174 tests + chaos injection + live probes, Brain Freeze v0.1 signed after a defect-finding Gate-0 audit [ADR-031] |
| Product | 🟡 HIGH | Will students find the loop useful enough to return? Unknown until the pilot |
| Scientific / learning-effect | 🔴 VERY HIGH | Does the AOM predict real interventions? Does durable learning improve? Needs delayed outcomes from real students |

## 4.6 LIMITED PUBLIC BETA + CAPABILITY GAIN [ADR-028, 2026-10-02]
The private-pilot phase is replaced by a **limited public beta** (invited cohort, Classes 6–10 + UPSC): same measurement list, earlier public contact. The beta tests the hypothesis per student — believed → decided → why → did → evidence → updated → predicted → happened → was the next decision better — and separately: did they learn, retain, transfer, feel understood, did personalization/curiosity/goal-connections help, did they become more independent?

**New metric — Capability Gain:** CG_c = P(independent successful performance after) − P(before), aggregated over a Capability Graph (goal → capabilities → concepts). We say \"Riya independently demonstrated 8 capabilities she could not at baseline\" — never \"14 hours spent\".

## 5. WHAT SUCCESS LOOKS LIKE 90 DAYS AFTER LAUNCH (from the audit's standard)

1. Kernel passing simulator, replay, and no-LLM drills continuously.
2. 20–30 real users with 3+ weeks of event logs.
3. First calibration curves (noisy is fine; existing is the point).
4. First atom-variant uplift estimates with honest error bars.
5. A mock→real outcome-label collection mechanism running.
6. A "why this?" demo that no wrapper can fake — recorded, public, reproducible.

*Goals set. The machine that meets them: `04_ARCHITECTURE.md`. The sequence and dates: `05_ROADMAP.md`.*
