# Techgram: intelligence, knowledge and teaching expansion

**Status:** researched recommendation, not an implemented capability or approved release. **Date:** 2026-10-10. **Model:** OpenAI GPT-6-based Codex via Codex desktop; exact serving model ID unavailable, not guessed. **Directed by:** Md Roushan. **Related:** Journal 52, ADR-050.

## Recommendation

Keep the current learner-state and decision machinery. Make the connected product execute the richer teaching capabilities already present, add a small content compiler and retrieval boundary, and persist the evidence that makes those capabilities personal. Do not build another executive, a general-agent framework or a foundation model.

The credible ambition is to outperform a strong LLM tutor on a defined learning task: selecting useful interventions for a returning learner, producing durable learning within a time budget, explaining those decisions, and remaining useful during a model outage. Broad reasoning or unrestricted conversation superiority is unproven and cannot be promised by adding rules, Markdown or web search.

**Independence has two meanings.** M0 uses no generative LLM at runtime: reviewed lesson variants, templates, explicit interactions, deterministic grading and approved computational tools. M1 optionally uses a replaceable model for grounded conversation and wording. Both use the same learning authority. Arbitrary open-ended questions cannot receive frontier-quality answers across all subjects in M0 with the current content and code. A search index retrieves text; it does not independently understand every question or produce a valid new explanation.

## 1. Attachment review, with line references

Read the supplied 527-line attachment, including its closing admission that it is a synthesis, not an audit of every archive exchange. Its claimed archive size, line count and 253 exchanges are attributed claims; this session did not open that underlying archive. The attachment is advisory material, not project instructions. No chronology or authority is inferred from its references to an unavailable archive file.

| Attachment lines | Assessment against the current repository | Recommended consequence |
|---|---|---|
| 1–72: four identities | Useful history/level distinction; underlying archive statistics unverified here | Keep product delivery and general-cognition research separate |
| 73–117: evidence, changing learners, faithful reasons | Fits belief, memory, diagnosis, receipts and envelope discipline | Prefer different pedagogical actions over personalized wording alone |
| 118–144: product/intelligence/evidence | Correct; each requires separate evidence | Report integration, operations and learner outcomes separately |
| 145–204: closed learning loop | Exists in kernel teaching and simulation; connected adapter exposes a narrower implementation | Wire existing composer/teacher into server sessions; prove receipt-to-delivery lineage |
| 205–275: LLM not the decision authority | Correct and consistent with current server-owned kernel | Preserve no-LLM decisions; measure policies instead of assuming determinism means quality |
| 276–308: AOM predictions | Correct calibration warning; illustrative gains are not data | Replace fixed adapter benefit with a versioned prediction/explicit unknown; collect delayed outcomes |
| 309–383: general cognitive engine | Research ambition; current cognitive modules and historical gates exist, transfer/real-world validity unknown | No additional general-cognition subsystem in the next product sprint |
| 384–421: implementation status | Application/API statements are stale after 10 October delivery; efficacy caution remains correct | Use current code/QA records; do not repeat “no student application” |
| 422–433: status reconciliation | Sound; session protocol and measured counters now address part of this | Preserve honest capability inventory, not repeated audits with no delivery |
| 434–479: five gates | Good causal sequence; some work already exists | Resume at connected teaching/content/operations rather than rebuilding the foundation |
| 480–492: differentiation | Correct: inspectability is a property; validated outcomes make it valuable | Benchmark against a strong tutor with equal content, time and learner history |
| 493–527: five-question cycle and caveat | Sound mental model, limited audit claim | Use an evidence-action-outcome cycle; no general-intelligence claim |

## 2. What the code actually supports

| Capability | Code inspected | Current boundary / next change |
|---|---|---|
| Learner beliefs and uncertainty | kernel/src/belief.ts, memory.ts, diagnosis.ts | Model-based estimates; expert item ratings and prior parameters are assumptions, not universal calibration |
| Planner and executive | planner.ts, cognitive/executive.ts, developmental-session.ts | Reuse these owners; production strategy adoption cannot use simulated gain as observed learner benefit |
| Session shape and teacher moves | composer.ts, teacher.ts, teach_loop.ts | Richer probe/explain/hint/contrast/example/retrieval machinery exists; not fully exposed by connected adapter |
| Experience and presence | cognitive/experience-plan.ts, conductor.ts, expression.ts | Existing seam and utterance types; conductor instructions alone are not a complete browser teaching protocol |
| Preferences and artifacts | preference.ts, artifact.ts, events.ts | Kernel representations exist; browser preferences/debrief/notes are currently local |
| Connected authority | backend/app/learning.py, scripts/learning_runtime.mts | Owned UUID/revision commands and atomic persistence; subprocess/full replay per request needs capacity measurement |
| Content | content.ts, atoms.ts, polity_atoms.ts, k12_seed.ts, geo_seed.ts | Seed content and authoring tags; no full Classes 6–12 or UPSC syllabus coverage |
| Product | apps/web/src/journey/Journey.tsx, connected.ts | One illustrated journey; connected board uses questions/text, richer River diagram is preview-only; voice/free-text unavailable |

