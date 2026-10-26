# TECHGRAM — FRONTEND BLUEPRINT & VERDICT

> **Current status (10 October 2026):** connected authority and reference frontend implemented; Founder review/release/pilot gates open. See the dated addendum and CURRENT_STATE. Older sections retain historical context.

## Are we ready to build the frontend? Yes — here is exactly what it is, how it mirrors the brain, and the build plan.
*Written 2026-10-02 ~15:00 (GLM-5.3-Flash via ZCode, Founder-directed). Companion to `04_ARCHITECTURE.md`. Verdict authority: this document + CURRENT_STATE.*

---

## 1. THE VERDICT

> **YES — frontend development is green-lit, in two waves.**
>
> **Wave 1 (V1-A completion): the Brain Lab web page** — pure presentation over the kernel, no server, no accounts, no data risk. Everything it needs exists and is tested (116/116 at the time of writing; 174/174 as of the freeze). **STATUS 2026-10-03 [ADR-031]: Wave 1 is DONE and browser-verified; Brain Lab is now the INTERNAL INSTRUMENT (inspection/replay/debug console) — it gets no further polish cycles. The enterprise student frontend is the product; the design is decided at the open FRONTEND DESIGN GATE (founder decides — not adopted from any external review), with G4 Product Experience Gate defined at design sign-off. Rendering contracts from the kernel are binding: bands never single scores, agency as moments/stages never a number, "why this?" opens evidence + uncertainty + opportunity cost (plan.foregone), mismatch renders as believed→evidence→update, every recommendation is overridable with evidence-based response (Agency Transfer made visible).**
>
> **Wave 2 (V1-B): the Student PWA** — needs ONE small backend piece first (sync server + persistence), but the UI can be built in parallel against the kernel running in the browser (the kernel is TypeScript — it runs client-side natively; that was the ADR-001 decision paying off).

**The honest gap list (what the frontend does NOT have yet):**

| Gap | Wave | Note |
|---|---|---|
| Brain Lab web page (React/Next over kernel) | 1 | Kernel is a TS package — import and render |
| Persistence (IndexedDB event log + snapshots) | 2 | Event schema ready; idempotency keys in place |
| Sync server (Node: ingest, recompute-and-verify) | 2 | Server recomputes state from events — tamper-proof by design |
| Auth for students (accounts) | 2 | Kernel is student-agnostic today (by design); identity wraps it |
| Notifications (push) | 2 | Kernel decides send/no-send (B9); delivery is platform work |
| Content depth (atoms 84+21 → 150; items 80+25 → 500) | both | THE critical path — Founder/mentor verification hours |
| Hindi/bilingual rendering | 2 | Atom `lang` field exists; content to author |

---

## 2. THE DESIGN LAW: THE UI IS THE BRAIN, VISIBLE

The frontend's one job: **make the brain's architecture visible and beautiful.** Every screen maps 1:1 to a kernel organ — if a screen can't name the kernel call it makes, it doesn't ship (Feature Contract).

```
┌────────────────────────────────────────────────────────────┐
│                    ONE BRAIN (TS kernel)                    │
│  belief · memory · exam model · planner · teacher · AOM     │
└──────────────┬─────────────────────────┬───────────────────┘
        decide()/slots              observe()/events
               ▲                         │
   ┌───────────┴─────────────────────────▼──────────────────┐
   │                     SURFACES (cherries)                 │
   │  Today · Session · Brain Map · Forecast · Mock Lab ·    │
   │  Receipts ("Why?") · Teacher chat · Notifications       │
   └─────────────────────────────────────────────────────────┘
```

---

## 3. THE INFORMATION ARCHITECTURE (screen by screen)

### S1 — TODAY (the home screen; slot `NEXT_SESSION`)
A calm, dark-first dashboard. One hero card: **"Today's plan"** — the composer's segments as a vertical timeline (retrieval warm-up → teach → practice → calibration), each segment showing its expected gain ("+0.8 marks · why?") and a **"Why this?"** chip that opens the receipt. Below: three quiet stat tiles — *Exam countdown · Belief coverage (what % of the syllabus is known vs grey) · Streak (no shame copy ever)*. **Design law: no numbers without intervals, no claim without a why.**

### S2 — SESSION (slot `TEACHER_MOVE`; the heart)
The 40-minute loop as a conversation with the Teacher. Move bubbles (EXPLAIN/RETRIEVAL/HINT/CONTRAST) rendered from atoms; MCQs as beautiful tappable option cards; the hint ladder appears as fading footsteps (L1 cue → L2 eliminate → L3 rationale); **misconception strikes surface as a special "Contrast" card** (two concepts side by side, the difference highlighted). A thin progress rail shows minutes + segment shape. After each answer: instant belief feedback — "your band moved: 0.51 [0.29–0.73] → 0.63 [0.46–0.78]" — **the uncertainty bar is the star animation of the whole product.**

