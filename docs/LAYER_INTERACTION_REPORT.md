# THE LAYER INTERACTION REPORT
## 24 real-time student simulations. Every layer watched working. Every layer's influence measured by removing it.

**When:** 2026-10-04, ~16:55–17:10 · **Model:** GLM-5.3-Flash (Z.ai) via ZCode · directed by the Founder (Roushan) · **Commits:** this commit
**Companion:** Phase 6 demo (`kernel/src/demo/demo6.ts`, ADR-044) · **Raw data:** `docs/LAYER_STUDY_RESULTS.json` · **Reproduce:** `npx tsx scripts/run_layer_study.mts` (~0.2 s) · **Permanent gate:** `kernel/test/layer-study.test.ts`

---

# PART I — IN SIMPLE WORDS (for everyone)

## What you asked, and what this is

You asked: *test each layer of Techgram to know exactly how it functions — run 20–30 real-time simulations of student interaction, with different mindsets, knowledge and behaviour, and check how each layer interacted in real time.* This report is that.

We built two things:

1. **A live recorder.** During every simulated session, each "layer" of the machine — the senses, the understanding (belief engine), the workspace, the self-predictor, the decision-maker (Executive), the self-error notebook, the plan builder, the conductor, the speaking voice — writes down what it did on every single turn. 1,152 turns recorded across 24 students.
2. **A removal switch.** Watching layers work shows *choreography*; to learn *influence*, we re-ran each student's session with one layer's contribution disconnected, and counted how many decisions actually changed. Influence you can measure, not guess.

## The 24 students

Every kind of person we could think of: the fresh novice (knows nothing, calm), the anxious novice, the steady middle (the control), the overconfident one, the streaky one, the one who tires in minutes, the advanced-and-quick, the marathoner with poor sleep, the night-before crammer, the slow grinder, the gifted impatient one, the distracted answerer, exam panic, the confident novice (maximal miscalibration), the inconsistent coin-flipper, a spiky half-mastered map, and three "chaos" combinations — two of them on the CBSE Class 8 curriculum to prove the same machinery runs a different subject. Each student ran a 6-day, 48-turn stretch of real sessions.

## What we saw in real time (the choreography)

- **The self-predictor (S1) spoke before EVERY single one of the 1,152 decisions** — the machine literally predicts its own behaviour before acting, every time. That is the law working.
- **The self-model was consulted on 97% of decisions** — after the first few errors, every decision carried "what I know about myself."
- **The self-error notebook caught something on 63% of turns** — the machine's expectations and the student's reality disagreed constantly, and every disagreement was recorded.
- **The contract/ethics wall blocked candidates on 87% of turns** — mostly pacing rules ("too soon after the last intervention"); the machine's restraint layer is the busiest layer of all.
- **The voice spoke on 82% of turns, offered an earned self-correction on 20%, and praised on only 7%** — talkative about evidence, stingy with praise, exactly as designed.
- **The physiological wall forced rest 121 times** across the study.

## What we learned by removing layers (the influence table)

| If you disconnect… | …this % of decisions change | Effect on the final score |
|---|---|---|
| **The whole Executive** (vs the old linear teacher) | **84.6%** | +1.5 marks on average (23 wins, 1 tie, **0 losses**) |
| **The belief engine's aiming** (decisions become belief-blind) | **82.9%** | −0.42 marks |
| **The physiological wall** (no forced rest at high fatigue) | **15.4%** (up to 65% for exam-panic) | −0.71 marks |
| **The self-model's live levers** | 0% in these regimes | 0 here — its influence lives in the S4 improvement path (proven in EXPERIMENTS §18) |

**The honest reading:** the machine's edge is carried by two shoulders — *the belief engine's aiming* (which concept to touch next) and *the physiology wall* (rest at the right moment). The self-knowledge layer works as designed — it watches, records, consults — but in these short, conservative regimes its levers rarely had a margin to flip a decision; where it CAN flip them (the S4 improvement path), it was already proven with counterfactuals. We record the 0% because it is true, not because it is comfortable.

**Three snapshots from the real-time traces:**

