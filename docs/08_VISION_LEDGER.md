# TECHGRAM — VISION LEDGER

> Updated 10 October 2026 [ADR-047–049]. Current delivery status supersedes older rejection/build notes; vision and launch cuts remain.

## Every original idea → status → the trigger that reopens it. Deferral is a plan, not a loss.
*Living document [ADR-026]. Created 2026-10-02 from the original-vision comparison (external PDF §4) + ADR history. Update status as triggers fire — never delete rows.*

---

## THE LEDGER

| # | Original idea | Status today | Why deferred / changed | **Reopen trigger (evidence, not ambition)** |
|---|---|---|---|---|
| 1 | Student Intelligence Model ("state of the learner") | ✅ BUILT — belief + memory + envelope + event diary | — | — |
| 2 | "AI tutor is a feature; intelligence system is the product" | ✅ LAW — Charter central rule | — | — |
| 3 | Knowledge as exact numbers ("Polity 72%") | ✅ REPLACED — ranges + grey mist | Fake precision proven by cold-start experiment | — |
| 4 | Intelligence layer (personalisation, planning, adaptation, feedback) | ✅ BUILT — planner/diagnostic/AOM/behaviour/post-mortem | — | — |
| 5 | AI Super Teacher as LLM orchestrator | ✅ REBUILT — scripted teacher over verified atoms | Trust + cost + the no-LLM law | Voice quality A/B in pilot; fact-locked warm voice stays tier-3 |
| 6 | **Ask-anything doubts** | 🔶 DESIGNED, NOT BUILT (doubt cascade) | Needs verified-content coverage to answer safely | **Trigger:** content coverage such that ≥80% of sampled doubt queries hit verified atoms — then build the cascade |
| 7 | 40-minute sessions | ✅ BUILT — composer; 40 min is a tested default | — | — |
| 8 | Dynamic timetable | ✅ BUILT — planner (stronger than imagined: deadline + robustness) | — | — |
| 9 | Learning loop + prediction-vs-reality | ✅ BUILT — loop + AOM | — | — |
| 10 | Learning styles ("prefers visual") | ❌ DROPPED | Research refutes styles-matching (Pashler 2008) | Only if per-student modality A/Bs ever show measured effect |
| 11 | Chronotype ("strong mornings") | 🔶 DESIGNED — measured per student | Never assumed; chronotype research is weak | Trigger: Personalisation State collects start-hour windows; act only on measured per-student signal |
| 12 | Aptitude measurement | ❌ DROPPED | Quizzes can't measure aptitude honestly | Only via validated instruments, Year 2+ |
| 13 | Behaviour/engagement tracking | ✅ BUILT (internal, no labels) + **Personalisation State v1** [ADR-024] | — | — |
| 14 | Knowledge layer (books/notes/papers) | 🔶 PARTIAL — compiler + verified atoms (~105 items, 104 atoms) | Verification hours = bottleneck | — |
| 15 | RAG / embeddings / vector DB | 🔶 DEFERRED | Verified atoms first; pgvector when doubt cascade + content justify it | **Trigger:** doubt-cascade build (idea #6) |
| 16 | Speech / vision models | 🔶 DEFERRED | Nothing in the loop needs them; voice natural for Indian students later | **Trigger:** pilot shows typing is a barrier |
| 17 | Connect Realm (feed) | 🔶 **EVOLVED [2026-10-02, ADR-028]**: brain social DECISIONS before beta (anonymous aggregate proof + compatibility study-room invitations); the social product post-beta | Rooms need Wave-2 backend + consent/moderation ADR; named-peer comparison for minors out | **Trigger:** Wave-2 backend live + consent/moderation ADR + beta demand (users ask for community) |
| 18 | Career Realm | 🔶 DEFERRED 6+ months | Needs trustworthy skill measurement first | **Trigger:** skill measurement validated for ≥1 skill area |
| 19 | Parent intelligence (weekly reports) | 🔶 DEFERRED (template-only, opt-in) — **cheap payer test planned in pilot** | Every screen multiplies design/privacy; but "will parents pay?" must be tested | **Trigger:** ≥5 pilot parents say a parent would pay/ask — then WhatsApp/PDF weekly summary experiment |
| 20 | Mental/behavioural indicators for parents | ✅ POLICY — observable signals only, never diagnoses | Ethics wall (ADR-023) | — |
| 21 | 8-layer enterprise architecture | ✅ RESHAPED — brain + assets + (later) sync server | Solo + no money; layers = growth map | — |
| 22 | Payments | ❌ NOT PLANNED YET | No payer decision tested | **Trigger:** parent-summary experiment shows willingness to pay |
| 23 | Flywheel | 🔶 DESIGNED — sensors wired from day 1 | Waits for real users | — |
| 24 | Moat = student intelligence graph | 🔶 HONEST — "good thesis, no moat"; sequence defined | Moats compound from deployment | — |
| 25 | K12 globally | 🔶 **CONFIG-PROVEN, LAUNCH DEFERRED** (CBSE Cl-8 ran, zero code changes) | Minors → DPDP child consent + parental surface + content volume (one full term ≈ 300+ items/subject) | **Trigger:** compliance ADR done + one full-subject content pack verified + founder capacity for a second pilot track |
| 26 | "Don't build four startups" | ✅ ENFORCED — Feature Contract + cut list | — | — |
| 27 | V0 loop | ✅ BRAIN BUILT, simulator-proven; app = Wave-2 | — | — |
| 28 | Current affairs (sample-day session; CA retention weakness) | ❌ NOT COVERED — content-pipeline gap, not an engine gap | Daily-changing facts need a verified weekly workflow | **Trigger:** a weekly verified-update workflow exists (even 20 items/week) → then the CA decay engine (topic tags + recency half-lives) becomes buildable |
| 29 | Other subjects (History/Geography/Economy) | 🔶 Geography foundation available; History/Economy not covered | Foundation is not full exam coverage; expert verification required | Verified content/coverage capacity |
| 30 | Writing/communication skills | 🔶 RESEARCH ITEM — answer-writing sensor (deterministic structure checks + capped LLM rubric) | Measurement validity unproven (agreement with humans? predicts Mains?) | **Trigger:** pilot research shows rubric agrees with human graders within tolerance |
| 31 | Community as retention (belonging, accountability) | 🔶 DEFERRED with Connect | — | Same trigger as #17; also test light "study-buddy accountability" in pilot feedback |
| 32 | Hindi / regional languages | 🔶 FIELD EXISTS, CONTENT DOESN'T | Atom authoring ×languages | **Trigger:** pilot demand + verification capacity |
| 33 | Minute-one "wow" for non-technical users | 🔶 DESIGNED — mock post-mortem is the **candidate** activation wedge | Candidate, not established — test in pilot | **Trigger:** pilot activation/first-session data |

---

| 34 | Session-experience layer (narrative sessions, preference model, curiosity engine, artifacts, break policy) | ✅ BUILT (S1) — golden replay pending (S2) | Founder vision: \"a beautiful date with the topic\" | — |
| 35 | Evidence-based validation stack (growth receipts, capability journey, changed-my-mind, milestones, curiosity ledger) | 🔶 S3 — surfaces after the golden gate | Validation must be earned from evidence, never copy | — |
| 36 | Limited public beta | 🔶 GATED — adult UPSC first, superseding earlier combined K12 proposal | ADR-031 cohort ruling remains active; content/operations/pilot criteria needed | Founder recruitment and release evidence |

| 37 | **Brain Freeze v0.1** (no new cognitive subsystems before real-user evidence) | ✅ ADOPTED + SIGNED 2026-10-03 [ADR-031] | Ship Mandate hardened into a signed gate | Lift only via a frontend-discovered architectural hole, with evidence (ADR) |
| 38 | Enterprise frontend as the product | ✅ Reference implementation delivered; Founder review pending (2026-10-10) | Prior rejections remain in Journal 19; one UI/two adapters [ADR-048] | Founder feedback, then backend polishing and release gates |
| 39 | Content coverage gate (coverage × measurement × diagnosis × teaching × retrieval × transfer × provenance × style variation) | ✅ ADOPTED [ADR-031] | Replaces the raw 500-item target as the content KPI | Content sprint reports against the 8 dimensions |
| 40 | Beta cohort = UPSC adults first | ✅ ADOPTED [ADR-031] | Architecture general, evidence specific | K12/minors only behind the Gate-5 compliance ADR |
| 41 | Mismatch transparency as a trust surface ("Techgram believed → evidence → update") | 🔶 RENDERING CONTRACT SET [ADR-031] | Data exists (predictionErrorStats, preference mismatches); frontend renders it | First frontend build |
| 42 | Agency surfaced as moments, never a score | ✅ LAW [ADR-030/031] | anti-Goodhart; scalar structurally omitted from agencySurface | — |

## THE PERMANENT CUTS (not deferred — dropped with cause)

| Idea | Cause | Reopen only if |
|---|---|---|
| Student Life (PG/rooms/food) | Different business; Founder instruction | Founder reverses + 12+ months + dedicated team |
| Learning-styles matching | Scientifically refuted | Per-student measured modality effects (never styles) |
| Aptitude claims | Unmeasurable from quizzes | Validated instruments |
| Diagnosis of mental state / disabilities | Ethics wall + law | Never |
| Foundation-model training | Unnecessary; model layer replaceable | Never (architecture law) |

---

## ROWS 43–46 [added 2026-10-04, the cognitive-runtime era]

| # | Idea | Status today | Why deferred / changed | **Reopen trigger** |
|---|---|---|---|---|
| 43 | Belief maintenance for advanced students (staleness-aware targeting) | ✅ DONE [ADR-046] | Fired by the Layer Study finding (selective observation → stale maps) | — |
| 44 | Multi-seed sweeps of the experiment rigs | ⬜ PENDING (rigs run ~0.25 s each) | Single-seed per scenario is honest but thin | **Trigger:** before any public claim or pilot Gate-3 — run 5–10 seeds × all scenarios |
| 45 | The rendered product demo of the Phase 6 arc | ⬜ PENDING | The kernel demo (demo6.ts) is the instrument; the pretty renderer rides the frontend | **Trigger:** founder go on the demo render (rides screens 9–15) |
| 46 | Spiky-knowledge belief maintenance residual (t09/t10) | ⬜ PARTIAL [ADR-046] | The staleness boost helped; the accuracy floor still binds on half-mastered maps | **Trigger:** a layer-study re-run showing the t09/t10 inversions closed |

---

## RULES
1. Rows move only with evidence (pilot data, measured triggers) — never ambition.
2. A row that fires opens a **new ADR** before any build.
3. The Founder may promote/demote a trigger — registered here with date.

## Rows 47–49 — active product delivery (10 October 2026)

| # | Idea | Status | Evidence/next trigger |
|---|---|---|---|
| 47 | Owned server learning/atomic evidence | ✅ Implemented [ADR-047] | PostgreSQL/staging/load/restore still needed |
| 48 | Preferences/reflection/notes | ✅ Local UI; server sync deferred [ADR-048] | Explicit server profile/artifact scope |
| 49 | Voice/free-text/illustrated lip sync | 🔶 Deferred; unavailable/explained | Explicit integration scope and capability proof |

## Rows 50–51 — requested expansion and researched recommendation
**When:** 2026-10-10T23:49:11+05:30 · **Model:** OpenAI GPT-6-based Codex via Codex desktop (exact serving model ID unavailable; not guessed) · **Directed by:** Md Roushan. ADR-050 is proposed.

| # | Idea | Status | Trigger |
|---|---|---|---|
| 50 | Classes 6–12 plus UPSC | Founder requested target; no broad/school launch approval or coverage proof | Adopt scope/Charter amendment; reviewed curriculum and child/privacy release gates |
| 51 | Reviewed Markdown knowledge, local retrieval and richer connected teaching | Researched proposal; not implemented | Adopt bounded work package; preserve existing authority and prove evidence-to-teaching loop |


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
