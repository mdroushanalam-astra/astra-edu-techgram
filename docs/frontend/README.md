# ASTRA frontend delivery — 10 October 2026

The active frontend is now `src/journey/Journey.tsx`. It supplies one illustrated presentation layer for both deployment modes. The earlier `local-app.tsx` and `connected/learning.tsx` remain as inactive historical implementations; neither is imported by the application entry point.

## Open the experience

- Preview: `npm -w @techgram/web run dev` then visit `http://localhost:5174`. This is the complete offline River Systems journey, visibly labelled as a preview. It makes no learning API requests.
- Connected: start the existing configured backend on port 8000, then run `npm run dev:connected`. Sign in or register. Geography and Polity learning spaces use real server questions and evidence.
- Production: build with `VITE_CONNECTED_MODE=true`, as the existing web Dockerfile does. Preview answers are removed from the connected bundle.
- Design review links such as `/?screen=home` are available only in preview builds. They cannot bypass connected authentication.

## What is implemented

All 15 board stages are represented, with thinking shown only during an actual pending operation. Forms retain edits, summaries are editable, time horizon controls explore the roadmap, session duration can be changed, and the teaching board supports answers, explanations, confidence, pen/undo/clear and completion. Debrief and next-step choices produce account-owned connected notes (local in preview) that can be opened or downloaded. Home, Learning Map, Growth, Artifacts, Library, Agency and Settings use the same components and artwork.

Two separate data adapters share the same UI. The connected adapter uses `/auth/register`, `/auth/login`, `/students`, `/student/onboard` and `/learning/{student_id}/start|answer`. Tokens stay in memory. Failed learning commands retain the same UUID for retry; revision conflicts can reload server progress. Onboarding retries reconcile existing spaces before creating another. Requests time out after 30 seconds. There were no backend API changes in this phase.

Generated backgrounds are text-free. The orb has two matching expressions, and the mentor has teaching and completion poses. SVG lesson content and drawing strokes remain real UI. Mobile compositions use smaller background exports, stacked panels and collapsible navigation. Reduced-motion settings remove animation. Notes use a native modal dialog with keyboard focus containment and Escape dismissal.

## Evidence and boundaries

Session accuracy counts the answers recorded in that session. Learning Map uses server uncertainty intervals in connected mode. Growth counts sessions, answers and study dates saved in this browser; it is not a retention or mastery claim. Empty states do not invent prior activity.

Education level, explanation preference, energy, language, exam date and light-humor preference are saved to the connected account. English is the available lesson language; preference does not translate it. Browser read-aloud and cross-browser session notes are implemented. Goal switching, free-text tutoring, speech recognition, lip sync and scheduled reminders remain deferred. Roadmap milestones are explicitly an outline, not earned progress or predicted exam success.

Connected local notes are isolated by account; preview storage uses a different namespace. They remain on the device until cleared. Settings can disable local saving, clear local notes or sign out. Clearing local data does not delete server learning evidence.

## Validation

- Frontend typecheck and 16 tests pass. Documentation closure measured 307 JavaScript passes (291 kernel + 16 frontend), 69 Python passes, one PostgreSQL skip and 120 warnings; see ../EXPERIMENTS_AND_TESTS.md §28.
- Complete preview journey checked at 1440×900, 1920×1080, 820×1180 and 390×844: no horizontal overflow, browser errors or API requests.
- Real API check used a separate synthetic SQLite database: registration, Polity onboarding, response loss after a committed answer, retry with the same UUID, genuine revision conflict from another client, reload, completion, notes and returning-user login passed.
- Connected production build checked for preview item identifiers and private kernel answer-bank imports; none found.
- Visual review artifacts: `art-contact-sheet.jpg`, `journey-contact-sheet.jpg`, `reference-comparison.jpg`, `connected-session.png` and JSON QA reports in this directory. Individual four-viewport screenshots are generated into ignored `screens/`.

To reproduce browser checks, use an installed Playwright module and Chromium browser. `scripts/frontend_qa.cjs` checks the preview on 5174; `scripts/frontend_upgrade_qa.cjs` checks connected mode on 5175 with an API on 8000. Override `PLAYWRIGHT_MODULE` and `CHROME_PATH` when needed. Run the connected script only against a disposable test database; it creates synthetic accounts and learning evidence. `scripts/frontend_contact_sheet.py` assembles the captured screen review.

## Artwork provenance

Assets in `apps/web/public/art/` were produced using the built-in image generation tool, with the supplied board as style/composition reference, then exported to WebP without painting interface elements into them. The final prompt set is in `art-prompts.md`. `scripts/prepare_frontend_art.py` reproduces format conversion/contact-sheet assembly from the original generated PNG files when those local sources are available. Runtime rendering needs only the committed WebP files.

The result follows the reference closely in artwork, palette and layout, but is not a pixel-identical reconstruction of details hidden by the small montage. No deployment, enterprise certification or backend polishing is claimed by this frontend delivery.

## Session protocol closure

10 October: Journal 49–51, ADR-047–049, snapshot, Founder Guide, resume/index, architecture/roadmaps/vision and measured counters reconciled. Historical audit/freeze/external sources/raw simulator datasets remain preserved; they do not certify deployment.


