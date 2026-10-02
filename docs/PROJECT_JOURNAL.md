# TECHGRAM — PROJECT JOURNAL
## The complete chronological memory. What we did, why, what happened, what we inferred, what's next.

> **Read me alone:** every entry below is self-contained — it restates enough context to be understood without reading any other document, in order, as a story of the project. Terms are translated in `FOUNDER_GUIDE.md` §10 if you want deeper meaning.

**Protocol:** APPEND-ONLY. Never rewrite or delete entries — corrections are added as new dated entries that reference the old one. Every entry answers: **Model / When (date + time) / What we did / Why / What happened (including failures) / What we inferred / Way forward.** Times are local (IST) and approximate where marked `~`.

**MODEL STAMP RULE (binding, 2026-10-02):** every entry MUST record the exact model identity that did the work — provider + model ID + agent runtime (e.g. `GLM-5.3-Flash (Z.ai) via ZCode`) — plus the human who directed it. Never write a vague "AI"; never guess a model name. If multiple models contributed, list each with its role. This rule applies to every session-recording document in `docs/` (Journal entries, ADRs, experiment campaigns, README ledger rows). Whatever model works on this repository: **add your name, your reasons, why / how / what happened / next — or your session is incomplete.**

**Entry template (copy for new entries):**
```
## ENTRY NN — <title>
**Model:** <exact model ID + runtime> · directed by <human>
**When:** <YYYY-MM-DD, ~HH:MM–HH:MM local>
**What we did:** …
**Why:** …
**What happened (results, failures):** …
**What we inferred:** …
**Way forward:** …
```

