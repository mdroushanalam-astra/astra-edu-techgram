# TECHGRAM — COMPLETE VERSION AUDIT
## Every idea, every version, every contradiction — reconciled into one position

> **Status: FROZEN historical record (2026-10-02).** This audit founded the governance docs; it is not updated. Later decisions live in `DECISIONS.md`; the living state in `CURRENT_STATE.md`.

*Audit date: 2 Oct 2026 · Sources read line-by-line: `original idea of mine of techgram.md` (ChatGPT vision reconstruction), `claude v1 audit.md` (forensic audit), `techgram plan and criticism by claude v2.md` (Notebook, Parts 0–27), `techram execution plan by claude v2.md` (Brain V1 execution plan), `diag_sim_cold_start.py` (cold-start simulation), and the current Python backend (`backend/`, 50/50 tests green).*
*This document is the verdict of record. Where versions disagree, this document states the winner and why. If a future document contradicts this one without a registered reason, this one wins.*

---

## 1. THE VERSION LADDER — WHAT EACH DOCUMENT ACTUALLY IS

| # | Document | Author-context | Role in the lineage | One-line verdict |
|---|---|---|---|---|
| V0 | `original idea of mine of techgram.md` | ChatGPT, reconstructing the full founder vision | **The strategic spine.** Defines the problem (student = integration layer), the identity (Student OS, not tutor), the flywheel, and the prime directive ("don't build four startups") | Right about *what Techgram is* and *what to build first*. Naive about *how* (point estimates, learning styles, personalization inside the LLM). |
| V1 | `claude v1 audit.md` | Claude, transferring the Astra Climate pattern | **The architectural transfer.** Learning Envelope, Intelligence Receipt, 7 verbs, 18 subsystems, LLM constraints, 40-min loop, roadmap | Right about *the pattern*. Wrong or overstated on ~10 technical specifics, later corrected by V2. Its roadmap (66h) is a skeleton estimate, not a plan. |
| V2 | `techgram plan and criticism by claude v2.md` | Claude, full-vision critique + extension (Parts 0–27) | **The intellectual core.** Universal Decision API (slots), Goal Spec, exam-date Planner as the real differentiator, LLM as voice+sensor, brutally re-derived moats, honest cuts, kernel-brutality gates | The best thinking in the lineage. Where V2 contradicts V1, **V2 wins** (it says so itself, and this audit confirms). |
| V2x | `techram execution plan by claude v2.md` | Claude, V1 build execution plan | **The operational truth.** Simulation-proven cold-start limits, exact V1 scope, module specs (B0–B12), TS-kernel decision, 10-week team plan, launch checklist | The build contract. This is what we execute. |
| — | Current Python backend | Built (50/50 tests green) | **The reference prototype.** Proves the loop, the envelope, receipts, event sourcing, test culture in Python | Not the V1 public brain — see §5 reconciliation. Its *invariants* port; its *math* is superseded. |

**The founder's stated lean** — toward the ChatGPT strategic comment and toward Claude V2 — is **confirmed correct by this audit**, with one caveat: V2's brutality must be kept and not softened. The uncomfortable findings (no moat today, little-data limits, content being the bottleneck) are the load-bearing parts.

---

## 2. WHAT EACH VERSION GOT RIGHT (KEEP — THESE ARE LAW NOW)

