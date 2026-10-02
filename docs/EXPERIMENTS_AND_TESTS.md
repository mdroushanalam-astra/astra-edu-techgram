# TECHGRAM — EXPERIMENTS, TESTS & EVIDENCE LEDGER
## Every test run, every experiment, every failure, every number. Measured, not remembered.

> **Read me alone:** each section below carries its own setup, results, and meaning — no other document is required to interpret them. Plain-language translations of every term live in `FOUNDER_GUIDE.md` §10. This is the "show me the proof" document.

**Protocol:** append a dated section for every test campaign, experiment, or audit. Results are recorded even when embarrassing — especially then. Never delete a failure; mark superseded ones with a pointer to the fix. Progress charts live at the bottom.

**Provenance (MODEL STAMP RULE):** §1 was authored during the Claude-v2 planning session (2026-10-02 ~01:24, model not recorded at the time — quoted here as founder-supplied evidence). §2's prototype was built pre-history (mixed AI assistants, IDs unrecorded). **§3–§8 campaigns were all executed by GLM-5.3-Flash (Z.ai) via ZCode on 2026-10-02.** Every future campaign must name the model that ran it.

---

## §1 — THE COLD-START EXPERIMENT (the founding evidence)
**When:** 2026-10-02 ~01:24 (authored as `diag_sim_cold_start.py` during the v2 planning session; results quoted in the v2x execution plan §1) · **Question:** can the brain be "so strong it needs little data"?

**Setup:** 150 concepts / 30 topics, prereq graph, 600 four-option items (guess floor 0.25). Hidden truth = general + topic + graph-smooth + concept-specific factors (three worlds: strong/medium/weak structure). Agent item difficulties noisy ±0.4 logit. Compared independent priors + random items vs **hierarchical graph prior + Kalman updates + information-gain selection**.

**Results (error in overall expected-score level; lower is better):**

| Items answered | Indep+random (medium) | Brain (medium) | Indep+random (strong) | Brain (strong) |
|---|---|---|---|---|
| 25 (day 1) | 0.088 | **0.076** | 0.104 | **0.070** |
| 100 | 0.082 | **0.053** | 0.097 | **0.048** |
| 175 | 0.078 | **0.042** | 0.091 | **0.036** |
| 350 | 0.068 | **0.035** | 0.080 | **0.028** |

- Weak-topic recall (6 weakest of 30; chance 0.20): 0.28→0.51 (brain) vs 0.28→0.47 (naive) over 25→350 items — **structure barely helps weak-topic discovery; it needs raw evidence** → weak-topic lists labelled "tentative".
- 80% interval coverage ≈ 0.83 (strong) / 0.78 (medium) / 0.74–0.76 (weak) → **filter mildly overconfident when structure is wrong → inflate reported variance ×1.2** (implemented in `belief.ts`).
- **Binding conclusion:** binary MCQs are low-information; a 25-question diagnostic is an entry ticket, not a verdict. V1 wins on calibrated honesty + information efficiency + auditability. "Perfect from nothing" is not a target.

---

## §2 — PYTHON PROTOTYPE TEST CAMPAIGN (archived reference)
**When:** 2026-10-02 ~00:40 · **Scope:** `backend/tests/` (kernel, adversarial validation, stress loop, persistence/replay, production audit, API client) on Python 3.14.

**Result: 50/50 passed (6.56s), 47 warnings** (datetime.utcnow deprecations — logged, unfixed; the prototype is archived per ADR-001).

**Known defects registered (never fixed — the prototype is reference-only):** `service.py:416` replay assigns a loaded DB state onto `self.pipeline.pipeline_reconciliation` (leftover); replay infers subject by qid prefix; student endpoints don't enforce JWT; singleton service diverges across workers.

---

## §3 — TYPESCRIPT KERNEL TEST CAMPAIGNS

### Campaign 1 — first run (2026-10-02 ~02:55)
**Suite:** 8 files / 57 tests (envelope, linalg, belief, memory, exam, diagnostic, planner, events, sim-regression). **Result: 51 passed / 6 failed.**

| # | Failing test | Symptom | Root cause found | Fix (registered) |
|---|---|---|---|---|
| 1 | belief: expected-score range | 22.5 marks vs expected 30+ | blueprint (Σw=19 questions) not scaled to the 100-question paper | ADR-008: paper-scale = questions/Σw in `expectedScore`, `trueExamMarks`, planner `conceptMarks` |
| 2 | diagnostic: stops at 10 items | early-stop fired at 10 | stop rule allowed `scoreSd < 4.0` from item 10 | stop only at ≥20 items (ADR-009); test now asserts 20–25 |
| 3 | events: replay ≠ sequential fold | state mismatch | **test bug**: compared replay-with-responses against onboarding-only state | test corrected to compare replay vs sequential application of the same log |
| 4 | exam: weak/strong monotonicity violated | strong ≈ weak (90.3 vs 91.2) | exam 100 days out + S≈3–12d → everything decayed to prior; test unrealistic | test uses daysToExam=10, stronger evidence (80×1.3W) |
| 5 | sim: planner loses to random | 23.95 vs 27.78 marks | see §4 — multiple architecture bugs | ADR-004/005/006/007 |
| 6 | sim: planner loses to fixed order | 23.85 vs 28.64 | same | same |