- **t16, Exam panic** (arrives half-tired, anxious): the wall fired on 65% of decisions once disconnected — meaning for this student, forced rest IS the strategy. Accuracy 33% vs the teacher's 19%; the machine won by +1 mark and had the best calibration of the study (0.17).
- **t14, Gifted and impatient**: the biggest targeting payoff — the teacher's fixed order got 6% accuracy (it drilled what the gifted student already knew); the machine's aiming hit 34% and won by +3.
- **t18, Humble advanced**: cleanest signals → the machine's belief error 0.17 vs 0.40, accuracy 76% vs 48% — when the evidence is clean, the engine is close to the truth and it shows.

## What this means (and doesn't)

**It means:** we can now point at any decision the machine makes and name, layer by layer, which organs shaped it and what happens if any of them goes quiet. The architecture is not a black box even to us — it is a measured pipeline. The same code ran two different curricula (UPSC Polity and CBSE Class 8) without a single change.

**It doesn't mean:** real students behave like these 24 declared models. The simulation worlds have declared rules; real humans will surprise us. That remains the pilot's job. Also: the self-model's live-lever contribution being 0% here is a finding about THESE regimes (short, conservative, gap-locked), not about the layer's worth.

---

# PART II — TECHNICAL REPORT

## 1. Method

**Instrumentation.** `kernel/src/lab/layer-trace.ts` runs the full stack through the TechgramWorldAdapter [ADR-043] and records a `LayerTurnTrace` per turn:

```
sensor (fatigue, streak, last outcome)
→ belief (frozen engine: target mean/grey, uncertainty count)
→ workspace (turnsRemaining, contract counters)
→ S1 self-prediction (count, categories) — emitted BEFORE the decision
→ C1 executive (directive, confidence, candidate set, constraintsApplied,
   deviation-from-incumbent, insightsInjected, self-model candidate)
→ ExperiencePlan (6 channels) → Conductor (steps)
→ Expression (utterance count/kinds, self-correction, praise, provenance)
→ S2 ledger (new errors, kinds — judged after the outcome)
→ outcome (correct, mastery delta)
```

**Ablation.** Each situation is run four times: FULL; NO-SELF-MODEL (`learningEnabled:false` — experience recorded, never injected); LINEAR (round-robin targeting, no executive, no rest); NO-WALL (the fatigue>0.85 physiological override disabled); BELIEF-BLIND (the executive keeps all machinery but aims round-robin instead of by believed need). A decision is the (directive, target-concept) pair; influence = fraction of paired turns changed vs FULL. Break turns are INCLUDED (rest-vs-study flips are exactly the wall/self-model levers working).

**Students.** `StudentProfile` overrides (learningRate, fatigueSensitivity, startFatigue, answerNoise, streakClustering, sleepFactor) × `KnowledgeShape` (novice/mixed/advanced/spiky — controls the true-mastery starting map). Declared, deterministic per seed.

## 2. The 24 situations

| id | Situation | Profile deltas | Knowledge | World |
|---|---|---|---|---|
| t01 | Fresh novice, calm | — | novice | polity |
| t02 | Fresh novice, anxious | noise .2, fatigue×1.3, cluster .15 | novice | polity |
| t03 | The steady middle (control) | — | mixed | polity |
| t04 | Overconfident middle | noise .05 | mixed | polity |
| t05 | Streaky middle | cluster .25 | mixed | polity |
| t06 | Tires fast | fatigue×1.6, start .2 | mixed | polity |
| t07 | Advanced and quick | rate ×1.5 | advanced | polity |
| t08 | Advanced marathoner | fatigue×0.45 | advanced | polity |
| t09 | Spiky and sure | noise .05 | spiky | polity |
| t10 | Night-before crammer, spiky | start .45 | spiky | polity |
| t11 | Slow grinder | rate ×0.55 | mixed | polity |
| t12 | Deep sleeper | sleep ×0.3 | mixed | polity |
| t13 | Anxious and slow | noise .18, rate ×0.6, fatigue×1.2 | mixed | polity |
| t14 | Gifted and impatient | rate ×1.8 | mixed | polity |
| t15 | Distracted answerer | noise .28 | mixed | polity |
| t16 | Exam panic | start .5, noise .15, fatigue×1.3 | mixed | polity |
| t17 | Confident novice | noise .08 | novice | polity |
| t18 | Humble advanced | — | advanced | polity |
| t19 | Inconsistent | noise .25 | mixed | polity |
| t20 | Marathoner | fatigue×0.5, sleep ×0.75 | mixed | polity |
| t21 | Night owl | start .4, sleep ×0.4, fatigue×1.1 | mixed | polity |
| t22 | Fragile streaks | cluster .35 | mixed | polity |
| t23 | Steady advanced | — | advanced | **cbse** |
| t24 | Everything at once | noise .2, cluster .25, fatigue×1.5, start .3 | spiky | **cbse** |

