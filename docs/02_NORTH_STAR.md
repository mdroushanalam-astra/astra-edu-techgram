# TECHGRAM — NORTH STAR
## The identity, the long-term star, and the doctrine. Read this before writing any code or any copy.

> **Soul-level vision, philosophy and commitments live in `00_CHARTER.md`** — that document outranks this one. Changes to either go through `DECISIONS.md`. Living status: `CURRENT_STATE.md`.

---

## 1. THE ONE-SENTENCE IDENTITY

> **Techgram is a decision engine for a student's education: it knows — with calibrated uncertainty — what each student knows, what they are forgetting, how they behave, and what single next action maximises their expected exam outcome; it proves why with a receipt; and it learns from every outcome. The LLM is a replaceable interface and optional measurement instrument [ADR-019]. Every feature is a slot that asks the brain what to do.**

**Sharpened star [2026-10-02, external review]:** the brain is not "a brain that knows everything" — it is *a brain that knows what it knows, knows what it does not know, knows what evidence would reduce that uncertainty, and knows what action is worth taking despite uncertainty.* The real moat framing: **decision quality per unit of evidence** — from 20 answers, System B (honest bands + unknowns + chosen-next-questions-with-reasons) is more intelligent than System A (fake-precise percentages). That is Techgram. The working formula is **STRONG PRIOR + ACTIVE SENSING + SMALL EVIDENCE + UNCERTAINTY MODEL + DECISION OPTIMIZER → USEFUL DECISION** — never "no data → magical intelligence."

Brand line: **"the learning intelligence system."** Never "metaverse." Never "AI tutor" as the identity — the tutor is a feature.

---

## 2. THE LONG-TERM NORTH STAR (the 10-year star)

> **For every student, at every moment: know what they know, what they're forgetting, and how they behave — with calibrated, interval-bearing honesty; choose the next action that maximises their expected outcome against their goal's deadline; show the work; and convert every outcome into better decisions for the next student.**

By that star, the end-state company is:

1. **A goal-conditioned intelligence kernel** — one brain, any `GoalSpec` (UPSC → JEE/NEET → K12 → career competencies). Exams and careers are *config* (a graph + weights + payoff), never new code.
2. **A Pedagogical Knowledge Graph** — the table nobody else has: *which explanation, to which kind of student, for which misconception, produces durable learning* (Explanation Effectiveness Graph × Misconception Ontology).
3. **An outcome-grounded trust moat** — mock→real score calibration, proven intervention effects, published calibration curves. In education, earned trust *is* distribution.
4. **A compounding data asset** — Student×Action→Outcome, accruing one verified receipt at a time, impossible to buy or scrape.

The four realms of the original vision (Learn / Connect / Career / Life) all remain, but they are **slots over this kernel** — and they arrive in the order the kernel can power them, not the order ambition lists them.

---

## 3. HOW WE SEE TECHGRAM NOW (the reframe, post-audit)

1. **A decision engine with slots — not a chatbot with features.** Every surface (session UI, mocks, notifications, threads, parent report, and later career/connect) asks the kernel one question: *"what is the best thing to put here for this student right now, and why?"* and renders the answer. Features are config and rendering; intelligence is written once.
2. **The brain is the product; the Super Teacher is the mouth.** The kernel decides what/how/how hard/how long/why-now. The teacher layer only *words* it.
3. **Honesty is the product's signature.** Bands, not points. Grey for unknown. `assumed` vs `measured` badges. "Tentative" labels until evidence. Receipts on request. This is not a limitation we apologize for — it is the differentiation, because every competitor fakes precision.
4. **Little data is the design input, not the excuse.** Structure (curriculum graph, PYQ weights, learning-science priors, memory priors) substitutes for data; information-efficient sensing (CAT, confidence/RT/hint channels, imported scorecards) squeezes more signal per interaction; robust planning is correct *even under wide uncertainty*.
5. **The moat is a sequence, not a day-1 claim.** Day-1: decision quality + trust. From first user: uplift, misconception, outcome, and memory sensors start compounding. The founder's constraint (no money, no dataset) is answered by *architecture*: instrument everything from minute one so the first cohort plants the moats.
6. **LLM independence is structural, not rhetorical.** 0% of decisions touch an LLM (CI-enforced); >95% of sessions need zero LLM calls; the product is fully usable with the LLM and the network off (T4 offline). The LLM is a *cherry* — modes M0–M3, all optional, all fallback-protected.

---

## 4. REPLICATING — AND EXCEEDING — THE ASTRA CLIMATE PATTERN

The founder's question: *"can we replicate the Astra Climate thing — every feature a cherry on top — 1000× better, faster, stronger?"* **Yes. Here is the exact transfer, and where Techgram goes further:**

