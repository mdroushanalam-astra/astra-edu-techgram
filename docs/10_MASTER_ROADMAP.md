# TECHGRAM — THE MASTER ROADMAP
## The developmental cognitive engine, embodied in education. One build sequence. Hard gates. No new names.
*Locked 2026-10-04 under ADR-039. This document supersedes all previous roadmap fragments (C-series, G-series, S-series drafts) as the single build sequence. Companion decisions: ADR-031 (brain freeze + unfreeze terms), ADR-033 (Experience Architecture), ADR-035 (C1 Executive), ADR-036/037 (self-development), ADR-038 (Execution Layer).*

---

## THE ARCHITECTURE (frozen whiteboard)

```
UNIVERSAL COGNITIVE SUBSTRATE
  State / Evidence · Belief / Memory · Prediction · Hypothesis · Goal / Value · Action / Outcome
        ↓
COGNITIVE RUNTIME
  Workspace · Executive · SelfModel · SelfPrediction · SelfInquiry · SelfError · Improvement · Metacognition · Communication
        ↓
   ExperiencePlan  (the seam)
        ↓
TECHGRAM WORLD ADAPTER
  Curriculum · Exam · Student sensors · Learning actions · Outcomes
        ↓
EXECUTION LAYER
  Session Conductor · Presence · Teacher · Blackboard · Voice · LLM Bridge · Evidence UI
        ↓
     HUMAN → OBSERVATIONS → COGNITIVE ENGINE
```

## THE THREE INVARIANTS (written above everything)

1. **The anti-Goodhart wall for the self:** the engine may change its beliefs, predictions, strategies, representations, and self-model in response to evidence — but it may never rewrite the evidence, the external evaluator, or the world's ground truth to make itself look better.
2. **The expression law:** the execution layer may express intelligence but may not invent it. Executive decides → Conductor executes → Presence expresses → LLM voices → UI renders. Never the reverse.
3. **The development law:** no self-update without evidence; no strategy update without a falsifiable hypothesis and an evaluation path; no representation update merely because a narrative sounds compelling.

---

## CURRENT POSITION (measured against the phases — 2026-10-04)

| Phase | Status |
|---|---|
| 0 Architecture Freeze | 🟡 ~80% — cognitive/contracts.ts + SessionScene exist; ExperiencePlan kernel type formalization remains |
| 1 Executive Spine | 🟢 BUILT — executive.ts + receipts + deterministic replay; the deep matched-runs gate (real runTeachingSession vs executive session) remains |
| 2 Developmental Core | 🟡 contracts done (SelfModel, PredictionRecord, calibrate, causal edges); S0–S4 runtime capabilities remain |
| 3 Execution Body | 🟡 conductor exists in the frontend (v1); Presence Layer contract exists (SessionScene); formalization remains |
| 4 Expression | 🟡 VoiceIntent + humor registry exist; Communication policy module remains |
| 5 World Adapter | 🟢 mostly exists — GoalSpec + event fabric + sensors; hardening remains |
| 6 Brain Lab demo | ⬜ after Phases 1–4 |
| 7 Pilot | ⬜ content sprint (the critical path, founder hours) |
| 8 Organism Lab | ⬜ post-pilot |

---

## PHASE 0 — ARCHITECTURE FREEZE ✅→close
**Goal:** stop inventing. Lock the contracts.
- ✅ CogObject + EpistemicStatus (observed/inferred/hypothesis), PredictionRecord + calibrate, CausalEdge + counterfactual, SelfModel, ExplanationPlan, DomainAdapter (`cognitive/contracts.ts`)
- ⬜ Formalize `ExperiencePlan` as a kernel type (upgrade SessionScene: learning/evidence/communication/presentation/presence/agency + expectedOutcome: PredictionRef + rationale: DecisionReceipt)
- ⬜ Freeze: no new organs, no new contract names, until Phase 7.
**Gate:** contracts compile; organs untouched.

## PHASE 1 — EXECUTIVE SPINE ✅→deepen
**Built:** TurnWorkspace, candidate generation, constraints (session contract + ethics wall), seeded selection, DecisionReceipt with alternativesConsidered.
- ⬜ **The deep gate:** matched runs using the REAL `runTeachingSession` vs an executive-driven session (same student archetype, content, time budget, evidence) — metrics: simulated exam marks (trueExamMarks), information gained, interventions (jokes/LLM/breaks) vs budget, missed breaks when fatigue, recovery from wrong assumptions, receipts complete, deterministic replay.
**Gate:** Executive ≥ linear on simulated marks AND intervention discipline; otherwise fix, don't decorate.