Concrete findings from the active path:

- The runtime calls planDay and DevelopmentalSession, but does not call composeSession/nextMove/conduct/composeExpression for a full executed teaching sequence.
- `predictedBenefit: 0.4` is passed to executive decisions and replayed contexts. This is a fixed adapter input, not a calibrated estimate of intervention effectiveness. The planner has separate AOM predictions; the contracts must join them rather than display this constant as learning evidence.
- Workspace elapsed time and plan progress are reset, behavioral fields have neutral placeholders, and budgets set jokes/breaks/LLM to zero. Public fatigue/frustration correctly remain unknown. Do not turn those placeholders into psychological observations.
- Connected onboarding transmits name/goal/date; answer commands transmit choice/confidence/time/minutes. Local style, language and energy do not reach the learning authority.
- Geography selects buildGeomorphologyContent, a foundation pack with a 30-question/no-negative-marking specification. It is not a validated full UPSC Geography exam model. The separate aggregate COUNTERS inventory covers Polity/K12, not this Geography pack.
- Polity fact atoms explicitly say founder+GLM review pass 1, pending expert-mentor review. `verifiedBy` is an authoring tag, not proof that an independent subject expert approved every fact.
- `validateUtterance` checks nonempty references and forbidden phrases. This is useful structural protection, not proof that every cited source supports every sentence. Runtime claim/source resolution remains necessary for generated speech.
- Planner target and executive workspace focus can be computed differently; test that delivered content, decision receipt and outcome attribution refer to the same objective. A generic first-item fallback must not silently substitute another concept.
- Learner belief uses a dense N×N covariance. Partition a broad curriculum into bounded course/unit state; do not load every school/UPSC concept into one global matrix or infer expertise across subjects without evidence. Benchmark before changing the numerical model.

Last session's evidence remains 298 JavaScript tests and 64 Python tests with one PostgreSQL skip and 114 warnings. Those counts are prior results, not fresh runs in this analysis. This review does not establish learner efficacy or production capacity.

## 3. Minimal architecture

```text
React room, lesson board, input and speech playback
                       |
Authenticated Python API + learner transaction + command log
                       |
TypeScript learner state -> planner/executive -> existing composer/teacher
                       |                         |
                 decision receipt         public teaching step
                       |                         |
                 observations <---------- browser execution

Approved course packs -> content compiler -> pinned published content
                                      -> local retrieval
Authoritative web sources -> bounded retrieval outside learner transaction
                         -> provisional source card OR reviewed pack update
Optional model -> grounded wording / intent suggestion / rubric sensor
               -> cannot change decisions, grading keys or learner truth
```

Keep React/Vite, FastAPI, the TypeScript kernel and PostgreSQL. Store syllabus edges, lesson metadata, sources and versions in ordinary files/tables. Use an index, not a new graph service. A scheduled ingestion command/job is enough initially; no dedicated message-broker cluster or agent swarm.

Keep web/model requests outside the locked learner transaction. Attach their immutable result IDs in a new validated command; re-check revision before use. Search failure must not hold a learner lock or prevent the existing lesson from continuing.

Version/pin content, policy and consumed source snapshots per session. Replay stored teaching choices and evidence, never re-fetch today's web page to reconstruct yesterday's lesson. Publish corrections with an audit trail, withdrawal of faulty content and an explicit migration/re-evaluation policy.

## 4. Knowledge: Markdown for authors, structured packs for execution

Use many small Markdown files with validated front matter. A single giant knowledge.md is difficult to review, retrieve, version and map to assessments. Files are authoring inputs; the running engine consumes compiled records.

Illustrative pack layout (proposed, not yet created):

```text
content/packs/river-processes/
  manifest.yaml
  concepts/transportation.md
  concepts/deposition.md
  items/private-items.json
  boards/river-process.svg.json
  sources.json
```

Each concept needs:

