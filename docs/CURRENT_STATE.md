# TECHGRAM — CURRENT STATE

**Updated:** 2026-10-12T12:11:06+05:30 · **Model:** OpenAI GPT-6-based Codex via Codex desktop (exact serving model ID unavailable; not guessed) · **Directed by:** Md Roushan.

The active product is a cinematic React learning journey backed, in connected mode, by one server-owned TypeScript decision engine. All 15 reference stages and sidebar pages are implemented. Account ownership, atomic learning persistence, safe retries and revisions are tested. Founder visual acceptance, broad launch, institutional readiness and real-student efficacy remain unearned.

## Verified state

| Area | Current status | Evidence |
|---|---|---|
| JavaScript | **320/320 tests passed**: 304 kernel + 16 frontend, 36 files | Fresh COUNTERS.json; EXPERIMENTS §31 |
| Python/API | 70 passed, one PostgreSQL-only skip; 123 deprecation warnings | Fresh pytest; §31 |
| Frontend | One active journey: apps/web/src/journey, with connected/preview adapters | ADR-048; frontend/README |
| Visual delivery | All 15 stages plus Home/Session/Map/Growth/Artifacts/Library/Agency/Settings | Screen/contact/reference sheets |
| Preview browser QA | 1440×900, 1920×1080, 820×1180, 390×844; no overflow/errors; zero API calls | frontend/preview-qa.json |
| Connected browser QA | Real API signup/onboard, committed-answer response loss/retry, cross-client revision conflict/reload, notes and return | frontend/connected-qa.json |
| Builds/typecheck | Both frontend builds and frontend typecheck passed; connected bundle excludes private/demo item identifiers | §25 |
| Account/persistence | Required JWT key, owned learners, request sessions, locks, UUID/revision contracts and atomic commands | ADR-047; Python regression tests |
| Content inventory | **105 verified items · 104 verified atoms**, 54 concepts / 13 topics across seed Polity/K12 | COUNTERS; verified denotes existing authoring tags, expert mentor review remains required |
| Cognitive core | Historical System A/B capabilities integration-tested; no new cognitive subsystem in UI phase | ADR-035–046; historical §17–23 |

## Authority and limits

Connected mode calls `/auth`, `/students`, `/student/onboard`, `/learning` APIs. Python owns authentication/transactions/persistence; the compiled TypeScript kernel owns scoring and adaptive decisions. The browser presents server evidence and retains command identity for retries. Production legacy learning routes are retired; Python legacy/regression service remains. The backend is active infrastructure, not archived-only.

Preview is a labelled offline River Systems demonstration, isolated from connected data. Connected learning requires the API; complete offline connected synchronization is not implemented. Previous local/amber/simple connected screens are inactive history.

Connected lessons now persist teaching steps, pause/resume, preferences, completion notes and reflections on the account. The existing kernel composer/teacher executes question and explanation steps; independent checks reject hints, and assisted/revealed answers do not create independent mastery or memory evidence. Eight original Geography Markdown lessons compile into 48 source-linked seed atoms with expert review explicitly pending. Local bounded source search, lesson-specific boards and browser-provided read-aloud are available. Live web, speech recognition, unrestricted conversation and translation are not configured. Accuracy remains observed performance, not retention. English content is available; language preference does not translate it.

Production does not adopt strategies using simulated gains or infer unobserved fatigue/frustration. Simulator wins remain simulation evidence; learner efficacy is unknown until a real pilot.

## Latest delivery — adopted engineering scope [ADR-051]

Frontend/backend upgrades proceed now; learner recruitment and pilots are deferred by Founder. Connected teacher composition, persisted steps and preference-sensitive examples are implemented. Executive proposals remain advisory when incompatible with the teacher's active evidence contract. Full expression generation, unrestricted conversation, live search, translation and complete grade coverage remain unfinished.

The original Polity/K12 counter totals below retain their historical scope. Geography additionally has 16 seed items, eight concepts and 48 compiled seed atoms; content expert review remains pending. Source links do not constitute approval.

## Current Founder check — Polity connected session

The real connected production frontend is running at http://127.0.0.1:5175/ with owned API/persisted database at 8000. Create an account and select UPSC Polity in onboarding. Follow issued questions and teaching steps; confidence is collected per question, the close summarizes existing confidence, and session notes/reflections persist. Fresh production-build browser check includes natural completion; report frontend/polity-qa.json. This is local SQLite testing, not deployed PostgreSQL enterprise certification. Journal 54 / EXPERIMENTS §31.

## Geography assessed-unit delivery [ADR-053]

Four new authored units execute through the connected teacher: geomorphology (10 concepts), maps/motions (4), atmospheric foundations (4), monsoon (2). Total 20 concepts / 80 private role-tagged items / 120 atoms, subject review pending. A selected unit resolves to an evidenced prerequisite frontier ranked by the existing kernel. Correct/confident diagnostic may take a shorter route; uncertain/incorrect responses get explanation and supported practice; failed checks trigger repair. Independent check and transfer use distinct no-hint items.

New sessions preserve older active grading, retain old events/notes, and isolate new catalog evidence rather than silently migrating mastery. The UI shows native readable diagrams and persisted unit selection; Library can select an authored unit for the next session. Independent payloads withhold explanations/reference/diagram nodes. The legacy eight-concept seed and 85-section reference index remain historical/source assets, not additional new assessed totals.

Fresh full checks: 320 JS / 70 Python passes, one PostgreSQL skip/123 warnings; typechecks and connected build pass. Four-size unit browser flow includes Library-to-Monsoon selection, its unknown coordinate prerequisite, diagrams, natural end/notes and return; see GEOGRAPHY_UNITS.md, frontend/units-qa.json and EXPERIMENTS §31. Full curriculum/grade depth, expert item review/calibration, production capacity and enterprise gates remain open. Pilots remain deferred.

## Next actions and gates

1. Continue frontend/backend polishing: content review/coverage, remaining integration and account operations. Founder visual acceptance is not presumed.
2. Execute PostgreSQL/container/staging checks; measure subprocess/replay capacity and realistic histories; rehearse restore.
3. Configure HTTPS, secrets, monitoring, account recovery/verification and institutional privacy/role requirements.
4. Add bounded current-source retrieval or speech recognition only with real provider integration and provenance; retain independent kernel evidence.
5. Learners/pilots remain later, as requested; efficacy, school release and enterprise certification are unearned.

## Read and reproduce

[Frontend delivery](frontend/README.md), [production readiness](PRODUCTION_READINESS.md), [journal 49–51](PROJECT_JOURNAL.md#entry-49), [decisions](DECISIONS.md), [evidence](EXPERIMENTS_AND_TESTS.md). Run `npm run counters`, `npm test`, `npm run typecheck`, and isolated Python pytest. COUNTERS measures JavaScript/content; Python/browser results are separate. Frozen audit/freeze reports and raw simulator datasets remain historical, not deployment certification.

Historical baseline: 298/298 tests passed before ADR-051; current results above supersede it.