## PHASE 2 — DEVELOPMENTAL CORE
- **S0 Developmental Genesis:** self-inquiry, not benchmarking — the engine identifies ITS OWN uncertainties (which predictions am I least calibrated on? where do I over-intervene?), chooses probes by VoI, runs them, writes SelfModel₀ + KnownUnknowns₀ + FailureModes₀.
- **S1 Self-Prediction:** before consequential decisions — "I predict I will choose retrieval", "I predict confidence 0.72", "I predict I'll intervene within 3 turns" — logged BEFORE acting, checked AFTER.
- **S2 Self-Error Ledger:** prediction/actual/error/context/pattern/hypothesis — accumulated; recurring patterns detected.
- **S3 Self-Inquiry via VoI:** CAT machinery pointed inward — "which fact about my own performance would most reduce my uncertainty?"
- **S4 One self-improvement experiment:** recurring self-error → hypothesis → candidate strategy → simulator test → external evaluation → keep/reject → DevelopmentalState update.
**Gate:** history → self-model change → DECISION change (not merely "the database changed").

## PHASE 3 — EXECUTION BODY
- **ExperiencePlan:** the kernel type; six coordinated channels (Learning/Presence/Expression/Evidence/Experience/Agency).
- **Session Conductor:** real-time loop — ExperiencePlan → teacher/board/voice/timing/questions/interaction/evidence capture; interruption → workspace refresh → Executive → new plan (the loop stays alive).
- **Presence Layer:** gaze/silence/waiting/timing/emphasis — "give the student 8 seconds to think" expressed as behavior.
- **Evidence UI:** Why-this in kid/pro words; visible self-correction ("I was wrong about what was slowing you down").
**Gate:** a stranger experiences the cognitive loop without understanding the architecture.

## PHASE 4 — EXPRESSION
- Communication Policy (tone/verbosity/humor/silence/board choice — expression, never the learning decision).
- Blackboard as decision-driven visual explanation; Voice capability-gated; LLM Bridge as optional renderer.
**Gate:** LLM OFF → valid cognitive behavior; LLM ON → richer expression, identical decisions.

## PHASE 5 — TECHGRAM WORLD ADAPTER (hardening)
World model → UPSC Polity (concepts, prereqs, PYQs, verified atoms, misconceptions, exam outcomes); Sensors → answer/confidence/RT/hints/retrieval/delayed recall/mocks; Actions → teach/retrieve/diagnose/practice/compare/transfer/rest/switch. **Techgram becomes the first body of the universal engine.**

## PHASE 6 — BRAIN LAB / PUBLIC DEMONSTRATION
The polished demo around the actual loop: Observe → Hypothesize → Predict → Act → Surprise → Update → Adapt — receipts underneath. Not architecture diagrams.

## PHASE 7 — PILOT
20–30 adults. Four measurement layers: **Learning** (performance, delayed retrieval, transfer, retention) · **Decision quality** (prediction accuracy, calibration, unnecessary interventions, information efficiency) · **Development** (self-prediction calibration, self-error patterns, self-inquiry choices, strategy changes, path dependence) · **Human agency** (independent proposals, self-correction, scaffolding reduction).

## PHASE 8 — COGNITIVE ORGANISM LAB (post-pilot)
S5 developmental divergence · S6 cross-domain transfer · S7 persistent self-model · S8 representation evolution · S9 multi-environment development · S10 multiple organisms. The scientific question: do different histories produce measurably different cognitive trajectories?

---

## THE PILOT GATE — twelve capabilities (the finish line before pilot)

1. Observe (student + world + history) · 2. Represent (belief + memory + self-model) · 3. Predict (world + action + itself) · 4. Decide (Executive) · 5. Act (ExperiencePlan) · 6. Observe outcome (evidence) · 7. Detect prediction error (world/self) · 8. Investigate uncertainty (VoI) · 9. Change strategy (controlled improvement) · 10. Change future behavior because of that history (future cognition ≠ prior cognition) · 11. Explain its decisions (receipt/why-this) · 12. Express the whole loop coherently to a human (Session Conductor).

## EXPLICITLY NOT BUILT
❌ consciousness engine · ❌ personality engine · ❌ emotion detector · ❌ Theory of Mind engine · ❌ multi-agent society · ❌ full causal general engine (contract first) · ❌ five separate memory stores (event log + derived memories suffice) · ❌ social network · ❌ school/location competition · ❌ engagement optimization engine · ❌ "AGI mode"

## THE CLAIMS LAW
Internally: general cognitive architecture / universal cognitive substrate / developmental cognitive engine. Externally: *"Techgram is an adaptive learning system built on a general cognitive engine."* Never: superintelligence, AGI, consciousness, "it feels."

---

*The single sentence: a developmental cognitive engine, currently embodied in education, whose intelligence is demonstrated by the fact that its accumulated experience changes the machinery generating its future decisions.*
