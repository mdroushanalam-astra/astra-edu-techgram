# TECHGRAM — MASTER DOCUMENT INDEX (THE MOTHER DOCUMENT)
## The registry and the law of documentation. Every other document is listed, dated, and bound by the protocol here.

*Last updated: 2026-10-02 ~05:00 · Maintainer: every session that touches the project · If a fact is not in these documents, it does not exist — verify it or register it as unknown. Never invent.*

---

## 1. THE PURPOSE (why this system exists)

Astra Climate could be reconstructed from documents alone. Techgram must have the same property — **stronger**: any future contributor, human or model (even a 2B-parameter one), with ZERO conversation history, must be able to understand the project deeply — the context, the work, the architecture, the philosophy, the vision, every change with time and date, why it was made, what was inferred, what the results were, and what comes next — and continue the work without hallucinating.

This is enforced by three rules:
1. **The protocol (§3)** — after every event, specific documents get updated. No exceptions.
2. **Append-only memory** — the Journal never rewrites history; corrections are new entries.
3. **Evidence over recall** — every number in docs was measured (and is reproducible via §6 of EXPERIMENTS); every change has a registered reason (DECISIONS.md); every document is dated.

---

## 2. THE DOCUMENT MAP

| # | Document | Role | Update trigger | Write mode |
|---|---|---|---|---|
| F | **`FOUNDER_GUIDE.md`** | **The founder's window: the whole project in plain language — idea, philosophy, architecture (translated), journey, results, meaning, next steps, dictionary.** Non-technical readers start here and may need nothing else. | **After EVERY major session or event** | Refresh §5–§8 + date; append, never erase history |
| 0 | **`00_CHARTER.md`** | The soul: vision, philosophy, constitution, commitments. Every other doc defers to it. | Only via a registered ADR (rare, deliberate) | Rewrite sections deliberately; version-note the change |
| 1 | **`CURRENT_STATE.md`** | The living snapshot: what works, what doesn't, next actions. THE technical front door. | **After EVERY session** | Overwrite (it is a snapshot, dated) |
| 2 | **`PROJECT_JOURNAL.md`** | Complete chronological contextual memory: what/why/results/inferences/way-forward per session. | **After EVERY session** (append one entry minimum) | **APPEND-ONLY** — never rewrite or delete entries |
| 3 | **`EXPERIMENTS_AND_TESTS.md`** | Evidence ledger: test campaigns, experiment results, failures, progress charts, reproduction commands. | After every test run / experiment / audit / measurement | Append sections; failures stay recorded forever |
| 4 | **`DECISIONS.md`** | ADR register: every idea/architecture/scope change, why, what was rejected, cost. | Whenever a decision is made or reversed | Append new ADRs; supersede, never erase |
| 5 | **`RESUME.json`** | Machine-readable pointer: position, next actions, gates, invariants — for any model to bootstrap instantly. | **After EVERY session** | Overwrite |
| 6 | **`README.md`** (this file) | Mother index + protocol + last-updated ledger. | **After EVERY session** | Overwrite ledger section; protocol is stable |
| 7.4 | **`08_VISION_LEDGER.md`** | Every original idea → status → the evidence trigger that reopens it. Deferral is a plan, not a loss. | **When a trigger fires or a decision changes** | Deliberate row edits |
| 7.5 | **`COUNTERS.json`** | GENERATED count registry (atoms/items/concepts/tests/commits) — the single source every doc count must match. Regenerate: `npm run counters`. Enforced by the docs-integrity test. | **After every content or test change** | Generated — never hand-edit |
| 7 | `01_COMPLETE_AUDIT.md` | Version-lineage audit (founding reconciliation). | Frozen historical record | Read-only (corrections via DECISIONS) |
| 7.6 | `BACKEND_FREEZE_CHECKLIST.md` | The signed BRAIN FREEZE v0.1 boundary + release ladder + audit evidence [ADR-031]. | On freeze events; re-signed only by founder directive | Frozen boundary — changes need an ADR |
| 8 | `02_NORTH_STAR.md` | Operational north star: identity, design law, Astra-replication, claims. | Only via ADR | Deliberate edits |
| 9 | `03_GOALS.md` | Goals, V1 definition of done, gates, kill/continue criteria. | On gate changes (via ADR) | Deliberate edits |
| 10 | `04_ARCHITECTURE.md` | The build contract: modules, algorithms, invariants, assumptions register. | On architecture changes (via ADR) | Deliberate edits + change note |
| 11 | `05_ROADMAP.md` | Phases, gates, status notes. | On phase transitions | Status notes + deliberate edits |
| 12 | **`06_FRONTEND_BLUEPRINT.md`** | Frontend VERDICT + 7-screen information architecture mirroring the brain organs + 3-wave build plan. | On frontend changes | Deliberate edits |
| 13 | **`07_OPEN_MATERIALS_RESEARCH.md`** | K12 open-materials licensing verdict table + quality principles. What may legally be fed to the brain. | On new source research | Append sections |