All: 6 days × 8 turns = 48 turns, 1,152 turns total.

## 3. Results

### 3.1 Matched-baseline outcome (executive vs linear, true marks)

| Measure | Value |
|---|---|
| Wins / Ties / Losses | **23 / 1 / 0** |
| Mean margin | **+1.5 marks** (range 0..+4) |
| Belief error (exec vs linear) | better in 20/24, worse in 4 — all four are the advanced/advanced-adjacent students (see §5.2) |
| Biggest margins | t23 CBSE advanced +4 · t14 gifted +3 · t24 chaos +3 |

### 3.2 Layer activity (real-time choreography, 1,152 turns)

| Layer | Activity | Reading |
|---|---|---|
| S1 self-prediction | emitted before **100%** of decisions (mean 3.3/turn) | the law holds every turn |
| Self-model consultation | injected on **97%** of decisions | after ~1 turn of experience, every decision carries self-knowledge |
| S2 self-error ledger | ≥1 new error on **63%** of turns; ~40 errors/situation | expectations vs reality disagree constantly; every miss recorded |
| Contract/ethics constraints | blocked candidates on **87%** of turns | the restraint layer is the busiest — pacing/density laws fire constantly |
| Executive deviation from incumbent | **4%** of turns | the executive is conservative: it overrides the linear plan only on evidence |
| Physiological wall | **121 forced rests** across 24 students | enforced, counted, never silent |
| Expression | spoke on **82%** of turns; self-correction **20%**; praise **7%**; provenance **1,925/1,925 → 100% here too** | evidence-rich, praise-poor, exactly as designed |
| Conductor | 6 channels, ~5 steps per plan, every executed decision | the session flow is real end-to-end |

### 3.3 Influence by ablation (the answer to "how much does each layer matter")

| Ablated layer | Decisions changed (mean, range) | Marks effect (mean) | Interpretation |
|---|---|---|---|
| Whole Executive (→ linear) | **84.6%** (83–90) | −1.5 marks | the decision layer is the product's spine |
| Belief aiming (→ round-robin) | **82.9%** (81–85) | **−0.42** | the frozen belief engine drives nearly all of the executive's divergence — targeting is the edge |
| Physiological wall (→ no forced rest) | **15.4%** (8–**65**) | **−0.71** | the wall IS the strategy for fatiguing students: t16 exam-panic 65%, t08 marathoner 33%, t18 humble-advanced 31% |
| Self-model live levers (→ learning disabled) | **0%** (0 everywhere) | 0 | honest: in these regimes no insight lever had a margin to flip; the layer's causal role is proven where it can act (S4 gate, EXPERIMENTS §18: keep/reject → adopted strategy changes decisions) |

Wall-ablation spread by student (the wall matters exactly where fatigue does): t16 **65%**, t08 33%, t18 31%, t15 19%, t23 19%, t24/t20/t14 10–15% … t01/t03/t05/t11/t12/t21/t22 8–10%.

### 3.4 Self-prediction calibration

63% of turns produced ≥1 self-prediction error (mostly `confidence` and `readiness` kinds): the engine's self-expectations are honestly imperfect and constantly corrected — the raw material the S4 improvement path feeds on.

## 4. Phase 6 demo (the arc, receipts underneath)