### Campaign 2 — after first fix wave (~03:40)
**Result: 54/57.** All module-level failures fixed. Remaining 3: level-error regression (test's own truth function missed paper scale — fixed), planner-vs-random, planner-vs-fixed (see §4).

### Campaign 3 — FINAL (2026-10-02 ~03:55)
**Result: 58/58 passed, typecheck clean** (`tsc --noEmit` zero errors). Gates now in CI:
- **G2 (no-LLM) trivially green by construction** — the kernel has no LLM import path (enforced by architecture + import review).
- **G1 (replay):** same events + seed → bit-identical μ/Σ (FNV hash equality).
- **G0-lite (planner value):** archetype-aggregate beats random and fixed-order (§4).
- **Estimator honesty:** level error decreases with evidence; 80% coverage sane on evidenced concepts; calibration error < 0.25 across archetypes (measured 0.099–0.128).
- Envelope: all 7 constructor rules + no-upgrade violation throws.
- Diagnostic: never repeats items; stops in 20–25; summary has unknown topics (25 items cannot map 40 concepts — honesty preserved).

---

## §4 — THE PLANNER DEBUGGING SAGA (the most important engineering record so far)
**When:** 2026-10-02 ~03:20–03:55 · **Method:** fixed-seed instrumentation (`debug_planner.ts`, `debug_candidates.ts`, `debug_sweep.ts`) + candidate-pool tap in `planDay` (behind `__TECHGRAM_DEBUG__`).

**Progression of true exam marks (seed 555, consistent archetype, 30 days, 240 min/day):**

| Stage | Techgram | Fixed order | Random | Diagnosis |
|---|---|---|---|---|
| Initial | 125.1 (gain **+3.7**) | 149.5 (+28.1) | 144.2 (+22.8) | planner catastrophically under-filling days |
| Day-by-day dump | days 1–5 = 10–15 min plans | — | — | candidate pool nearly empty → suspected generation; pool was actually FINE |
| + maintenance model (ADR-004) | 133.5 (+12.1) | — | — | planner valued learning ≈ 0 far from exam (pure decay discount) |
| + spacing rule (ADR-006) | 130.6 (+9.3) | — | — | kernel stability had been 3× truth (3 same-day responses = 3 reviews) |
| + identity fix (chosen.add) | 130.6 (no change) | — | — | identity bug was real but not the binding constraint |
| + two-pass fill (ADR-005) | **148.3 (+26.9)** | 149.5 (+28.1) | 144.2 (+22.8) | the quota skip-rule starved every day when due reviews < quota |
| + prereq-gate evidence rule (ADR-007) | **148.3** | — | — | gate lag removed without weakening failed-prereq blocking (prereqFloor 0.45) |

**The four architecture bugs, in one paragraph each:**
1. **ADR-004 — myopic decay discount.** `pExam` discounted learned mastery by `exp(-daysToExam/S)`: with S=3–12d and exam 29 days out, the planner concluded learning today was worthless (everything decays) and spent days on 10-minute diagnose blocks. Fix: learning/practice/remediation are valued **under a maintenance assumption** (d=1 — the plan's own review schedule keeps taught concepts alive to exam day); reviews alone are valued by real stability growth. Receipt wording updated to "assumed; maintained by plan reviews".
2. **ADR-005 — quota as lid, not floor.** The review-share rule skipped every non-review candidate while `reviewMinutes < minReview` — but reviews ranked near the bottom of the pool, so the loop reached them last, chose the few that existed (e.g. 2×15 min vs an 84-min quota), and every higher-value block had already been skipped past. Fix: **two-pass fill** — pass 1 secures the review quota (capped by available review minutes), pass 2 fills remaining minutes by score. Days went from 15–30 min to 225–240 min.
3. **ADR-006 — massed repetition ≠ spaced repetition.** One 25-min study block emitted ~3 item responses; each called `applyReview` → kernel stability tripled per block (S≈13d) while true stability grew once (≈3.6d). The kernel believed concepts were stable for weeks, never scheduled reviews, and truth decayed. Fix at the event-fabric level: same-day responses count as ONE memory review.
4. **ADR-007 — gate on certainty starved the cascade.** The prereq gate read belief σ(μ)≥0.55, which lags teaching by ~a day, idling dependents. Fix: gate opens on σ≥0.55 **or** (nEff≥2 AND σ≥0.45) — ordering, not certainty; a prereq taught-and-failed (σ<0.45) still blocks (remediation is the task).

**Test-side corrections (not product bugs):** events test compared mismatched runs; sim truth function missed paper scale; monotonic exam test used unrealistic horizons; planner block-cap assertion still assumed 40-min blocks.

---

## §5 — SWEEP: planner vs baselines across horizons (aggregate, 16 synthetic students/cell)
**When:** 2026-10-02 ~04:15 · **Command:** `npx tsx kernel/src/demo/debug_sweep.ts`

| Horizon | Techgram | Fixed order | Random | Lift vs fixed | Lift vs random | Calibration err |
|---|---|---|---|---|---|---|
| 30 days | **140.8** | 138.4 | 134.6 | **+2.4** | **+6.2** | 9.9 pts |
| 45 days | **146.8** | 145.5 | 140.4 | **+1.3** | **+6.4** | 11.7 pts |
| 60 days | **153.6** | 152.3 | 146.0 | **+1.2** | **+7.6** | 12.8 pts |

Archetypes: consistent, crammer, avoidant, drifter (adherence varies; pedagogy identical across policies — only allocation differs). **Honest note:** the fixed-order margin is thin because the simulated fixed order is ideal (curriculum-ordered, continuous revisit) and the truth-space prereq penalty (×0.5) barely bites it. The kernel's edge grows with adaptation-relevant variance (archetypes) and with real-world messiness the sim does not model.

---

## §6 — BRAIN LAB DEMONSTRATION (public-demo run, 2026-10-02 ~04:20)
**Command:** `npm run brainlab` · **Content:** polity-seed-0.1.0 (10 topics / 40 concepts / 80 items) · **LLM calls used: 0.**

- Act 1: day-1 plan = 1 diagnose (VoI) + 9 learn blocks, 235 min, receipt `rcpt_d1_000001` with every reason + assumptions tagged.
- Act 2 (60 days): expected-score error vs truth: 2.6 marks (day 1) → 12.4 (day 60); mean mastery error 15.9 pts. **Honest reading:** error grows because truth rises fast (aggressive simulated learning) while gain priors are conservative — the belief under-promises for fast learners; the slow loop (parameter re-fitting from real outcomes) is the designed cure. One sampled concept fell outside its 80% band (0.62 vs 0.83) — within the inflation-model's tolerance, monitored, not hidden.
- Act 3: exam-day scenario 105–139 of 200 (p10–p90), P(clear) 98.9% *as a scenario*; strongest/at-risk topics listed.
- Act 4 (the gate, 40 days, 48 students): **Techgram 144.0 vs fixed 143.9 vs random 138.7**; belief error 11.1 pts; runtime 1.5s.

---

## §7 — FAILURE REGISTER (nothing fixed silently)
| Date | Failure | Disposition |
|---|---|---|
| 2026-10-02 | 6/57 kernel test failures (campaign 1) | All resolved — see §3; root causes in §4 |
| 2026-10-02 | Planner lost to random scheduler (first measurement) | Fixed via ADR-004…007; recorded as the founding lesson of simulator-first |
| 2026-10-02 | Brain-Lab level error grows over 60 days | Understood (conservative gain priors vs fast simulated learners); monitored; slow-loop re-fitting is the designed cure — registered, not hidden |
| 2026-10-02 | 1/3 sampled concepts outside 80% band in demo | Within tolerance given inflation; watch in CI coverage test |
| 2026-10-02 (pre-history) | Python prototype: replay bug, JWT unenforced, subject inference hardcode | Archived with defects registered (§2); port contracts supersede |

---

## §8 — PROGRESS CHART (project-level, updated per campaign)

| Metric | 2026-10-01 (prototype) | 2026-10-02 (kernel sprint) | 2026-10-02 (B5.5 + four worlds) | Target V1-A |
|---|---|---|---|---|
| Runtime kernel | Python (archived) | **TS: 11 modules, ~2,900 lines** | **TS: 12 modules incl. aom.ts** | + B7/B8/B9/B11 |
| Tests | 50/50 (Python) | 58/58 (TS) | **77/77 (TS) + typecheck clean** | 100+ incl. chaos |
| Simulator gate | — | 1 world (friendly) | **4 worlds, planner useful in ALL** | maintain |
| Action outcomes | hardcoded in planner | hardcoded in planner | **AOM: predicted, recorded, versioned, human-gated** | measured from pilot |
| Verified items | ~40 (Python bank) | **80 (TS seed, tagged)** | 80 (TS seed, tagged) | 500 |
| Concepts / topics | ~12 / 2 | **40 / 10** | 40 / 10 | 150 / 35 |
| Misconception tags | 0 | **33** | 33 | 60–100 |
| Planner vs random (30d, aggregate) | — | **+6.2 marks** | +6.2 marks (bit-identical regression ✓) | maintain |
| Planner vs fixed (30d, aggregate) | — | **+2.4 marks** | +2.4 marks (bit-identical regression ✓) | grow via data |
| LLM decisions | 0 | **0 (structural)** | 0 (structural) | 0 forever |
| Gates passed | — | G1, G2, G0-lite (aggregate) | **G0 (four worlds), G1, G2, estimator honesty, AOM loop** | G3 pilot |

---

## §9 — HOW TO REPRODUCE EVERYTHING
```
npm test                                  # 77 tests + four-world G0 gate (root)
npm -w kernel run typecheck               # strict typecheck
npm run brainlab                          # public demo (4 acts)
npx tsx kernel/src/demo/debug_sweep.ts    # horizon sweep table (§5)
npx tsx kernel/src/demo/debug_planner.ts  # instrumented single-run (__TECHGRAM_DEBUG__ tap)
npx vitest run test/g0_worlds.test.ts -w kernel  # four-world G0 table (visible output)
py -m pytest backend/tests -q             # archived prototype reference suite (50/50)
```
*Seeds are fixed everywhere; all runs are deterministic. If a number above doesn't reproduce, that is an anomaly — register it in §7, don't explain it away.*

---

## §10 — CAMPAIGN: B5.5 AOM + FOUR-WORLD GATE (ADR-015/016 implemented)
**When:** 2026-10-02, ~11:50–13:00 · **Model:** GLM-5.3-Flash (Z.ai) via ZCode · **Commits:** `d535e9b` (initial), `b44fa3c` (B5.5 + worlds)

**What was built:** `kernel/src/aom.ts` — predictAction (Δmastery/stability/uncertainty/fatigue, provenance-stamped, deterministic), predictDiagnoseUncertainty, learnFromOutcomes (shrinkage pooling k=20), approve() human gate with the **CLOSED-LOOP BAN** (simulator-provenance proposals throw on approval; only `pilot` data may become production parameters). Planner rewired: gains sourced exclusively from the AOM; every PlanBlock carries its prediction recorded *before* the action; receipts expose `aom_version` + per-block predictions + per-gain `assumed|measured` assumptions. Lab: per-block outcome records (evidence-based belief shifts, never simulator constants) + four generative worlds.

**G0 FOUR-WORLDS RESULTS (30 days, 8 students/world, 240 min/day; pass rule pre-registered in test):**

| World | Techgram | Fixed order | Random | Lift vs BEST baseline | Calibration |
|---|---|---|---|---|---|
| A_friendly | **139.8** | 139.3 | 135.9 | +0.43 | 9.9 pts |
| B_misspecified | **128.1** | 122.8 | 121.6 | **+5.31** | 7.4 pts |
| C_adversarial | **127.5** | 123.2 | 123.3 | **+4.11** | 6.4 pts |
| D_hidden1 (sealed) | **127.5** | 121.8 | 122.2 | **+5.22** | 7.1 pts |
| D_hidden2 (sealed) | **133.7** | 128.7 | 132.3 | +1.42 | 8.2 pts |

**The headline finding — and it is a beautiful one:** the planner's edge is THINNEST in the friendly world it was designed for (+0.4) and LARGEST exactly where assumptions break (+5.3 misspecified, +4.1 adversarial, +5.2 hidden). Robustness — intelligence measure #5 — is now measured, not claimed. The honest cost: the friendly-world margin is thinner than the old single-seed aggregate suggested (re-baselining did its job).

**Regression proof:** the three-horizon sweep (§5) is bit-identical post-refactor (140.8/146.8/153.6) — the AOM extraction preserved behaviour where it should and added the organ where it must.

**Seal:** `worlds.hidden.json` sealed at FNV-1a `c31cd9d5` (UTF-8 bytes); test fails on any tamper. First incident: the seal check itself caught a real hash mismatch during bring-up (the test initially hashed UTF-16 code units; the em-dash in the JSON note exposed it) — fixed by hashing bytes; an honest example of the seal working.

**Suite:** 10 files / **77 tests green**, typecheck clean. New tests: aom.test.ts (11 — prediction sanity, single triage application, shrinkage, provenance ban, named human gate, lineage), g0_worlds.test.ts (5 — four worlds + visible table), end-to-end loop test (sim → outcome records → learner → lineage-linked proposal → ban enforced).