### From V0 (ChatGPT vision) — the strategy
1. **"The student is the integration layer"** — fragmentation, not content scarcity, is the pain. Correct problem statement.
2. **"The AI tutor is a feature; the student intelligence system is the product."** The single best sentence in the entire lineage.
3. **"Do not build four separate startups inside Techgram."** Everything plugs into one core. (Now enforced mechanically by the Feature Contract, §Architecture.)
4. **The model layer is replaceable.** Intelligence lives in orchestration + student state, not in any LLM.
5. **V0 loop first:** onboarding → goal → diagnostic → profile → session → assessment → progress → next session. This is exactly what the current prototype implements and what V1 keeps.
6. **"Your moat is a hypothesis, not an established moat yet."** Keep saying this.
7. **The flywheel:** more interaction → more data → better model → better personalization. True — but it starts only at deployment (V2's correction).

### From V1 (Claude audit) — the pattern
1. **The Astra transfer table** (envelope↔envelope, Place State↔Student State, Evidence Bundle↔Intelligence Receipt, LLM-optional↔LLM-optional). Structurally sound; survives intact.
2. **The Learning Envelope as machine contract** — constructor-validated provenance on every fact. Implemented in the prototype; ports to V1 with the no-upgrade invariant added.
3. **The Intelligence Receipt** — every decision auditable, with predictions and later actual outcomes. Survives.
4. **LLM independence acid test** — full suite green with `LLM_API_KEY` unset. Survives as gate G2.
5. **Belief state over point estimates** — "3 missed sessions" → hypothesis distribution, not the label `lazy`. Survives.
6. **Safety hierarchy on every action** + banned-vocabulary discipline. Survives.
7. **Measure real things, not vanity metrics** (calibration error, delayed retention — not DAU, time-on-app). Survives.

### From V2 (Notebook) — the corrections and the deep ideas
1. **Design law refined:** LLM as **voice + sensor + offline author**, never brain. This preserves the founder's "no LLM dependence" goal *and* is honest about Mains scoring, doubts, and content drafting. LDI targets: 0% of decisions touched by LLM (CI-enforced), <5% of served tokens, >95% zero-LLM sessions.
2. **The Planner is the real differentiator** — exam-date-conditioned expected-score optimization (marginal gain per minute over the syllabus), not generic "mastery." Nobody has this for Indian competitive exams.
3. **Universal Decision API:** every feature is a **slot** calling `decide()`. This is the mechanism that makes "every feature is a cherry on top" literally true.
4. **Goal Spec:** the kernel is goal-conditioned; UPSC/JEE/K12/Career are *config*, not code. This is how the long-term vision (K12 globally) happens without a rewrite.
5. **Moat honesty:** Envelope, Receipts, LLM-independence are **hygiene, not moats**. Real moats: the Explanation Effectiveness Graph (M1), misconception ontology (M2), outcome labels (M3), PYQ weights (M4), on-device kernel (M5), calibrated memory parameters (M7), cohort priors (M8), distribution/trust (M9). *"Today, Techgram has a good thesis and no moat."*
6. **Research grounding table:** drop learning-styles matching (Pashler 2008), don't trust chronotype claims, don't measure "aptitude" from quizzes, don't promise 2-sigma. FSM: FSRS over SM-2; Elo/Beta over BKT-as-primary.
7. **Three feedback loops** (fast: within-session; medium: daily; slow: weeks/months parameter re-fitting). The slow loop is where the moat compounds.
8. **Kernel brutality:** simulator-first, replay determinism, property tests, chaos game-days, shadow mode, acceptance gates G0–G6.
9. **Phase 0 with humans before heavy code** (recruiting, Wizard-of-Oz), content = the real bottleneck, "free tier = prototype only."

### From V2x (Execution plan) — the physics of "little data"
This document's simulation (`diag_sim_cold_start.py`) is the most important *empirical* artifact in the lineage. Its findings are binding design law:

1. **Binary MCQ answers carry very little information** (Fisher information ≈ 0.15/item at best). Physics, not a bug.
2. **Structure (graph + hierarchical priors) roughly halves error on the student's overall level** (0.088 → 0.070 at 25 items in the strong-structure world; 0.068 → 0.028 at 350 items) — **but barely helps weak-topic discovery** (recall 0.28 vs 0.28 at 25 items; 0.51 vs 0.47 at 350). Weak-topic lists must be labelled "tentative" until evidence accumulates.
3. **A 25-question diagnostic gives a level band, not a syllabus map.** Anyone showing a crisp "54% in Geography" after 25 questions is faking precision.
4. **The filter is mildly overconfident when structure assumptions are wrong** → inflate reported variance ×1.2–1.25, monitor coverage.
5. Therefore: **V1 wins on calibrated honesty, information efficiency (CAT + confidence/RT/hint channels), model-based reasoning, and auditability — not on "uncanny accuracy from nothing."**
6. **"Perfect" is not the target. Correct, calibrated, auditable, graceful, improving — is.**

---

## 3. THE CONTRADICTION MATRIX — RESOLVED

Every substantive disagreement between versions, with the ruling:

| # | Topic | V1 said | V2/V2x said | **Ruling** | Why |
|---|---|---|---|---|---|
| 1 | Memory model | SM-2 core | FSRS-style DSR | **V2.** FSRS-lite with priors by concept type; SM-2 kept only as fallback. Empirically beats SM-2; feeds the belief engine's time update so forgetting and mastery are one coherent state. |
| 2 | Primary knowledge estimator | BKT | Elo/1PL online + Beta posterior; graph-prior Kalman (μ, Σ) as the state | **V2.** BKT has identifiability issues and needs per-skill data we don't have. Kalman + structure is what makes little-data inference work at all. BKT-with-forgetting survives as a third opinion. |
| 3 | Item difficulty | IRT 2PL from day 1 | Expert priors (1–5 → logit), Elo refinement ≥30 responses/item, 2PL only ≥200–300 | **V2.** 2PL parameters from small samples are noise. |
| 4 | Experiments | Per-student A/B, 5 sessions, p-values | Hierarchical Bayes, within-student randomization, posterior probabilities | **V2.** 5-session p-values are statistically meaningless. |
| 5 | LLM role | "LLM = voice only" | "Voice + sensor (calibrated rubric) + offline author" | **V2.** Matches founder intent: the brain has *zero* LLM dependence; language measurement is an instrument, never a decider. |
| 6 | Infra cost | "$0 total" | "Prototype-only; budget small real costs for beta" | **V2.** Free tiers change and have no SLA. |
| 7 | Timeline | 66 hours / 100 sessions | Skeleton in weeks; good in months; proven outcomes 9–18 months | **V2.** The binding constraint is content + users + iteration, not code. |
| 8 | Uniqueness | "Nobody has done this composition" | Honest ranking: Carnegie/ALEKS/Duolingo/Squirrel AI compose too; the *unseen* parts are the exam-date planner, receipts-for-students, LLM-as-instrument | **V2.** Overclaiming kills credibility exactly where credibility is the product. |
| 9 | Moat today | Envelope, receipts, LLM-independence = day-1 moats | Those are hygiene; **no moat today**; moats are the compounding data assets | **V2.** See §6. |
| 10 | Roadmap scope | Career engine in Phase 2, Connect month 3, K12 month 10 | Cut/defer: threads after pilot, career 6+ months, K12 18+, Life cut | **V2** + founder instruction (PG/hostel completely out). |
| 11 | "Learning styles", "strong morning performance", "aptitude" | (V0 vision features) | Drop styles (not supported); test time-of-day per student; no aptitude claims | **V2.** Building on Pashler-refuted ideas is building on sand. |
| 12 | Language/runtime | Python/FastAPI (implicit) | **TypeScript kernel shared client/server; Python = lab only** | **V2x, adopted.** On-device/offline is moat M5 and is the hardest thing to retrofit. Current Python backend is repurposed (§5). |
| 13 | Diagnostic promise | "Diagnostic assessment" → profile | "Level band with honest wide bands + sharpen actions; entry ticket, not verdict" | **V2x.** The simulation is dispositive. |
| 14 | 40-min sessions | Dogma | Default parameter; 25/40/55 tested per student | **V2.** Length is a hypothesis, not identity. |

---

## 4. THE ORIGINAL VISION — WHAT SURVIVES INTO V1, WHAT'S CUT

| Original vision element | Status in V1 | Where it goes |
|---|---|---|
| Student Intelligence Model (continuous, evolving) | **KEEPS — as Student State + belief engine** (with intervals, not point estimates) | B2, B5 |
| AI Super Teacher | **KEEPS — as scripted Teacher state machine** over verified atoms; LLM = optional paraphrase/doubts | B8 |
| 40-minute sessions | **KEEPS — as default parameter** of the session composer | B7 |
| Learning loop (PLAN→TEACH→…→ADAPT) | **KEEPS — as the three-loop closed cycle** (fast/medium/slow) | Whole kernel |
| Connect Realm (feed) | **CUT for V1** (second startup; cold-start + moderation) | Concept-attached threads AFTER pilot, ranked by learning value, reputation = reader outcomes |
| Career Realm | **DEFERRED 6+ months** (needs assessed skills first). Later = same planner, different GoalSpec | Goal Spec mechanism |
| Student Life (PG/rooms/food) | **CUT — permanently for now** (founder instruction + different business: supply, logistics, disputes) | Partner/affiliate only, 12+ months |
| Parent intelligence | **KEEPS in V1 — minimal, template-based**, adult students opt-in sharing; facts+intervals only, no labels, no diagnosis | PARENT_REPORT_SECTION slot |
| K12 globally | **DEFERRED 18+ months** (compliance, pedagogy, licensing) | Enabled later by Goal Spec + exam-agnostic kernel |
| Knowledge layer (books/notes/curriculum) | **KEEPS — as content compiler + verified atoms + PYQ weights** | B0 |
| "Defensibility from student intelligence + data, not a giant LLM" | **KEEPS — sharpened**: defensibility = decision engine now + outcome data later | §6 |

---

## 5. CURRENT PYTHON PROTOTYPE ↔ V1 SPEC — FULL RECONCILIATION

The existing `backend/` (FastAPI, ~5.6k lines, 50/50 tests green, SQLite, event sourcing, receipts, auth) is a **successful prototype of the V1-audit design**. Under the V2x decision (TS kernel), it is repurposed, not discarded:

| Existing module | Verdict | Fate |
|---|---|---|
| `epistemics.py` LearningEnvelope (7 validation rules) | **PORT** | To TS kernel envelope + add **no-upgrade invariant** (derived type ≤ strongest input type). The Python version becomes the lab/reference oracle. |
| `student_state.py` 5+2-dim LearningStateVector, discrepancies, probe flags | **PORT (concept)** | Recast as the belief engine's per-concept (μ, Σ) + memory state; the 5 cognitive dimensions survive as *item/dimension tags* feeding different observation channels, not as 5 separate scalar trackers. |
| `engines/assessment.py` IRT 3PL | **SUPERSEDED for runtime** | Expert-prior difficulty + Elo refinement at runtime; 3PL/2PL fitting moves to the **Python lab** (post-data, per-item ≥200–300 responses). |
| `engines/knowledge_tracing.py` BKT | **DEMOTED to third opinion** | Kalman belief engine is primary; Elo is second; BKT-with-forgetting optional cross-check. The disagreement-flag idea survives (it was the prototype's best instinct). |
| `engines/retention.py` SM-2 + Ebbinghaus | **SUPERSEDED** | FSRS-lite (B3). Keep SM-2 in the lab as a baseline comparator. |
| `engines/reconciliation.py` (preserve disagreement, never average) | **PORT (principle)** | The principle becomes: Elo-vs-filter disagreement → widen bands, raise information value, schedule diagnostic probe. This was right. |
| `engines/scheduler.py` (priority weights, probe/bottleneck rerouting) | **SUPERSEDED** | By the exam-date-aware Planner (B6) with marginal-gain-per-minute + VoI + robustness over posterior draws. The bottleneck-rerouting idea survives inside planner constraints. |
| `knowledge_graph.py` UPSC DAG + bottleneck diagnosis | **PORT + EXPAND** | Becomes B0's Polity graph (35 topics / 150 concepts, prereq + confusability edges). |
| `question_bank.py` (calibration provenance) | **PORT + EXPAND** | To ~500 verified items with distractor→misconception tags, expert difficulty, expected time. |
| `evidence.py` IntelligenceReceipt | **PORT + ENRICH** | Add: alternatives with scores, assumptions tagged assumed/measured, unknowns, what-would-change-my-mind, params_version, propensity. |
| `events.py` + `db/repository.py` event sourcing, snapshots, replay | **PORT** | Idempotency keys, schema_version, out-of-order tolerance added. This is the strongest part of the prototype. |
| `service.py` / `main.py` / `auth.py` | **REFERENCE** | Becomes the spec for the Node sync/verify API. The replay bug + hardcoded subject inference + missing JWT enforcement get fixed in the port, not inherited. |
| `session_engine.py` + `super_teacher.py` (TeachingBrief, deterministic fallback) | **PORT (concept)** | Becomes B7 composer + B8 teacher rule table. The "deterministic fallback opening" instinct = V2's Tier T2 template rendering. Done better. |
| Test suite (50 tests incl. adversarial + stress + no-LLM) | **PORT as contracts** | Every invariant becomes a TS test; the no-LLM drill becomes gate G2; add replay-determinism, no-upgrade, and simulator-regression tests. |

**Net:** nothing is wasted. The prototype's *discipline* (envelope, events, receipts, no-LLM, tests-as-law) is the porting contract; its *math* is superseded by the V2x spec; its *stack* splits — TS for the runtime kernel, Python for the lab (simulation, calibration, fitting) where the prototype's numeric code seeds the lab.

---

## 6. THE MOAT TRUTH (THE BRUTAL PART — KEEP THIS UNSOFTENED)

**Today Techgram has: a good thesis, a working prototype, a simulation-backed design — and no moat.** That is the correct starting belief. The moat strategy under the no-data/no-money constraint is therefore a *sequence*, not a claim:

**Layer 1 — Day-1 differentiation (data-light, buildable now):**
- Exam-date-conditioned planner with receipts ("gain per minute to your exam")
- Information-efficient diagnostic with honest bands
- Mock post-mortem + negative-marking attempt coach (pure arithmetic on the student's own mock — the most immediately valuable data-light feature in the plan)
- Forgetting forecast ("these 14 high-weight topics fall below 60% recall by exam day unless reviewed")
- Fully offline-capable, zero-LLM-decision architecture
These win *demonstrations* and *trust*. They are copyable in months — they buy time and credibility, not safety.

**Layer 2 — The compounding moats (start accruing from the FIRST user, because day-1 instrumentation plants them):**
- **M1 Explanation Effectiveness Graph** — atom variant × student cluster → measured durable uplift (needs randomization + delayed checks, both designed in from day 1)
- **M2 Misconception ontology** — distractor-tagged error taxonomy, grows from every wrong answer
- **M3 Outcome-label flywheel** — real exam results joined to learning traces (consent captured at onboarding)
- **M4 PYQ weight + trap-pattern knowledge base** — curated now, domain-specific, labor-intensive to copy
- **M5 On-device kernel** — offline, private, cheap; architectural, hard to retrofit
- **M7/M8** — calibrated per-student memory parameters; cohort priors for cold start

**Layer 3 — The trust moat:** calibration curves published, receipts user-visible, claims policy honored. In education, *earned trust is the distribution*.

**Not moats (never say these):** "AI", the envelope, receipts per se, LLM-independence per se, the 40-min format, content volume, the word platform.

---

## 7. CAN WE MAKE THE CORE "SO STRONG IT NEEDS NO DATA"? — THE HONEST ANSWER

**The literal claim is impossible and we stop making it.** Binary answers are low-information; no architecture extracts a reliable syllabus map from nothing — the founder's own simulation proves this. A brain that *pretends* otherwise is fake-precision, and fake precision is the one thing this architecture refuses to sell.

**The achievable claim, which is stronger in the market because it is provable:**

> V1's brain is **correct, calibrated, auditable, graceful, and improving** — it wins on *decision quality per byte of evidence*: structure-as-prior (curriculum graph, PYQ weights, learning-science gain priors, memory priors), information-efficient sensing (CAT, confidence/RT/hint channels, imported scorecards), honest uncertainty everywhere, plans that are robust to its own uncertainty, and a receipt for every decision. It demonstrably beats baseline schedules on simulated exam outcomes (gate G0), runs 100% of decisions with zero LLM (G2), replays deterministically (G1), works offline, and improves from its very first user because the moat sensors (uplift, misconception, outcome consent) are wired from day 1.

**That is the product demo.** A system that says *"here is what I know, here is how sure I am, here is the cheapest way to learn more, here is the best plan even given my uncertainty — and here is the receipt"* is *more* impressive to a serious user, parent, or investor than a fake-precise dashboard. The Brain Lab (simulated students, visible ground truth, LLM on/off toggle) lets us prove the machinery publicly **without needing user data first** — this is the exact trick Astra used (live-verified endpoints + 135 no-LLM tests as proof of discipline), replicated for a system whose "reality" is a learner.

**Conditions (all binding):**
1. The content bottleneck is funded with real hours: ~500 verified Polity items, ~150 concepts, ~150 atoms, PYQ weights. Without this the kernel has nothing to reason over. This is the true critical path — budget it like engineering.
2. Kernel language decision executed now (TS), because on-device is the hardest retrofit.
3. Feature Contract enforced: no feature ships without (a) typed events, (b) decisions from `decide()`, (c) deterministic fallback, (d) receipts, (e) declared outcome metric.
4. Claims policy honored in public copy (see Goals doc).
5. The slow loop (parameter re-fitting, calibration) actually runs after the pilot — otherwise the moat seeds never sprout.

---

## 8. FINAL POSITION STATEMENT

> **Techgram is a decision engine for learning with slots, not a chatbot with features.** The V0 vision supplies the strategy (one core, everything plugs in), V1 supplies the pattern (envelope, receipts, LLM-independence), V2 supplies the intellect (planner, slots, honesty), and V2x supplies the physics (what little data can and cannot do). The current prototype supplies the discipline and the test contracts. V1 public = the Polity-slice of this machine: simulator-proven, receipted, offline-capable, LLM-optional — demonstrated publicly via Brain Lab and 20–30 real aspirants — with every moat sensor wired from the first minute of the first user's first session.

*End of audit. The build contract follows in `04_ARCHITECTURE.md`; the sequence in `05_ROADMAP.md`.*