### S3 — BRAIN MAP (slot `state`)
The Student State as a living map: topics as glowing regions — bright (known, tight band), pulsing (learning), **grey mist (unknown — grey is sacred: unknown ≠ zero)**. Tap a topic → concept cards with mastery bands, n_eff, last-seen, evidence mix, and the misconception flags with their contrast lessons. This is the receipt philosophy as a picture.

### S4 — FORECAST (slot `FORECAST`; B4 Monte-Carlo)
The exam-day scenario: a distribution mountain (p10–p90 band, cutoff line), labelled *"model-based scenario, not a prediction"* with assumptions one tap away. What-if slider: "skip this week's revision" → the mountain visibly slides down. **Counterfactual-lite as a toy — honest and irresistible.**

### S5 — MOCK LAB (slot `MOCK` + B11 post-mortem)
Upload/complete a mock → the marks-loss waterfall: knowledge gaps / traps / careless / time / bad guesses / over-skips / unclassified (grey). Plus the attempt-policy coach: "following your own break-even: +5 marks" and the personal confidence map ("'sure' → 75% hit-rate").

### S6 — RECEIPTS (slot `explain`)
Every decision's receipt rendered as a beautiful card: inputs with intervals → prediction → alternatives considered → assumptions tagged `assumed`/`measured` → unknowns → **"what would change my mind."** Shareable. This is the trust surface no competitor can fake.

### S7 — BRAIN LAB (public, Wave 1)
The 8-screen public demo per ADR-014: synthetic student → hidden truth → why-this-question → belief convergence animation → plan with reasons → what-if vs baselines → 60-day race → **LLM unplug toggle showing identical decisions**. **The mistakes panel: show where the belief was WRONG.** [refined 2026-10-02] Synthetic-labelled, zero user data.

**Visual language:** dark-first, one accent (calm indigo) + semantic greys (unknown = mist, not error); typography-led (the numbers ARE the design); motion only for belief-updates (the band narrowing is the dopamine hit — earned, not slot-machine); zero dark patterns: no streak guilt, no red alarms, no infinite scroll. Hindi-first toggle from day 2 (atoms carry `lang`).

---

## 4. THE BUILD PLAN

| Wave | Scope | Why now | Gate |
|---|---|---|---|
| **1 — Brain Lab web** (≈1 week) | **Vite + React + TS over the kernel package** (static build, deploys anywhere incl. Vercel; Next.js deferred to Wave-2 when server routes matter) [runtime refined 2026-10-02]; Acts as screens; | Pure presentation; no data risk; it IS the public proof | Screens render from kernel output only; no hardcoded numbers (CI-lintable) |
| **2 — Student PWA** (2–3 weeks) | S1–S6 + IndexedDB event log + service worker + sync server (Node: ingest, recompute-and-verify) + auth | Kernel ready; offline-first is moat M5 | Tamper test: server recomputes client state exactly; chaos: kill network mid-session |
| **3 — Polish + pilot hardening** | Hindi atoms, notification delivery, parent-share (post-pilot per ADR-017) | After content depth hits | Pilot checklist |

**Non-negotiables (from the Charter, restated for UI):** unknown renders as grey mist with a "sharpen" action · every number carries its interval · every recommendation carries "Why this?" → receipt · "model-based scenario" framing on forecasts · no engagement dark patterns · no diagnosis language ever.

---

## 5. WHY THIS FRONTEND WINS

Every competitor renders **content**; we render **the state of a mind**. The belief bands narrowing, the grey mist receding, the receipt behind every nudge — that's the Astra pattern (State + Evidence + Honesty) translated into pixels. Beautiful here means *truthful made tangible*, and that is copyable by no one who lacks the kernel.


---

## 11. THE FOUNDER DESIGN BRIEF (2026-10-03 — THE VISION THIS PRODUCT MUST SERVE) — pending ADR-032 sign-off
> Recorded verbatim-in-spirit from the Founder. This section is the north light for the enterprise frontend. The full engineering proposal is the "Astra Design Proposal" report (session of 2026-10-03, in-chat).

**The feeling (non-negotiable):** minimal, enterprise-grade, psychologically interactive. The app must feel like **a home where no one judges the student** — a future-looking intelligence engine that is **highly intelligent but a friend**: charismatic, humorous, easy to understand, authentic (never fraudulent — output presented must exactly match the intelligence that generated it).