`runDemo6()` performs the 3-minute arc on a real world: **Minute 1** — "everything is grey", hypothesis stated with a receipt id and confidence; **Minute 2** — an expectation tested and wrong ("I predict my confidence is low" → a clean answer → recorded), with the PROOF that from turn N the engine's decisions diverge from a twin that cannot learn; **Minute 3** — what was learned (top-3 belief shifts, self-knowledge gained) and the honest unknown list. Six **viewer perturbations** change exactly one input at the probe turn and show the mechanism: one answer flips → candidate pool reshapes; fatigue 0.4→0.9 → the break candidate appears; frustration spike → switchTopic appears; self-knowledge injected → the evidence-first diagnose candidate appears; miss-streak heals → the LLM option withdraws. 5/6 changed the decision; the time-budget cut did not flip at the probe turn (recorded as-is). The arc also runs unchanged on CBSE (`demo6` test).

## 5. Findings worth keeping

1. **Influence is two-shouldered.** Belief-driven aiming (82.9%) + the physiological wall (15.4%) carry the behavioural divergence from the linear teacher. The margin concentrates where the mechanism predicts (gifted +3, CBSE +4, chaos +3; novices ±0–1 — there is little to aim at when everything is grey and the floor binds).
2. **The restraint layer is the busiest layer.** 87% of turns had candidates blocked by the contract/ethics wall — the machine's discipline is not an ornament; it is the most active force in every decision.
3. **The self-model is a watcher first, a lever second.** 97% consultation, 63% error-capture, but 0% live-lever flips in these regimes. That is the designed hierarchy: observe → record → consult → and only through the tested S4 path (§18) actually change strategy. We would rather report a true 0% than a performed influence.
4. **The calibration advantage INVERTS for advanced students** (t07/t08: exec belief error > linear). Mechanism: the executive observes SELECTIVELY (it aims where need is), so on students who know most of the map, the untouched concepts' beliefs go stale while the linear teacher's round-robin keeps them fresh. Marks still never lose (targeting spends the budget where it pays). Honest consequence: belief maintenance for advanced students is a known gap — a review-quota for targeting is the candidate fix (Vision Ledger candidate).
5. **Chaos is survivable.** t24 (noise + streaks + fatigue + spiky knowledge, on CBSE): 23 wins-equivalent behaviour, +3 marks, zero provenance violations.

## 6. Defects found by the study while building it (all fixed)

1. **Ledger duplication across days** — the session persisted across days while the loop re-pushed the carried ledger each day, exponentially inflating the error count (408 vs ~44 real). Found because a 48-turn run cannot honestly produce 400 errors. Fixed: the persistent session's ledger IS the carried experience.
2. **The ablation comparator was blind** — it excluded break turns and compared directives without targets, reporting 0% everywhere (even for the linear ablation, whose trace had also not been collected). Fixed: all turns, decision+target compared, all ablation arms traced.

Both defects were found because the study's numbers refused to make sense — the same self-audit discipline as the docs-integrity gate.

## 7. Threats to validity

- **Declared students.** The 24 profiles are parametric models, not humans; real students will combine traits in ways not sampled here.
- **Six-day horizon.** Long enough for the wall and targeting to matter, short for the self-model levers and S4 adoption (their dedicated gates, §18, remain their proof).
- **Single seed per situation.** The rig runs in ~0.2 s; multi-seed sweeps are the next hardening step.
- **All evidence is SIMULATED-world.** Real-student efficacy remains UNKNOWN UNTIL PILOT (G3) — unchanged by this study.

## 8. Evidence levels

| Claim | Level |
|---|---|
| Per-turn, per-layer traceability of the full stack | **INTEGRATION-TESTED** (permanent gate: `test/layer-study.test.ts`) |
| Layer influence ordering (executive ≫ belief-aiming > wall > self-model levers) | **MEASURED BY ABLATION (simulated)** |
| Executive ≥ linear across 24 mindsets/knowledge/behaviour combinations, two curricula | **MATCHED-BASELINE-VALIDATED (simulated)** — 23/1/0 |
| Phase 6 demo arc (hypothesis → wrong → changed → learned/uncertain) with perturbation counterfactuals | **INTEGRATION-TESTED** (`test/demo6.test.ts`) |
| Real students learn better with Techgram | **UNKNOWN — PILOT ONLY** |

## 9. Reproduction

```bash
npx tsx scripts/run_layer_study.mts            # the study → docs/LAYER_STUDY_RESULTS.json (~0.2 s)
npx vitest run kernel/test/layer-study.test.ts # the study as a permanent gate
npx vitest run kernel/test/demo6.test.ts       # the Phase 6 demo arc
```