- Stable semantic ID plus course/grade/exam mappings, curriculum edition, language and prerequisites. Share reviewed facts where appropriate; grade-specific depth and assessment validity remain separate.
- Original explanation, compact explanation, worked example, contrast, common mistakes and progressive hints.
- Interactive task and transfer task; measurement items kept apart from taught/revealed examples.
- Reviewed board specification, optional computational model and declared assumptions/valid parameter ranges.
- Source URL/document/page or section, retrieval date, effective/as-of dates for mutable facts, license/use permission, author/reviewer and publication status.
- Answer key/rubric and distractor meaning; difficulty initially expert-estimated, empirically calibrated later.
- Tone variants and explicit learner-facing options. An analogy must say where it stops being accurate.

The compiler validates schemas, duplicate IDs, missing links, prerequisite cycles, valid options/keys, source metadata, compatible board/tool specs, grade/language mappings and complete fallback moves. A type check cannot verify subject truth: reviewers must check explanations, distractors, diagrams, worked solutions and claim support.

Use draft -> reviewed -> published -> withdrawn states. An AI can draft or flag inconsistencies rapidly; it cannot independently turn its draft into a published authoritative grading pack. Review at the chapter/unit level to reduce overhead. Generated variants reference shared facts but need review of the transformations themselves.

Do not ship private answer banks to the browser or use held-out evaluation items as practice. A lesson source may legitimately explain the concept; it must not accidentally leak an unreleased assessment key.