| Astra Climate (proven pattern) | Techgram V1 (the transfer) | Where Techgram goes **further** |
|---|---|---|
| Reality = the planet | Reality = the learner | Learners change; we model uncertainty more aggressively (belief distributions, not point states) |
| Epistemic Envelope (machine-validated provenance) | Learning Envelope (validated, with temporal decay + no-upgrade invariant) | Envelope becomes **user-visible value** (bands, "what would sharpen this") — Astra's envelope was internal |
| Place State = composition, never recompute | Student State = projection of the event log | State is **rebuildable from events** on-device and server-side (tamper-proof, offline) |
| 22 external data providers | Sensing channels: items, confidence, response time, hints, mocks, imported scorecards | **Active sensing**: CAT info-gain item selection — we choose observations for maximum information, Astra only received them |
| Deterministic frozen engines (smoke/heat/flood) | Deterministic kernel: belief, memory, exam model, planner, teacher policy, diagnosis | **The planner optimizes against a deadline** (expected exam score per minute) — Astra had no optimizer at its core |
| Evidence Bundle (audit trail) | Intelligence Receipt (inputs, predictions, alternatives, assumptions, unknowns) | Receipts are shown to students/parents as trust surfaces, and joined to outcomes for calibration |
| 135-test suite green without LLM key | Same law, as gate G2 + replay determinism + chaos days | Plus a **student simulator** — we test the *intelligence* against known hidden truths, which Astra explicitly could not do (no ground truth for weather) |
| Degradation to `{available:false, reason}` | Degradation tiers T0–T4, fully usable offline | On-device kernel — the entire brain runs on a cheap Android phone |
| Honest unknowns (grid state, official alerts) | Honest unknowns (unassessed subjects, tentative weak-topic lists) | Same discipline, now user-facing as a feature |

**The "1000×" is concrete and measurable, not rhetorical:** Astra proved discipline (tests, honesty, receipts). Techgram adds an *optimizer* (planner), *active sensing* (CAT), *a ground-truth simulator* (Brain Lab + CI regression), *on-device execution*, and *decision-slot architecture* (features = config). Same epistemic spine, five new organs.

---

## 5. THE DESIGN LAW (immutable constitution)

```
The system observes, models, predicts, plans, decides, and learns.
The LLM communicates and, as a calibrated instrument, perceives.
Remove the LLM and 100% of decisions still happen.
```

**Hard invariants — CI-enforced, no exceptions:**
1. Engines never import the LLM module (import-graph test).
2. All core tests pass with `LLM_API_KEY` unset and the LLM host firewalled (no-LLM drill).
3. LLM output can never write to Student State; only engines write state.
4. Every decision emits a receipt; every randomized choice logs its propensity.
5. Unknown ≠ zero. Self-reported ≠ assessed. Decayed ≠ current. No derived value may claim a stronger `knowledge_type` than its inputs (no-upgrade).
6. Models and parameters are versioned; old versions are never deleted; deploys pass a human gate.
7. Any state/decision is reproducible from `events + params_version + seed` (deterministic replay).
8. No unsupervised policy learning on students; no diagnosis of disabilities or mental health, ever; wellbeing guardrails (load caps, rest) outrank engagement.

**The Feature Contract (what makes "cherry" literal).** A feature ships only if it: (a) emits typed events; (b) gets all content decisions from `decide()`; (c) has a deterministic fallback; (d) logs a receipt per decision; (e) declares the outcome metric that defines "worked."

---

## 6. WHAT TECHGRAM IS NOT

- **Not an LLM product.** The LLM is tier 3 of 4 in rendering and one step in a doubt cascade.
- **Not a content company.** Content atoms exist to give the brain something to reason over; the moat is not volume.
- **Not a social network.** Concept-attached threads after pilot; a feed is a second startup.
- **Not a marketplace.** PG/rooms/food is cut from the roadmap (partner/affiliate at most, 12+ months).
- **Not a predictor of your rank.** Forecasts are model-based scenarios with visible assumptions; "X% chance to clear" never ships bare.
- **Not a diagnostician.** Patterns are observed; labels are never applied; struggling students get lighter plans and a human-referral nudge.
- **Not fake-precise.** If the interval is wide, the product shows a wide interval — and one tap to sharpen it.

---

## 7. THE COMPARATIVE SENTENCE (why this wins, in one breath)

```
Old EdTech:   "Here is content. Good luck."
LLM EdTech:   "Ask me anything."            (forgets you tomorrow)
Techgram:     "I know what you know, what you're forgetting, and what will
               move your exam score the most in the next 40 minutes —
               here's why, here's how sure I am, and here's the receipt."
```

The V1 release proves exactly that sentence — on Polity, offline, with the LLM switched off — and plants the sensors that turn every subsequent session into proprietary data.

*North star set. The measurable targets for V1 are in `03_GOALS.md`; the machine itself is specified in `04_ARCHITECTURE.md`.*
