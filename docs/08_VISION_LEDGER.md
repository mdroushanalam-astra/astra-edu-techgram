# TECHGRAM — VISION LEDGER
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
| 29 | Other subjects (History/Geography/Economy) | ❌ NOT COVERED | Content hours | **Trigger:** verification capacity grows beyond Polity floor |
| 30 | Writing/communication skills | 🔶 RESEARCH ITEM — answer-writing sensor (deterministic structure checks + capped LLM rubric) | Measurement validity unproven (agreement with humans? predicts Mains?) | **Trigger:** pilot research shows rubric agrees with human graders within tolerance |
| 31 | Community as retention (belonging, accountability) | 🔶 DEFERRED with Connect | — | Same trigger as #17; also test light "study-buddy accountability" in pilot feedback |
| 32 | Hindi / regional languages | 🔶 FIELD EXISTS, CONTENT DOESN'T | Atom authoring ×languages | **Trigger:** pilot demand + verification capacity |
| 33 | Minute-one "wow" for non-technical users | 🔶 DESIGNED — mock post-mortem is the **candidate** activation wedge | Candidate, not established — test in pilot | **Trigger:** pilot activation/first-session data |

---

| 34 | Session-experience layer (narrative sessions, preference model, curiosity engine, artifacts, break policy) | ✅ BUILT (S1) — golden replay pending (S2) | Founder vision: \"a beautiful date with the topic\" | — |
| 35 | Evidence-based validation stack (growth receipts, capability journey, changed-my-mind, milestones, curiosity ledger) | 🔶 S3 — surfaces after the golden gate | Validation must be earned from evidence, never copy | — |
| 36 | Limited public beta (Classes 6–10 + UPSC, invited cohort) instead of a private pilot | 🔶 GATED — after S2 golden gate + content floor per goal | Same measurement list, earlier public contact [ADR-028] | — |

| 37 | **Brain Freeze v0.1** (no new cognitive subsystems before real-user evidence) | ✅ ADOPTED + SIGNED 2026-10-03 [ADR-031] | Ship Mandate hardened into a signed gate | Lift only via a frontend-discovered architectural hole, with evidence (ADR) |
| 38 | Enterprise frontend as the product (Brain Lab demoted to internal instrument) | 🔶 NEXT — design gate open now | Founder ruling: the frontend is major development and gets decided here, not adopted from a review | G4 Product Experience Gate definition + design decisions recorded |
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

## RULES
1. Rows move only with evidence (pilot data, measured triggers) — never ambition.
2. A row that fires opens a **new ADR** before any build.
3. The Founder may promote/demote a trigger — registered here with date.