**Also in the repo (not part of the doc system):** `kernel/` (the brain) · `backend/` (archived Python prototype — reference only) · root `*.md/.mjs/.txt` (founder's source documents and Nemotron prompt trail — historical).

**The self-sufficiency rule (founder directive, 2026-10-02):** every document must be **inter-explanatory but self-standing** — it explains its own terms (or points to the Founder's Dictionary in `FOUNDER_GUIDE.md` §10), carries its own context, and can be read alone with full comprehension. Cross-links between documents are *directions, not prerequisites*. No document may require another document to be understood.

---

## 3. THE UPDATE PROTOCOL (binding on every session, human or model)

**After every session/event, in this order:**
0. **MODEL STAMP (binding):** record the exact model identity that did the work — provider + model ID + agent runtime (e.g. `GLM-5.3-Flash (Z.ai) via ZCode`) — and the human who directed it, in the Journal entry, every ADR, every experiment campaign, and the ledger row. Never a vague "AI"; never a guessed model name. Multiple models → list each with its role.
1. **PROJECT_JOURNAL.md** — append one entry: *Model / When (date + time) / What we did / Why / What happened (including failures) / What we inferred / Way forward.* Dated. Append-only.
2. **CURRENT_STATE.md** — refresh the snapshot (status table, honest gaps, next actions, risks).
3. **EXPERIMENTS_AND_TESTS.md** — if anything was measured: append the campaign/test results with exact numbers, the model that ran them, and reproduction commands. Failures included, always.
4. **DECISIONS.md** — if any idea/architecture/scope decision was made or reversed: append an ADR with context, decision, rejected alternatives, cost/risk, and who decided (founder + model).
5. **FOUNDER_GUIDE.md** — after every MAJOR session or event: refresh the journey (§5), results (§6), where-we-are (§7), and what's-next (§8) in plain language, and bump the date at the top.
6. **RESUME.json + README ledger (§4)** — bump `updated_at`, position, next_actions; add a ledger row (with model stamp).
7. **04_ARCHITECTURE.md / 05_ROADMAP.md** — only if architecture or phases changed (reference the ADR).

**Anti-hallucination rules:**
- Never write a number you did not measure or cite; never claim a test you did not run.
- Never delete or rewrite Journal/Experiments history; supersede instead.
- If you find a doc contradicting reality: fix reality or the doc, and register the anomaly in EXPERIMENTS §7 (nothing fixed silently).
- If information is missing: mark it unknown with a reason — the Envelope discipline applies to documentation too.

---

## 4. LAST-UPDATED LEDGER

| Date | Session/Event | Model | Docs touched | Journal entry |
|---|---|---|---|---|
| 2026-10-01 → 10-02 ~01:00 | Python prototype built (pre-history) | Founder + Antigravity IDE assistants (IDs unrecorded) + nemotron-3-ultra-550b (analysis) | — (predates system) | Entry 00 |
| 2026-10-02 ~00:30–01:30 | Context absorption; prototype verified 50/50 | GLM-5.3-Flash (Z.ai) via ZCode | memory | Entry 01 |
| 2026-10-02 ~01:30–02:20 | Version-lineage audit; governance docs 01–05 written | GLM-5.3-Flash (Z.ai) via ZCode | 01–05, README v1 | Entry 02 |
| 2026-10-02 ~02:20–04:30 | **Kernel build sprint: TS core complete, 58/58, planner beats baselines** | GLM-5.3-Flash (Z.ai) via ZCode | kernel/*, 05_ROADMAP status | Entry 03 |
| 2026-10-02 ~04:30–05:00 | Living doc system created (Charter, Journal, Experiments, Decisions, CURRENT_STATE, RESUME.json, README protocol) | GLM-5.3-Flash (Z.ai) via ZCode | 00, CURRENT_STATE, JOURNAL, EXPERIMENTS, DECISIONS, RESUME.json, README | Entry 04 |
| 2026-10-02 ~05:00–05:45 | **Founder's Guide created** (plain-language whole-project doc + dictionary); self-sufficiency rule added to all docs; protocol updated | GLM-5.3-Flash (Z.ai) via ZCode | FOUNDER_GUIDE (new), README, cross-link headers, JOURNAL (Entry 05), RESUME.json | Entry 05 |
| 2026-10-02 ~05:45–06:00 | **MODEL STAMP RULE registered** (protocol step 0); stamps retrofitted on all entries/campaigns; end-of-session audit | GLM-5.3-Flash (Z.ai) via ZCode | JOURNAL protocol + entries, README §3/§4, DECISIONS header, EXPERIMENTS header, CURRENT_STATE, RESUME.json, FOUNDER_GUIDE header | Entry 05 (close note) |
| 2026-10-02 ~11:00–11:45 | **External ChatGPT review adjudicated** — ADR-014 (verdict table: ~80% accept / 15% refine / 5% deny) + ADR-015 AOM, ADR-016 four worlds, ADR-017 V1-A/V1-B split + parent report deferred, ADR-018 personalization doctrine (measured behaviour, no labels), ADR-019 terminology honesty. Code deliberately unchanged (founder instruction) | GLM-5.3-Flash (Z.ai) via ZCode | DECISIONS, 00_CHARTER, 02_NORTH_STAR, 03_GOALS, 04_ARCHITECTURE, 05_ROADMAP, FOUNDER_GUIDE, CURRENT_STATE, RESUME.json, README | Entry 06 |
| 2026-10-02 ~11:50–13:00 | **B5.5 AOM + four-world gate IMPLEMENTED** (commits d535e9b, b44fa3c): aom.ts with closed-loop ban in code; planner 100% AOM-sourced; sealed hidden worlds; G0 re-run — planner useful in ALL worlds, edge grows hostile; 77/77 tests; sweep bit-identical regression | GLM-5.3-Flash (Z.ai) via ZCode | kernel/* (aom.ts, planner, receipts, lab, g0 test), EXPERIMENTS §10/§8/§9, DECISIONS (ADR-015/016 → IMPLEMENTED), CURRENT_STATE, RESUME.json, README | Entry 07 |
| 2026-10-02 ~13:00–14:30 | **TEACHING LAYER + FREEZE INSPECTION** (commit c5229c8 + freeze commit): B7 composer, B8 teacher (14 moves, 84 atoms), B10 misconception tiers wired into events, B11 post-mortem + coach, B9 behaviour, runTeachingSession closed loop with injected Responder; 5 build bugs caught & fixed by tests; freeze inspection: 10-day true learning vs control, weak-topic recovery, bit-for-bit replay; **111/111 tests** | GLM-5.3-Flash (Z.ai) via ZCode | kernel/* (composer, teacher, diagnosis, atoms, polity_atoms, teach_loop, postmortem, behaviour, closed_loop + freeze tests, brainlab Act 4), EXPERIMENTS §11, CURRENT_STATE, RESUME.json, README | Entry 08 |
| 2026-10-02 ~14:35–15:10 (cont.) | **PROTOCOL GAP FIX (founder-audited): ADR-020/021 registered, Founder Guide ch.8 added, §7 failure rows + §8 chart columns added** | GLM-5.3-Flash (Z.ai) via ZCode | DECISIONS (ADR-020/021), FOUNDER_GUIDE ch.8, EXPERIMENTS §7/§8 | Entry 09 (close note) |
| 2026-10-02 ~15:15–16:20 | **DOC-INTEGRITY GATE + WAVE-1 BRAIN LAB WEB** (commit aa0c73c): COUNTERS.json generated from code; docs-integrity test; CURRENT_STATE rebuilt (drift fixed — external finding confirmed); 7-screen web app built + browser-verified; Charter/Goals refinements | GLM-5.3-Flash (Z.ai) via ZCode | kernel/test/docs_integrity, scripts/write_counters, apps/brainlab/*, docs/06, 00_CHARTER, 03_GOALS, EXPERIMENTS §13, CURRENT_STATE, RESUME.json, README, JOURNAL | Entry 10 |
| 2026-10-03 ~00:30–01:00 | **ADR-029 allocation-wire DESIGN** (Entry 13): external review adjudicated; Allocation Principle + Agency Transfer + Anti-Goodhart + Ship Mandate registered | GLM-5.3-Flash (Z.ai) via ZCode | DECISIONS (ADR-029), JOURNAL, docs/08 | Entry 13 |
| 2026-10-03 ~01:00–01:30 | **ADR-030 THE ALLOCATION WIRES IMPLEMENTED** (commit c14ce09): behaviour→planner (rest/lighten/load-cap/fatigue/avoidance), agency.ts + agency_observed events, opportunity cost, mismatch minimum, first_independent_decision milestone; 163/163 tests; FOUNDER_GUIDE §7–8 refreshed; Journal Entry-13 heredoc-corruption repaired | GLM-5.3-Flash (Z.ai) via ZCode | kernel/* (agency, planner, receipts, aom, events, validation, social, lab), allocation.test, DECISIONS, EXPERIMENTS §15, JOURNAL 14, CURRENT_STATE, RESUME.json, FOUNDER_GUIDE, docs/08, COUNTERS | Entry 14 |
| 2026-10-03 ~01:30–02:30 | **GATE-0 INSPECTION + BRAIN FREEZE v0.1 SIGNED** (commit 1cc4cf3, ADR-031): 5 real defects found & fixed (approval-provenance gap caught by live probes; unknown-concept replay crash; NaN envelope hole; NaN agency day; dead duplicate agencyIndex); freeze_probes.mts + chaos_injection.test.ts; release ladder + coverage gate + UPSC-adults beta ruling; 174/174 tests; stopped at the FRONTEND DESIGN GATE | GLM-5.3-Flash (Z.ai) via ZCode | BACKEND_FREEZE_CHECKLIST (new), DECISIONS (ADR-031), EXPERIMENTS §16, JOURNAL 15, docs/08 (rows 37–42), CURRENT_STATE, RESUME.json, COUNTERS | Entry 15 |
| 2026-10-03 ~02:00–03:00 | **FRONTEND DESIGN GATE CLOSED — ADR-032** (commit this entry): founder design brief recorded (docs/06 §11); Astra Proposal + 2 ChatGPT reviews adjudicated (§11.1); design LOCKED as Intelligent Sanctuary (quiet chrome / alive core; hologram + blackboard + evidence; presence layer + scene graph; claim-provenance evidence graph; capability-gated voice tiers; watch-it-think law); **Sprint 0 contracts BUILT** (apps/web, 9 tests — 183/183 total) | GLM-5.3-Flash (Z.ai) via ZCode | DECISIONS (ADR-032), docs/06 §11–§12, apps/web/* (contracts+tests), package.json, counters | Entry 16 |
| 2026-10-03 ~03:00–04:00 | **THE SANCTUARY BUILT** (commit 6822c7b): Sprints 1–5 — Astra hologram, living blackboard, session conductor, 5 surfaces, voice tiers, IDB persistence; browser-verified; 183/183; STOPPED AT INSPECTION GATE | GLM-5.3-Flash (Z.ai) via ZCode | apps/web/* (14 files), docs (CURRENT_STATE, RESUME, JOURNAL 17) | Entry 17 |
| 2026-10-03 ~05:45 | **FRONTEND REJECTED ×2 — redesign tomorrow** (Entry 19): founder verdict "still fucked up" on the Warm Room; tomorrow = huge founder-led live redesign (art swap-in first, screen-by-screen, stack open); kernel rails survive; content sprint unaffected | GLM-5.3-Flash (Z.ai) via ZCode | JOURNAL 19, CURRENT_STATE, RESUME.json, docs/06 §13, docs/08 row 38 | Entry 19 |
| 2026-10-04 ~09:00 | **ADR-033 WARM ROOM v3** — two-character system + The Meeting locked (founder concept + 9 ChatGPT refinements adopted); S1 build started | GLM-5.3-Flash (Z.ai) via ZCode | DECISIONS (ADR-033), docs/06 §14, CURRENT_STATE, RESUME.json | Entry 20 |
| 2026-10-04 ~09:00–12:15 | **WARM ROOM v3 COMPLETE — S1–S4** (commits ac96b12, f391c97, 5074bff, 920af72): S1 The Meeting (profile, onboarding A+B, orb, conversation, journey board, handoff) · S2 VoiceIntent + first-class interruption + density control · S3 mood-lit classroom + real kernel loop · S4 the Return (debrief, self-reports, two options + override, Library). Full journey end-to-end, browser-verified; ZERO kernel changes; ADR-033 governs; next = drastic visual/animation pass | GLM-5.3-Flash (Z.ai) via ZCode | apps/web (v3/*, persist/profile, theme, app), DECISIONS (ADR-033), docs/06 §14, JOURNAL 20–23, CURRENT_STATE, RESUME.json | Entries 20–23 |
| 2026-10-02 ~20:20–21:00 | **S2+S3 COMPLETE** — golden replay Worlds A-H, validation surfaces (growth receipt, capability journey, changed-my-mind), inspection gate passed; **144/144 tests** | GLM-5.3-Flash (Z.ai) via ZCode | kernel/* (golden test, validation.ts), EXPERIMENTS §15, CURRENT_STATE, RESUME.json | Entry 12 |
| 2026-10-02 ~19:00–20:15 | **PHASE-A PERSONALISATION CORE** (commit 5036cee): ADR-023 ethics wall + Observable-State Law; ADR-024 Personalisation State v1; ADR-025 Return Model + experiments; ADR-026 sequencing ruling; MEMORY_OPEN; Vision Ledger docs/08; session_started event; 134/134 tests | GLM-5.3-Flash (Z.ai) via ZCode | DECISIONS (ADR-023..026), docs/08 (new), kernel/* (behaviour, teacher, teach_loop, events, experiments, index), 00_CHARTER, 03_GOALS, EXPERIMENTS §14, CURRENT_STATE, RESUME.json, README, JOURNAL | Entry 11 |
| 2026-10-02 ~14:35–15:10 | **AUDIT + K12 RESEARCH + FRONTEND VERDICT** (commit 6eb4466): full audit 116/116 + G0 re-verified; open-materials research (NCERT © — align-never-ingest; Khan/OpenStax/CK-12/PhET CC BY-NC — never ingest; Wikipedia CC BY-SA usable; original authorship = the model) → docs/07; **K12 seed (CBSE Cl-8 Science) fed to kernel — GOAL-AGNOSTICISM PROVEN, zero kernel changes**; frontend VERDICT: green-lit, 2 waves, blueprint docs/06 (7 screens mirroring brain organs, Wave-1 Brain Lab web needs no server) | GLM-5.3-Flash (Z.ai) via ZCode | k12_seed + k12 test, docs/06 + docs/07 (new), EXPERIMENTS §12, CURRENT_STATE, RESUME.json, README, JOURNAL | Entry 09 |

---

## 5. AGENT BOOTSTRAP (for any model, any size, zero context)

You are continuing Techgram. Do exactly this:
1. Read `RESUME.json` — position, next actions, invariants.
2. Read `00_CHARTER.md` — the soul; you may not violate it.
3. Read `CURRENT_STATE.md` — where things stand right now.
4. Read the last 3 entries of `PROJECT_JOURNAL.md` — what just happened and why.
5. Read `04_ARCHITECTURE.md` (the build contract) and `DECISIONS.md` (what changed and why).
6. Run `npm test` — it must be green before you build anything.
7. Work only on the next actions in CURRENT_STATE/RESUME — do not resurrect banned scope (RESUME.json `banned_scope`).
8. **Before finishing, execute the §3 Update Protocol.** A session that writes code but not memory is an incomplete session.

**Non-technical humans (including the founder):** read `FOUNDER_GUIDE.md` only — it explains everything else in plain language, including a dictionary of every technical term.

If anything you read conflicts with something else: Charter > ADRs > Architecture > Roadmap > Journal (Journal is memory, not law). If the conflict is real and load-bearing, register it as a new ADR instead of silently choosing.

---

## 6. THE ONE-LINE COMPASS

> **The brain is the product. Every feature is a slot that asks the brain what to do and renders the answer with a receipt. The LLM is a replaceable voice. The moat starts accruing from the first user's first session. The documentation is the project's memory — keep it true, keep it current, or none of the rest is provable.**