Source strategy: official curriculum/exam documents define scope; original teaching materials or permitted resources supply the lesson. Free online access does not equal commercial reuse rights. NCERT explicitly warns against unauthorized commercial use of textbook content; align lessons and obtain rights for material you reproduce. Check each resource's actual license rather than assuming all government or open-education pages share one license. [NCERT copyright notice](https://www.ncert.nic.in/pdf/announcement/notices/Press_Release_Copyright_Infringement-NCERT.pdf). Use [UPSC's official question archive](https://www.upsc.gov.in/examinations/previous-question-papers) to study demands, with rights and version checks before republication.

## 5. Retrieval and web freshness

**First:** filter published packs by course, objective, grade/depth, language, version and source validity. Retrieve by concept IDs, aliases and PostgreSQL full-text search. PostgreSQL supports GIN indexes for this purpose; do not add another database until retrieval evaluation demonstrates a need. [Official documentation](https://www.postgresql.org/docs/current/textsearch-indexes.html).

**Next if justified:** add semantic retrieval for paraphrased questions/Hinglish, under the same filters. Embeddings are not generative reasoning, but are still a model dependency; if strict model independence is required, retain lexical/alias retrieval as the baseline. Retrieval-augmented generation combines retrieval with a generator—it does not eliminate the language model. [Original RAG paper](https://arxiv.org/abs/2005.11401).

**Web:** use for current affairs, changed rules/data, and explicitly missing knowledge. Prefer primary subject authorities, preserve publication/effective dates, citations and conflicts. Search result snippets are leads, not verified teaching materials. A single primary source may be sufficient for a routine fact; a second agreeing page is not automatic independent verification.

For UPSC, pre-ingest relevant official releases, statistics, reports and exam notices on a scheduled basis. Map each update to static concepts and maintain as-of dates. Live search is a fallback/requested refresh, not the default for every question.

Live results have two paths: a cited provisional information card, clearly marked as newly retrieved/unreviewed; or the reviewed publishing workflow. Do not generate graded questions or update mastery from unreviewed answer keys. Optional grounded wording must preserve caveats and cannot claim guaranteed truth merely because citations are attached. Unsupported/conflicting facts get an uncertainty response.

Treat fetched text as untrusted data: strip active markup, constrain sizes/redirects, deny private-network URLs, apply fetch timeouts, and ignore embedded instructions. Never place learner names, answer history or sensitive details into public search queries. Search/model tools have no learner-write or arbitrary execution authority.

Proposed performance budget, to be benchmarked: cached/local next-step response p95 below 500 ms; playback starts from prepared text/audio; live external lookup gets a bounded several-second wait with cancellation and a useful fallback. These are targets, not measurements or a promise of instant fresh web answers. No mandatory model/search round-trip per turn.

## 6. Personalization that changes what happens

Maintain a compact learner record: goal/deadline/available time; concept evidence and uncertainty; known mistakes and forgetting evidence; explicit interests/language/accessibility/tone preferences; session progress; and a small evidence-linked continuity summary. Keep raw observations, estimates and self-reports distinguishable. Correction/deletion and retention policies apply to this memory; “remember forever” is not the product promise.

Suggested cold start: a short goal interview and a small set of diagnostic probes, adjustable/skippable. Do not claim to understand the learner after a handful of answers. Accommodations and explicit requests override stylistic optimization.

Avoid fixed “visual/auditory learner” labels. Ask which presentation they want and test useful alternatives; preference and learning effectiveness are distinct. The learning-styles review found insufficient support for routinely matching instruction to such labels. [Pashler et al.](https://pubmed.ncbi.nlm.nih.gov/26162104/).

Examples of meaningful branching:

| Evidence | Next action | Fresh evidence |
|---|---|---|
| Little evidence | Brief diagnostic, then explanation if needed | Unassisted response |
| Strong immediate answer, weak later retrieval | Due recall and spaced follow-up | Delayed answer on a fresh item |
| Repeated confident confusion | Probe the distinction, then contrast | Different-context discrimination |
| Success with hints | Fade the scaffold | Independent transfer, not repeated hinted success |
| Explicit “slower / no jokes / show example” | Change pace/style within the current objective | Preference response, separated from mastery |
| Reported low energy or short time | Offer a lighter useful path | Self-report and actual completion; no diagnosis |
| System prediction repeatedly misses | Widen uncertainty and surface a conservative alternative | Recorded outcome, reviewed calibration |

A pleasing explanation is not evidence that the concept has been learned. Retrieval practice has experimental support, but the published study is not evidence that Techgram's particular implementation works for every cohort. [Karpicke and Blunt](https://pubmed.ncbi.nlm.nih.gov/21252317/).

Initially keep policy learning offline/shadow with human-approved version releases. Randomize only safe reviewed variants under a registered protocol; preserve exposure/propensity and delayed outcome. Do not let the production engine silently invent a strategy from simulation or claim causal benefit from a before/after score.

## 7. Interactive sessions and personality

Extend the existing ExperiencePlan/TeachingMove seam into a public, schema-checked teaching step. It includes step/segment IDs, objective, actual move, approved content references, board payload, expected input, completion condition, hint state, budget, provenance and receipt ID. Server-private keys and outcomes stay private. Use explicit answer, hint, request-example, pause, resume, preference, artifact and completion commands with UUID/revision semantics. Emit evidence only for observable actions.

Persist active session, elapsed active-learning time, demonstrated/assisted attempts and segment progress. Do not replan from zero after every answer. An interruption refreshes the workspace and preserves the objective unless the authorized engine changes it. Separate choosing a learning action, choosing its delivery move, and executing it; no second browser planner.

Session shape: continuity opening -> useful probe -> explanation/example -> student prediction -> hint or contrast when justified -> independent transfer -> summary -> delayed check. Vary or skip these steps based on evidence; never force the same theatrical arc on every learner.

For River Systems, the student could vary a reviewed flow/sediment model, predict deposition, explain the diagram, compare another situation and later solve an unseen item. Label simplified physical assumptions. For Polity, use reviewed jurisdiction comparisons and classification tasks. For mathematics, validate symbolic/numeric results using approved bounded tools and domain constraints; never evaluate arbitrary generated code.

Astra can feel distinctive through attentive continuity, concise wit, timely silence, specific encouragement and earned self-correction. Use a small reviewed repertoire plus content-specific examples; do not add a separate personality brain. Keep tone opt-in/changeable and separate from instructional effectiveness. No fabricated relationship memories, emotion diagnosis, guilt, dependence or claims that the system is human/omniscient. Child-appropriate tone is a reviewed course policy, not a guess from behavior.

Connect the existing expression policy to approved lesson text, interruption-aware playback and source-grounded speech. Text completes first; TTS reads it; pause/cancel/rate controls are real. Optional ASR produces a transcript that the learner can correct. Recognition confidence is not subject mastery. Review scientific terms, names, symbols and language variants; text fallback always works. Streaming free conversation may use M1 but never own the educational decisions.

## 8. Classes 6–12 plus UPSC

The Founder's new request explicitly broadens the target. This supersedes an adult-only *ambition*, but it does not prove school launch readiness or remove any child-release gate. Keep the Charter unchanged until an adopted scope decision registers a deliberate amendment. This plan records requested direction and recommends release gates, not a binding launch date.

Share the core engine and concept identity where useful; use separate course objectives, grade-specific depth, language, items, scoring, deadlines and constraints. A school science success does not prove an adult UPSC transfer skill. An exam-focused pace is not automatically suitable for a child. UPSC coverage includes distinct Prelims, CSAT, Mains/essay and optional-subject requirements; do not claim full UPSC readiness from a small GS pack or objective quizzes. School expansion requires the chosen board, edition, subjects and languages to be mapped, not just a grade selector.

Recommended entry slices: one complete adult UPSC Polity unit and one linked school science/geography unit for a gated child pilot. Expand through published, reviewed units. The product can show planned curriculum coverage, but unavailable chapters must remain explicitly unavailable; do not sell Classes 6–12/all-subject coverage before it exists.

For under-18 learners, build age-appropriate notice, verifiable guardian consent where applicable, guardian/learner role separation, access/withdrawal/deletion, minimized retention, safety/reporting and human escalation before a child pilot. Parent reporting should support learning without exposing every private reflection by default. No targeted advertising or manipulative engagement; review learning telemetry against child-protection restrictions and any applicable exemptions. A commercial app must not assume it qualifies as an exempt educational institution.

India's DPDP implementation has a transition schedule; do not treat every provision as already effective or as indefinitely deferred. The government's education-platform statement addresses parental consent, limited institutional exemptions and the transition framework. Confirm the specific commencement/applicability and vendor practices for the intended launch with qualified counsel. [Official statement](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2202901&lang=2&reg=3). These controls are required launch design work, not an unsupported claim that Techgram is legally certified.

## 9. Delivery order and acceptance

These are work packages, not calendar promises. Subject review, languages, voice budget and school permissions can dominate timing.

| Package | Deliverable | Exit evidence |
|---|---|---|
| 1: one real intelligent lesson | Persist preferences and active session; wire composer/teacher/expression into connected mode; fix prediction/receipt lineage; full explanations for the chosen pack | Returning learner, pause/resume, hints vs independent answers, interruption, lost response/retry and restart replay all work; no private keys in client; LLM blocked without changing decisions |
| 2: knowledge publishing | Markdown/front-matter compiler, source/review/version states, one complete unit, lexical retrieval, approved board assets | Expert review; source support and coverage checks; missing/withdrawn/version-conflict cases; held-out assessment separation |
| 3: voice and freshness | Interruptible TTS, corrected transcript input, scheduled official-source ingestion, bounded live source cards; optional grounded M1 | Text/no-voice parity, correct cancellation, latency/cost measured, stale/conflicting/injected sources handled; no transaction waits on web |
| 4: production and adult outcomes | PostgreSQL/container/staging/load/restore and operational controls; registered comparative pilot | Real history/concurrency performance, backup restore, account operations, privacy exports/deletion; learning/retention estimates with uncertainty |
| 5: school pilot then coverage expansion | Child account/guardian controls, age-reviewed course unit, teacher/guardian oversight and accessibility | Required release/privacy review; consent withdrawal, retention/deletion and escalation tested; separate school outcome evidence; expand only reviewed subjects/grades |

School safety/content preparation can proceed alongside the adult slice; public deployment remains gated. Institutional SSO/roles/audit and contract requirements are a separate buyer/release obligation, not evidence of teaching intelligence.

First implementation targets: scripts/learning_runtime.mts and backend/app/learning.py for the connected session; existing composer/teacher/ExperiencePlan for pedagogical execution; existing events/preference/artifact types for durable evidence; apps/web/src/journey for rendering and interruption; a small content compile/retrieve module outside the pure kernel. Start with a contract walkthrough before edits, keep the prior deterministic baseline and test actual behavior changes. This analysis has not implemented those changes.

## 10. What would justify “better than a frontier tutor”?

Pre-register a bounded benchmark and a consented learner study. Name the actual model/version/date/settings used; do not benchmark against an imaginary model or claim to have designed one. Include a fixed study plan, a strong grounded LLM tutor with the same learner history/content/tools/time budget, Techgram M0 and optionally Techgram M1. Where possible also compare Techgram to a simpler adaptive scheduler to determine whether its additional machinery earns its complexity.

Measure independently graded fresh-item performance, delayed retention at pre-specified intervals, transfer, time to criterion, misconception recurrence, unsupported claims, uncertainty calibration, latency, cost, failures and learner usefulness. Separate preference satisfaction from learning. Blind grading where possible; randomize appropriately, handle attrition, predefine a primary endpoint and determine sample size from the effect/variance you intend to detect. Earlier “20–30 learner” proposals are feasibility cohorts, not automatically powered superiority trials.

Replay/ablation can show why a decision changed. A matched controlled study is needed to attribute better learning to it. Publish losses and cohort differences. Define a superiority margin or another registered success criterion before collecting outcomes; do not pick the winning metric afterward. No experiment here has demonstrated Techgram beating a frontier LLM, human teacher or real-student baseline.

**The next move:** one server-persisted, source-reviewed, interrupted-and-resumed lesson that recognizes a real learner's mistake, uses a different teaching move, and checks the result later. This is the smallest deliverable that joins the desired intelligence, knowledge, personality and app architecture without adding another brain.


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
