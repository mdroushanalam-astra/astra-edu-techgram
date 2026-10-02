# TECHGRAM — FRONTEND BLUEPRINT & VERDICT
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