## 11 October engineering delivery [ADR-051]
**Model:** OpenAI GPT-6-based Codex via Codex desktop (exact serving model ID unavailable; not guessed) · **Directed by:** Md Roushan · **When:** 2026-10-11T00:30:18+05:30.

Connected lessons now persist teaching steps, pause/resume, preferences, completion notes and reflections on the account. The existing kernel composer/teacher executes question and explanation steps; independent checks reject hints, and assisted/revealed answers do not create independent mastery or memory evidence. Eight original Geography Markdown lessons compile into 48 source-linked seed atoms with expert review explicitly pending. Local bounded source search, lesson-specific boards and browser-provided read-aloud are available. Live web, speech recognition, unrestricted conversation and translation are not configured.

Migration 0002_learning_journey must be applied before serving (production schema guard requires it). Owned commands use UUID/revision/step contracts and the existing transaction lock. Used-item rotation survives serialization; independent checks reject help; assistance carries no independent evidence weight. Versioned active lessons require explicit migration on pack changes. Executive recommendations and delivered teacher directives remain distinguishable. No new brain or cloud service was added.

Fresh checks: 306 JS / 69 Python passes, one PostgreSQL skip; kernel/web/scripts typechecks and both builds pass. Browser upgrade QA: `node scripts/frontend_upgrade_qa.cjs`, disposable API database only, report frontend/upgrade-qa.json. Preview QA remains `node scripts/frontend_qa.cjs`. Founder visual acceptance, expert curriculum review, load/restore/staging and enterprise operations remain open. Learners/pilots are later by Founder instruction; frozen Charter/audit and historical experiments remain intact.


## Founder connected check — 2026-10-11T00:45:27+05:30

Visit http://127.0.0.1:5175/ (connected production build), create your own account, select UPSC Polity under the main goal, finish onboarding and start a session. Answer each issued question with confidence; use Continue for feedback/teaching and summary. Pause/re-login resumes saved steps. Completion/debrief/notes belong to your account. The local API/database remain running for this check; this is not a hosted enterprise release. Separate migrated backend/connected_check.db preserves the existing prototype database. Existing preview at 5174 is a different mode.

Repeat QA with QA_DOMAIN=polity and QA_COMPLETE=true; frontend/polity-qa.json records accelerated natural completion. Standard QA defaults to Geography/manual finish. The production-build server command is `npm -w @techgram/web exec -- vite preview --host 127.0.0.1 --port 5175 --strictPort` after VITE_CONNECTED_MODE=true build; API must run on 8000. Apply Alembic from backend working directory with DATABASE_URL set. Never present this local serving setup as production PostgreSQL deployment.


## 12 October Geography reference integration [ADR-052]
**Model:** OpenAI GPT-6-based Codex via Codex desktop (exact serving model ID unavailable; not guessed) · **Directed by:** Md Roushan · **When:** 2026-10-12T11:31:32+05:30.

GEOGRAPHY_SOURCE_REVIEW.md records the full 1,483-line review. Exact synthesis is preserved/hashed/indexed into 85 subject sections; policies/schemas remain reference data. Bounded owned Library retrieval and mapped EXPLAIN excerpts use the existing server runtime. New Geography sessions pin versions; old unpinned sessions stay unchanged; independent questions withhold excerpts. No new planner/model/database. Reading does not update evidence. Eight assessed Geography concepts/16 seed items/48 atoms remain; whole-curriculum/grade-depth/UPSC certification unearned. Resolve edition/subject review and item ambiguity in a new immutable pack.

311 JS passes (295 kernel + 16 web); targeted Python five passes/17 warnings; reference browser QA passes four sizes without errors/overflow. Page localhost:5175: choose Geography, search monsoon/GIS in Library or start a new session. QA_REFERENCE=true enables reference QA; report frontend/reference-qa.json. Both builds/checks pass; deployment and learner/pilot gates remain open/deferred.


## 12 October assessed-unit expansion [ADR-053]
**Model:** OpenAI GPT-6-based Codex via Codex desktop (exact serving model ID unavailable; not guessed) · **Directed by:** Md Roushan · **When:** 2026-10-12T12:12:24+05:30.

The previously reference-only boundary is superseded for four authored foundation units: geomorphology, maps/motions, atmosphere and monsoon. New immutable catalog: 20 concepts / 80 private role-tagged questions / 120 atoms, seed subject review pending. Existing planner ranks an evidenced prerequisite frontier; existing teacher executes conditional explanation/support, a fresh no-hint check and distinct independent transfer. Role-tagged items and native diagrams replace arbitrary practice-as-transfer. One concept cycle per bounded session; partial budgets do not imply completion of every objective.

Old active grading stays on its original bank; historical notes/events remain while new catalog evidence is separate. Independent payloads withhold explanation/reference/diagram nodes. Unit preference persists in existing JSON; no new schema/model/planner/service. Library can choose a unit for the next session; unfinished sessions retain their old unit. Full grade/curriculum, expert review/calibration, open-response rubrics and operations remain open; pilots deferred. See GEOGRAPHY_UNITS.md.

Fresh verification: 320 JS passes (304 kernel + 16 web), 70 Python passes/one PostgreSQL skip/123 warnings, typechecks and connected build. Four-size units-qa.json covers natural completion, recovery/notes and Library-to-Monsoon-to-coordinate-prerequisite selection with preference recovered after login. Local connected app: localhost:5175, refresh/sign in and select Geography teaching unit.