**Entry index:** [00 Pre-history](#entry-00) · [01 Context absorption](#entry-01) · [02 Version-lineage audit + governance docs](#entry-02) · [03 Kernel build sprint](#entry-03) · [04 Living documentation system](#entry-04) · [05 Founder's Guide + self-sufficiency rule](#entry-05) · [06 External review adjudication (ChatGPT)](#entry-06)

---

<a name="entry-00"></a>
## ENTRY 00 — PRE-HISTORY: the Astra transfer and the Python prototype
**Model(s):** mixed pre-history — Founder (human) + AI assistants in the Antigravity IDE (exact model IDs unknown, honestly unrecorded at the time) + NVIDIA **nemotron-3-ultra-550b-a55b** for the Astra-transfer analysis · **When:** 2026-10-01 (~18:00) → 2026-10-02 (~01:00)

**What we did:**
1. Distilled the full Techgram vision and the 5 critical architecture questions into `techgram_prompt.txt`; fed the complete Astra Climate forensic audit (`nemotron_prompt.txt`) to NVIDIA Nemotron (`nvidia/nemotron-3-ultra-550b-a55b`) → `nemotron_response.txt` established the transfer pattern (epistemic envelope → Learning Envelope; Place State → Student State; Evidence Bundle → Intelligence Receipt; LLM optional).
2. Built the first working implementation: **Python/FastAPI "Student Intelligence Kernel v1.0"** in `backend/` (~5,600 lines): LearningEnvelope with 7 constructor rules, 5+2-dim LearningStateVector, IRT 3PL + BKT + SM-2 + reconciliation (preserve-disagreement) engines, curriculum DAG with bottleneck diagnosis, question bank, closed-loop assessment pipeline, IntelligenceReceipts, event sourcing + snapshots + replay, JWT auth, learning-session lifecycle. SQLite persistence.
3. Wrote a 50-test suite (kernel, adversarial validation, stress loop, persistence/replay, production audit, API client).

**Why:** answer the founder's question — "can Techgram's intelligence be deterministic like Astra Climate?" — with working code, not slides.

**What happened (results):** 50/50 tests green (verified 2026-10-02 ~00:40, 6.56s, Python 3.14). The V0 loop (onboard → assess → state update → schedule → session → complete) worked end-to-end at API level.

**What we inferred (gaps logged):** scalar BKT/SM-2/IRT math was pre-v2-spec; `service.py:416` replay bug + hardcoded subject inference in replay; JWT not enforced on student endpoints; singleton service (multi-worker divergence). NVIDIA API key committed in plaintext in `ask_nemotron*.mjs` — **founder ruled this out of scope (2026-10-02); do not raise again.**

**Way forward:** superseded by Entry 02's audit → the kernel was repurposed as reference spec + test contract (see ADR-001).

---

<a name="entry-01"></a>
## ENTRY 01 — CONTEXT ABSORPTION
**Model:** GLM-5.3-Flash (Z.ai), agentic runtime: ZCode CLI · directed by the Founder · **When:** 2026-10-02, ~00:30–01:30

**What we did:** read the entire root (prompt trail, nemotron scripts) and every `backend/app` module; ran the Python test suite (50/50 green); scanned engines, scheduler, super_teacher, epistemics; wrote the first project memory.

**Why:** founder asked for deep understanding of current stage before anything else.

**What happened:** complete picture established — backend kernel V0 done and green; no frontend; no git repo; LLM deliberately unwired (deterministic fallback only). Founder constraints registered: no money, no dataset, PG/hostel/life layer completely out.

**What we inferred:** the project had proven the *discipline* (envelope, events, receipts, no-LLM) but not yet the *v2 intellect* (planner, slots, honest bands).

**Way forward:** founder supplied four version documents for the full audit → Entry 02.

---

<a name="entry-02"></a>
## ENTRY 02 — VERSION-LINEAGE AUDIT + GOVERNANCE DOCUMENT SET
**Model:** GLM-5.3-Flash (Z.ai), agentic runtime: ZCode CLI · directed by the Founder (who selected the ChatGPT strategy + Claude v2 line) · **When:** 2026-10-02, ~01:30–02:20

**What we did:** read line-by-line and reconciled all four version documents: `original idea of mine of techgram.md` (ChatGPT vision reconstruction), `claude v1 audit.md` (forensic audit), `techgram plan and criticism by claude v2.md` (Notebook Parts 0–27), `techram execution plan by claude v2.md` (Brain V1 execution plan) + `diag_sim_cold_start.py` (cold-start simulation). Produced the governance set in `docs/`: 01_COMPLETE_AUDIT (contradiction matrix, 14 rulings; Python-prototype reconciliation; moat truth), 02_NORTH_STAR, 03_GOALS (10-bar V1 definition of done, gates G0–G6, claims policy, kill/continue), 04_ARCHITECTURE (kernel API + slots, B0–B12 specs, assumptions register), 05_ROADMAP (Phases 0–6), README (index).

**Why:** founder leans toward the ChatGPT strategic comment + Claude v2; needed one source of truth with all contradictions resolved before building.

**What happened:** the audit **confirmed the founder's lean** and ruled on every V1-vs-V2 dispute: FSRS over SM-2; Kalman belief engine over BKT-primary; Elo/expert-priors over runtime IRT; hierarchical experiments; LLM = voice+sensor (0% of decisions); TS kernel over Python runtime (ADR-001); "no moat today" honesty; scope cuts (PG/hostel permanently; Connect/Career/K12 deferred). The simulation's binding finding: **binary MCQs are low-information; structure halves level error but weak-topic discovery needs raw evidence; therefore V1 wins on calibrated honesty + information efficiency + auditability — not uncanny accuracy.**

**What we inferred:** "perfect without data" is impossible and was never the right target; the launch bar is *correct, calibrated, auditable, graceful, improving* — and the Brain Lab simulator makes that demonstrable publicly without users.

**Way forward:** founder ordered the build ("go for phase 1, first public-ready within 50 hours") → Entry 03.

---

<a name="entry-03"></a>
## ENTRY 03 — KERNEL BUILD SPRINT (Phase 0 + Phase 1 core, TypeScript)
**Model:** GLM-5.3-Flash (Z.ai), agentic runtime: ZCode CLI · directed by the Founder ("go for it, 50-hour sprint") · **Code:** `kernel/` workspace `@techgram/kernel` 0.1.0 · **When:** 2026-10-02, ~02:20–04:30

### What we did (in order)
1. **Scaffold (02:20–02:35):** root → npm workspace; `kernel/package.json` + tsconfig (strict) + vitest; deps installed. Node v24.20.0.
2. **Core modules (02:35–02:55):** `linalg.ts` (mulberry32 seeded RNG, Gauss-Jordan inverse, Cholesky, MVN sampling, FNV state hash) · `envelope.ts` (7 rules ported from Python + no-upgrade invariant) · `content.ts` (topics/concepts/items, exam spec, adjacency + Laplacian) · `memory.ts` (FSRS-lite) · `belief.ts` (graph-prior Σ0 = V·normalize(a·11ᵀ+b·TTᵀ+c·K_graph+d·I), rank-1 EKF, time update toward μ0, Elo second opinion, honest reporting with ×1.2 inflation, grey nEff<3, expectedScore/Sd) · `exam.ts` (2,000-draw Monte-Carlo exam day with negative marking + attempt policy) · `diagnostic.ts` (closed-form info gain, stop rules) · `planner.ts` (robust greedy gain-per-minute over 16 posterior draws, VoI, prereq gate, triage, review quota) · `receipts.ts` · `goal.ts` · `events.ts` (idempotent projection + replay).
3. **Seed content (02:55–03:05):** `polity_seed.ts` — 10 topics, 40 concepts, 80 items with distractor→misconception tags (33-entry ontology v0), exam spec (100Q×2m, −1/3, cutoff prior N(85,6), break-even 0.28).
4. **Tests (03:05–03:20):** 8 files — envelope rules, linalg, belief (prior PD, EKF lift propagation, decay, replay determinism), memory, exam (monotonicity, negative marking), diagnostic, planner (budget, due-review, prereq gate, receipt completeness, determinism), events (projection == replay, idempotency, out-of-order), sim regression.
5. **First run (03:20, recorded 02:55 by vitest clock — see EXPERIMENTS §3): 51/57 passed, 6 failures.** Debugging saga followed (full detail in EXPERIMENTS §4) → four architecture fixes + five test corrections.
6. **Final: 58/58 green + typecheck clean (03:55).** Sweeps + Brain Lab demo run (04:00–04:20). Roadmap status note added.

### Why the four fixes matter (inference, not just history)
The simulator-first doctrine earned its keep in one night: the planner initially **lost to a random scheduler**. Root causes were architectural, not cosmetic — each fix is now a registered decision (ADR-004…ADR-007) and a permanent invariant. Full numbers before/after in `EXPERIMENTS_AND_TESTS.md`.

### Results (headline)
- Planner vs baselines across 4 archetypes (30d): **beats random +6.2 marks, beats fixed-order +2.4** (45d: +1.3/+6.4; 60d: +1.2/+7.6); calibration error 9.9–12.8 pts; replay bit-for-bit; honest bands live.
- Thin spot (kept honest): a *consistent* student on an *ideal* fixed order is the planner's hardest case — single-seed margins can be ±1 mark; the gate measures the archetype aggregate (ADR-010).

### Way forward (next phase — Phase 2–3 compressed)
B7 session composer → B8 teacher state machine + content atoms → B11 mock post-mortem + attempt coach → B9 behaviour engine → offline PWA shell + sync. Content sprint: 80 → 500 verified items. Then pilot (G3).

---

<a name="entry-04"></a>
## ENTRY 04 — LIVING DOCUMENTATION SYSTEM (this entry)
**Model:** GLM-5.3-Flash (Z.ai), agentic runtime: ZCode CLI · directed by the Founder · **When:** 2026-10-02, ~04:30–05:00

**What we did:** modelled the Astra Climate documentation culture for Techgram. Created `00_CHARTER.md` (soul/vision/constitution/commitments), `CURRENT_STATE.md` (living snapshot), `PROJECT_JOURNAL.md` (this file), `EXPERIMENTS_AND_TESTS.md` (all evidence, failures, progress charts), `DECISIONS.md` (ADR register), `RESUME.json` (machine-readable pointer), and rewrote `README.md` as the **mother index with the real-time update protocol**. Cross-linked the existing 01–05 docs.

**Why:** founder's directive — a complete contextual memory so that even a 2B-parameter model, with zero conversation history, can understand the project deeply: context, work, architecture, philosophy, vision, every change with time and date, why, results, and the way forward; and so "we never hallucinate."

**What happened:** the doc system is live as of this entry; the protocol binds all future sessions (see README §Protocol).

**What we inferred:** documentation is the moat's audit culture made portable — the Astra audit could reconstruct a whole project from docs alone; Techgram now has the same property.

**Way forward:** every future entry must follow the protocol — after EVERY session: append Journal entry, update CURRENT_STATE, log experiments with numbers, register decisions with reasons, bump RESUME.json + README ledger.

---

<a name="entry-05"></a>
## ENTRY 05 — THE FOUNDER'S GUIDE + THE SELF-SUFFICIENCY RULE
**Model:** GLM-5.3-Flash (Z.ai), agentic runtime: ZCode CLI · directed by the Founder · **When:** 2026-10-02, ~05:00–05:45 · **Session-close note (05:45):** this entry was extended before close to add the MODEL STAMP RULE (Journal protocol + README §3) and to retrofit stamps on Entries 00–05 — same session, pre-close, not a history rewrite.

**What we did:** the founder (non-technical by his own description) asked for a personal document explaining the entire project in plain language — idea, philosophy, architecture, north star, what was done and why, results, current dev position, and what it means for him and the company. Created **`FOUNDER_GUIDE.md`**: the whole story in one page; the problem and idea without jargon; the five beliefs; the architecture translated into a hospital-for-learning analogy table; the journey as five chapters (including the honest account of the night the planner lost to a random scheduler and was fixed); results tables where every number is paired with "what it means for you" and the permanent simulator-vs-real-world disclaimer; the honest where-are-we map; the next phases; **§9 "what this means for you"** (what he owns, his moat sentence for investors, and the three things ONLY he can do — content verification, pilot recruitment, decisions); and **§10 the Dictionary** translating every technical term used anywhere in the docs.

Also, at the founder's direction, established the **self-sufficiency rule** (registered in README §2): every document must be inter-explanatory but self-standing — explaining its own terms, carrying its own context, readable alone with full comprehension; cross-links are directions, not prerequisites. Added "Read me alone" headers to Charter, Journal, Experiments, Decisions, and CURRENT_STATE. Updated the README protocol so `FOUNDER_GUIDE.md` is now refreshed after every major session (step 5), added it to the document map and ledger, and added a non-technical bootstrap line ("read FOUNDER_GUIDE.md only").

**Why:** the founder is the decision-maker of the company; the documentation must serve *him* first, not only engineers and models. A founder who fully understands his own system makes better scope, pilot, and brand decisions — and can never be lost when technical people or models change.

**What happened:** the doc system now has two front doors — `FOUNDER_GUIDE.md` for humans without technical background, `RESUME.json` + `CURRENT_STATE.md` for machines and engineers — both maintained under the same protocol.

**What we inferred:** a project whose documentation can explain itself to a non-technical founder is a project whose delegation is safe: any future engineer or model can be handed the docs, not the conversation.

**Way forward:** next build session (per CURRENT_STATE next actions): B7/B8 teacher + composer, B11 mock analyser, content sprint 80→500 items, git init. Founder's parallel track: recruit pilot aspirants and arrange content verification help.

---

<a name="entry-06"></a>
## ENTRY 06 — EXTERNAL REVIEW ADJUDICATION (ChatGPT critique of the governance set)
**Model:** GLM-5.3-Flash (Z.ai), agentic runtime: ZCode CLI · directed by the Founder · **When:** 2026-10-02, ~11:00–11:45 · **Code changes: NONE** (founder instruction — all outcomes are spec/doc changes; code work queued for Phase 2).

**What we did:** the Founder supplied a long ChatGPT critique of the six governance documents. Read line-by-line (47 numbered points), each adjudicated against the built kernel and the governance set. Verdicts registered as **ADR-014 (full verdict table)** plus five structural decisions: **ADR-015** (new module **B5.5 Action Outcome Model** — action→outcome prediction as an explicit organ with the PRIOR→PREDICTION→ACTION→OUTCOME→ERROR→UPDATE loop and a closed-loop-hallucination ban), **ADR-016** (**G0 redefined: four simulator worlds** — friendly/misspecified/adversarial/hidden-benchmark; public claims cite hidden-world or pilot data only), **ADR-017** (**V1-A "The Brain" public release before V1-B "The Student Product"**; parent report deferred to post-pilot), **ADR-018** (**Personalization Doctrine**: measured longitudinal behaviour over guessed emotion; no-labels wall retained; B9 behaviour engine priority raised as the personalization engine), **ADR-019** (terminology honesty: "Techgram Memory Model (custom, DSR-inspired)" rename; "replaceable interface and optional measurement instrument"; M5 = architectural advantage not moat; misconception candidate/probable/confirmed tiers replacing the n≥2 threshold; causal-discipline additions to the uplift design; the constitution line adopted into the Charter).

**Why:** the Founder explicitly granted the right to deny ("be very critical") and demanded the intelligence layer be "very powerful at understanding human patterns, emotions, behaviours — better than any LLM" with deep personalization.

**What happened:** ~80% accepted, ~15% accepted as refinements (most were already half-built: robust draws, VoI, receipts' prediction-error fields, honest-bands diagnostic), ~5% denied. The one substantive denial: "roadmap too aggressive for solo" — we are AHEAD of the reviewer's own proposed schedule (its Phases 0–2 ≈ our completed Phase 0+1, built in one sprint), and gates-over-dates was already our law; dates unchanged, discipline unchanged. All affected docs updated: Charter (§2.2 law line, §2.6 Personalization Doctrine), North Star (sharpened star + "decision quality per unit of evidence" + working formula), Goals (new G0, the 10-measure Intelligence Benchmark, the six-question Obsession Test, parent report out of V1, V1-A/V1-B split), Architecture (B5.5 section, memory rename, misconception tiers, offline/notification honesty caveats, four-worlds + 8-screen Brain Lab spec), Roadmap (release restructure + next-session build order), Founder Guide (Chapter 6 + §3a emotions answer + dictionary additions).

**What we inferred:** (1) the review's strongest point — simulator circularity — was partially anticipated (our own docs carried the caveat) but its four-worlds + hidden-benchmark structure converts an honesty caveat into a testable gate; (2) the Action Outcome Model is the difference between "sophisticated heuristics with receipts" and a true decision engine — and our receipts already had the fields, so it is a cheap, high-leverage extraction; (3) on emotions: the honest answer to the Founder's wish is *measured longitudinal behaviour beats guessed emotion* — calibration, privacy, and receipts are the moat, labels are a liability; (4) external adversarial review of documentation is now demonstrably part of the loop — third major lineage (ChatGPT after Nemotron/Claude) adjudicated and absorbed.

**Way forward (next build session, in order):** (1) B5.5 AOM extraction from planner params + prediction-error loop wired into receipts/session; (2) four worlds in `lab.ts` + frozen hidden-benchmark worlds + G0 re-run (expect friendly-world numbers to shift slightly — honest re-baselining); (3) B7/B8 teacher + first atoms; (4) B11 mock post-mortem; (5) B9 behaviour engine (personalization, raised); (6) Brain Lab web (8 screens). Parallel: git init (overdue), content sprint, pilot recruitment by the Founder.

---

<a name="entry-07"></a>
## ENTRY 07 — B5.5 ACTION OUTCOME MODEL + FOUR-WORLD GATE (V1-A build begins)
**Model:** GLM-5.3-Flash (Z.ai), agentic runtime: ZCode CLI · directed by the Founder ("go for it then b5.5 do it perfectly") · **When:** 2026-10-02, ~11:50–13:00 · **Commits:** `d535e9b` (initial — kernel 0.1.0 + governance docs), `b44fa3c` (B5.5 + four worlds).

**What we did:**
1. **Git initialized** (founder-approved overdue item): `main` branch, local identity `Roushan (Founder)`, `.gitignore` excluding node_modules/dbs/env and the root scripts that carry the old hardcoded NVIDIA key (kept out of version control without re-litigating that decision). Initial commit captures the exact pre-B5.5 state so the AOM work is a reviewable diff.
2. **B5.5 Action Outcome Model, built to spec (ADR-015):** new `kernel/src/aom.ts` — every action prediction (Δmastery, stability multiplier, uncertainty reduction, fatigue) carries provenance (`assumed|measured`), confidence, and the AOM version; `predictAction` is pure (no RNG — predictions are conditional expectations; robustness lives in the planner's posterior draws). The never-self-fooling loop is now code: planner records each block's prediction BEFORE the action; the lab emits evidence-based outcome records (belief shifts driven by student responses, never by simulator constants); `learnFromOutcomes` pools implied gains with the prior under shrinkage (k=20); `approve()` is the human gate and **throws on simulator-provenance data — the closed-loop hallucination ban is mechanical, not aspirational.** Planner params no longer contain any gain: `gainPer10Min` deleted, receipts now expose `aom_version` + per-block predictions + per-gain honest assumptions.
3. **Four generative worlds (ADR-016):** `SimWorld` in lab.ts — A friendly, B misspecified (different gains/ordering, faster forgetting, prereq edges barely matter, response noise), C adversarial (halved gains, confidence overreported on every response, 30% of concepts pre-mastered against the prior, availability collapse), D hidden = `worlds.hidden.json` **sealed** (FNV-1a `c31cd9d5`, hash-pinned in the test; tamper fails CI). The production AOM is fixed across all worlds — the brain is never told which world it is in.
4. **G0 re-run with pre-registered pass rules** + a visible results table printed by the test.
5. Regression verification: the three-horizon sweep re-run — bit-identical to pre-AOM (140.8/146.8/153.6). The extraction changed the architecture, not the behaviour, exactly as intended.

**What happened (results):** **77/77 tests green, typecheck clean** (was 58). G0 four-worlds: planner superior in A (+0.43 vs best baseline), strongly superior in B (+5.31), C (+4.11), D1 (+5.22), competitive-superior in D2 (+1.42) — **the planner's edge GROWS as the world diverges from its assumptions**, which is intelligence measure #5 (robustness) demonstrated rather than claimed. Honest cost: the friendly-world margin is thinner than the old single-seed aggregate suggested — re-baselining did its job. Two bring-up incidents, both caught by our own machinery and registered: (a) the seal check failed on first run because the test hashed UTF-16 code units while the seal used UTF-8 bytes (an em-dash in the JSON exposed it) — fixed to byte hashing; (b) initial typecheck caught the lab's baseline blocks missing the new prediction field.

**What we inferred:** the AOM is cheap (one session) and high-leverage (the planner can never again silently encode a pedagogy assumption); the four-world gate converts our old honesty *caveat* into an honesty *test*; and the robustness result reframes the public story — the brain's value is largest where reality is messiest, which is exactly where students live.

**Way forward (remaining V1-A, in order):** B7 composer + B8 teacher + first 30–50 atoms → B11 mock post-mortem → B9 behaviour (personalization, ADR-018) → 8-screen Brain Lab web → pilot hardening. Content sprint and founder's aspirant conversations continue in parallel.