**The session (the killer surface):** must feel like a **live video call with a human teacher-friend** — a **holographic running teacher** (interactive, production-grade, animated character), a **blackboard for graphs**, live voice + text. Target: free, no external software, fully local.

**Retention:** deeply retentive loops built on psychology — but the Founder's "dark psychology" instinct is answered with the ADR-023 ruling: the manipulation toolkit is banned AND the compounding-psychology toolkit (attachment through genuine memory, open loops, growth evidence, the buddy who was there) is the strong version of what he wants. Authenticity is the retention moat.

**Engineering verdict (researched 2026-10-03):** achievable free + offline: Canvas 2D hologram avatar (custom rig, no Live2D license), Web Speech API TTS (offline system voices, quality-tiered with text-first fallback), on-device Whisper (transformers.js, ~40–75 MB, WASM/WebGPU) as optional voice input, canvas blackboard with draw-on animation, IndexedDB persistence (Wave-2). CUT: photoreal human (uncanny valley, not free), continuous two-way voice chat in V1. The persona renders kernel truth only (Claim-Provenance law: every sentence the teacher says carries kernel provenance — no invented facts, no mismatch).


### 11.1 DESIGN ADJUDICATION (2026-10-03 — the synthesis direction, pending ADR-032)
Adjudicated ChatGPT's parallel design response against the Founder brief + the Astra Proposal. **Adopted:** "Intelligent Sanctuary" framing (a place, not a dashboard); conversational lowercase home copy; ALIVE-not-busy interaction (partial-credit narration + board reveal); blackboard as interactive cognitive instrument (tap where the causal chain breaks — misconception-tagged items drive it); **session camera direction** (the session is directed like a tiny film: close-up → pull back → board dominates → zoom → return; "stillness is part of intelligence"); three layers HUMAN/THINKING/EVIDENCE; teacher interpersonal state machine (IDLE/LISTENING/THINKING/SPEAKING/WAITING…); "the system must be able to shut up" (avatar fades during student thinking); cross-modal sync (voice says "notice this" at the exact moment the board highlights it); character not gender/ethnicity-coded as authority (bias-tested); **ONE golden session first** (Class 8→IAS→Geomorphology, the kernel's own golden scenario) then scale — not seven half-built pages; "no AI•NEURAL•QUANTUM labels" (fake-AI tell).

**Cut from ChatGPT (too narrow):** over-restrained visual thesis → resolved as **"quiet chrome, alive core"** (80% calm pixels, 20% engineered wonder where the marvel lives); single-accent palette → keep the semantic 4-colour system with a one-accent-per-moment law; 3D-human-first V1 → **2.5D stagecraft engine** (layered parallax WebGL — full camera direction on cheap-Android-safe tech, ownable art, no VRM dependency); WebRTC/MediaPipe dropped from V1 stack (no peer/face-capture needed — kernel-driven character).

**Defended from the Astra Proposal:** Claim-Provenance as a MECHANICAL law (TS type + CI lint test, not guidance); three-tier voice system with first-run quality probe; exact palette/type/perf budgets; G4 gate.

