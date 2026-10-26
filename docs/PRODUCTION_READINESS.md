# Connected learning and production hardening — 10 October 2026

This change provides a connected Polity/Geography foundation learning journey and fixes the six concrete backend blockers. It is an engineering foundation for a controlled pilot. It does **not** establish enterprise certification, real-student efficacy, or readiness for an unrestricted public launch.

## One authoritative learning engine

The production frontend uses the `/learning` API. Python authenticates the account, checks learner ownership, starts a database transaction, locks the learner row, and executes the compiled TypeScript kernel. The kernel scores the selected option using server-held content, replays stored evidence, updates beliefs and memory, computes personalization, plans the next action, and returns an explanation and uncertainty ranges. Correct options and kernel content are absent from the connected client bundle before submission.

The browser submits only a command UUID, issued item ID, selected option, confidence, response time, and expected revision. It cannot supply mastery, correctness, curriculum day, or model state. Response time and confidence remain user-observed signals; they are not secure exam-proctoring instruments.

The cognitive executive runs on the server. Its decision history is reconstructed from stored workspaces and observed answer outcomes. The current adapter supports retrieval, supplied teaching content, diagnostic item selection, and topic switches. LLM actions and inferred breaks are disabled in this adapter. Unobserved fatigue and frustration are explicitly reported as unknown. This adapter does not adopt strategies based on simulated learning gains or claim causal intervention effectiveness.

The active frontend offers **UPSC Geography** (UI default) and **UPSC Polity**. Exactly `UPSC Polity` selects Polity content; other supported spaces use Geography foundations. Neither pack is a claim of complete exam coverage. Mentor content review remains necessary: the Polity atoms themselves record `founder+GLM review pass 1` pending the expert-mentor pass.

The old local experience remains available in development. The Python assessment/session endpoints remain for compatibility tests and migration work; they return **410 in production**. Their estimates are not silently combined with TypeScript evidence. Legacy assessment events without versioned batch metadata fail replay with an explicit migration error.

## Security and data consistency

- Bearer authentication and account ownership checks protect every learner, session and receipt resource. Onboarding derives ownership from the authenticated identity, ignoring a supplied user ID. Cross-account resources return 404.
- A signing key of at least 32 bytes is required. There is no development secret fallback. Tokens expire after one hour and validate issuer, audience and required claims. Inactive users are rejected.
- Password hashes include an iteration version; new hashes use PBKDF2-SHA256 with 600,000 iterations. Existing 100,000-iteration hashes remain readable. Email and IP authentication limits are database-backed, with hashed bucket identifiers. The gateway separately limits requests.
- Services and sessions are request-scoped. There is no student hot cache. SQLite development mutations use `BEGIN IMMEDIATE`; PostgreSQL learner/session mutations acquire row locks.
- Events, receipts and snapshots commit together or roll back together. Connected commands persist their evidence, revision, decision response and idempotency record in the same transaction.
- Retrying an identical connected command returns the original response. Reusing its ID with different data or submitting an outdated revision returns 409. A learner can answer only the item issued by the server.
- Python replay recomputes original assessment batches using stored item parameters and confidence, checks numerical convergence, and restores recorded timestamps and provenance. Snapshot restoration preserves all domains, fluency and review metadata.
- Requests have bounded payloads; errors returned to clients omit internal exception details. Logs contain request IDs, methods, status and duration, not tokens, email addresses or student answers. The connected client keeps its token in memory.

## Run locally

From the repository root:

```powershell
npm ci
npm run build:runtime
python -m pip install -r backend/requirements.lock
$env:JWT_SECRET_KEY = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$env:APP_ENV = 'development'
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal at the repository root, run `npm run dev:connected`, then visit `http://127.0.0.1:5174`. Create a test account and start a Polity learning space. Refreshing the page requires signing in again; the server restores the learner's evidence. The offline interface uses `npm -w @techgram/web run dev`.

## Deployment package

`compose.yaml` builds a connected frontend, a non-root Python/Node API, a migration job, and PostgreSQL. Only the gateway is published, on loopback port 8080. Set the empty values in `.env.example` in a private `.env` file: independent random database password and signing key, and a URL-encoded `postgresql+psycopg://techgram:PASSWORD@db:5432/techgram` database URL.

Run `docker compose up --build -d` on a host with Docker. The migration job must succeed before the API starts. Production startup requires PostgreSQL, the expected Alembic revision and the compiled runtime. The gateway proxies `/api` and serves the connected app from the same origin. Configure HTTPS at your chosen ingress before allowing external traffic. Adjust `TRUSTED_PROXY_CIDRS` to the actual private gateway network; only trusted peers can supply `X-Real-IP`, and Nginx overwrites it. Do not publish the API or database ports.

Back up PostgreSQL with `pg_dump`, retain encrypted backups outside the host, and rehearse restore before inviting learners. A restore must recover learning projections and command history together. Baseline schema migration is deliberately non-destructive; destructive downgrade is rejected. Future changes require a new immutable Alembic revision, rather than editing the baseline.

## Validation and release gates

Local validation: kernel/frontend tests, Python integration tests, TypeScript type checking (including the server adapter), connected production build, schema migration comparison and dependency audit. The Python tests cover unauthenticated requests, cross-account access, forged ownership, inactive/expired tokens, rollback, separate-worker updates, exact replay, rate limits, connected scoring, retries, stale revisions, and Polity teaching.

Latest engineering results: **307 JavaScript passes (291 kernel + 16 web); 69 Python passes; one PostgreSQL skip; 120 deprecation warnings**. Type checks and the connected production build passed. Browser QA confirmed sign-in, resuming a persisted learning space, server-scored feedback and the next adaptive question. The earlier simple-client screenshot `connected_learning_qa.jpg` is historical; active illustrated client/recovery checks are in frontend/README.md and connected-qa.json.

GitHub Actions adds a PostgreSQL service, a concurrency check and both container builds. Docker and PostgreSQL are unavailable on the current workstation, so the container build and PostgreSQL test still require CI/staging confirmation. The Node adapter currently starts a subprocess per command and replays up to 5,000 response events; benchmark realistic concurrency and evidence histories before scaling. This is a measured capacity constraint, not a scalability claim.

Before public launch:

1. Execute the PostgreSQL/container CI job and a staging load test; establish latency, error-rate and capacity targets. Validate restart, network-failure and backup-restore behavior.
2. Configure HTTPS, production secrets, database permissions, monitoring and alerts. Review account recovery, email verification and operational incident procedures.
3. Complete mentor content verification and the declared content floor. Expand the connected teaching renderer beyond this initial pilot experience where the curriculum requires it.
4. Run a consented real-student pilot with a registered baseline and delayed retention measurements. Report calibration, learning improvement and return usage separately. Simulator wins do not replace this gate.
5. For institutional contracts, implement the buyer's organization/role model, SSO/MFA, retention/export/deletion policies and audit requirements. Those enterprise-specific capabilities are not implemented by this hardening change.

## Active frontend — 10 October 2026 [ADR-048]

One illustrated journey serves connected and isolated offline preview. Connected learning requires the API; preferences/debrief/notes are persisted on the account. Real lesson controls/SVG/drawing coexist with text-free generated art. Browser read-aloud is optional; speech recognition/free-text tutoring/translation remain unavailable/explained. Full UI/browser verification does not establish institutional certification, complete offline sync or real learning efficacy.


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