**NEW (the unique-retention layer neither doc had):** (1) **Watch-It-Think law** — the kernel's real computations (info-gain selection, band shifts, Monte-Carlo, AOM predictions) aestheticized as visible micro-moments; the magic is REAL and compounds with every kernel improvement — impossible for fakes to copy; (2) **Defeated-Misconception motif** — a confirmed misconception becomes a visible board adversary that is visually resolved when the kernel's misconception tier drops (misconception_resolved milestone = the boss defeat); (3) environmental continuity (chronotype-aware room lighting, measured); (4) peak-end "session trailer" (cinematic open-loop tease); (5) Humor Ledger (per-student comedy profile from measured preference observations). One freeze question: local-only IndexedDB (session-continuity rendering: yesterday's ink stays on the board) — propose lifting the Wave-2 gate for local persistence WITHOUT sync/server (low risk); needs Founder + ADR.


---

## 12. THE LOCKED SPEC — ADR-032 (2026-10-03)
**"Intelligent Sanctuary — quiet chrome, alive core."** The design gate is CLOSED. Full decision text: DECISIONS.md ADR-032; contracts: `apps/web/src/contracts/` (Sprint 0, 9 enforcement tests). Six destinations (Home · Session · Brain Map · Growth · Notebook · Settings) + two universal primitives (Why-this?, Agency moments). Claim-Provenance evidence graph · Presence Layer + SessionScene · 2.5D stagecraft hologram · capability-gated voice tiers (T0 text universal) · Watch-It-Think law · personality = kernel-state reflection · no dark patterns · local-only IndexedDB approved · six-sprint build (0 contracts ✅ → 1 design system → 2 hologram → 3 session → 4 surfaces → 5 voice+G4). **The killer prototype is ONE complete golden session; the bar is "magical, not a fancy PowerPoint with a glowing person beside it."**


---

## 13. THE REJECTION RECORD + TOMORROW'S REDESIGN PROTOCOL [Entry 19, 2026-10-03]
Two attempts, two founder rejections in one day: v1 "Intelligent Sanctuary" deep-space minimal — **"so boring"**; v2 "The Warm Room" per his vision boards — **"still fucked up"**. Verdict: solo AI design judgement is not calibrated to the founder's taste; the boards are the floor, not the ceiling; the painterly-art gap poisons layout evaluation.
**Tomorrow's redesign protocol (binding):** founder-led, live-in-the-loop (he watches, changes happen while he reacts) · art swap-in FIRST (his generated illustrations into the marked ART-SWAP slots) · screen-by-screen side-by-side against the boards · motion and density erred RICH, never minimal again · stack switch (incl. desktop-first) is on the table and decided by him at the top of the session.
**What survives both rejections (the rails):** kernel adapter + claim-provenance law · six-surface IA · understanding bars / why-reasons / growth / agency / curiosity data flows · IDB persistence · session mechanics (v1 conductor) · ART-SWAP slot structure. The redesign is a visual/experience rebuild on these rails — kernel untouched, freeze intact [ADR-031].


---

## 14. WARM ROOM v3 — THE TWO-CHARACTER BUILD [ADR-033, 2026-10-04] — ✅ BUILT & VERIFIED (S1–S4, Entries 20–23)
**ASTRA (orb, orchestrates)** + **MENTOR (teaches)** + **ONE brain** (frozen). The Meeting: auth → Layer A → real-computation pause → read-back → "How wrong am I?" → Layer B calibration → three horizons (NOW/NEAR/JOURNEY — never a detailed-year promise) → plan overrides → handoff (amber→cyan fade). Session: colour = interaction state (cyan listen / violet think / amber insight / coral correction / still silence); interruption first-class; density control (no praise spam). The Return: debrief (perception × performance × prediction error), two options + recommendation + override, Library moment. Praise = hybrid: always warm, always specific, always TRUE. VoiceIntent {pace, energy, pauses, emphasis, interruptible}; voice-in = mic→VAD→transcript→evidence. Stack: Vite+React+TS PWA, kernel unchanged (ZERO backend changes), IDB profile + events locally. Board = externalized working memory: types her words, draws the journey tree, writes the plan in chalk. Homepage layout: orb top-center-right, conversation strip below it, board right 45%, mentor seated at the desk, cat stays.

---

## 15. V4 OBSIDIAN & AMBER — STATUS + THE KERNEL CONTRACTS THE FRONTEND NOW CONSUMES [2026-10-04]
**Built & browser-verified:** screens 1–8 + the metrics debrief (v4 theme tokens, orb-with-face, the Meeting through the Mountain, Confirm rows, "Here's what I observed"). Remaining: screens 9–11 session polish + teacher wrap-up, 13–15, the motion pass, the Real-World Layer.
**New kernel contracts ready for the remaining screens [ADR-042]:** `cognitive/expression.ts` exports Utterance {text, evidenceRefs, prosody{pace,energy,pauses,emphasis,interruptible}, llm?}, PresenceBehavior, BoardPayload, CommunicationPolicy — the claim-provenance law and the ethics wall are enforced kernel-side BEFORE anything reaches the UI, and the LLM bridge arrives as a bounded re-voicing request with the deterministic text as fallback. The frontend renders; it never invents.

## 16. Reference frontend delivered — 10 October 2026 [ADR-048]

The active design follows the Founder’s ASTRA UI Board: warm cinematic rooms, navy glass, cyan/blue/magenta actions and matching Astra/mentor. Desktop-first/subtle motion was explicitly selected. All 15 stages and sidebar pages use apps/web/src/journey; rejected/amber/local versions remain inactive history.

Stages: welcome/auth → meet → details → questions → summary → home → mountain plan → confirm → real lesson → actual pending overlay → completion → debrief → next choice → artifacts → return. Real controls support edits, answers/confidence, SVG diagrams, drawing/undo/clear, native modal notes/download and settings. Generated assets contain no UI text. Preview is labelled/offline and its answers are absent from connected builds; connected mode uses existing APIs.

Four-viewport and real response-loss/revision-conflict evidence, prompts and review sheets are in frontend/README. Voice/free-text/translations/server notes/preferences are deferred; roadmap art is an outline, accuracy is not mastery. Implementation/QA are complete; Founder approval is pending.


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
