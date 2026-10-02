# TECHGRAM — CURRENT STATE
## The living snapshot. Update after EVERY session — this is the technical front door.

> **Read me alone:** refreshed after every session; stands on its own. Non-technical readers: `FOUNDER_GUIDE.md` tells the same story in plain language.
> **Integrity:** all counts in this file are backed by `COUNTERS.json` (generated from the code by `npm run counters`) and enforced by `kernel/test/docs_integrity.test.ts`. If this page contradicts reality, the docs-integrity test fails — fix reality or the doc, never silently.

**Snapshot:** 2026-10-02, ~16:00 (local) · Kernel 0.1.0+ · **116/116 tests green, 14 files, typecheck clean** · Phase: **V1-A INTELLIGENCE-KERNEL GATE SUBSTANTIALLY COMPLETE — on the public-release runway** (public V1-A ships when Brain Lab web + content floor land; see `05_ROADMAP.md`) · Git: `main`, 9 commits (`9b9ffb3`) · Session model: GLM-5.3-Flash (Z.ai) via ZCode

---

## 1. One-paragraph position

The full closed loop exists, is proven, and now teaches: envelope → events → belief (graph-prior Kalman) → memory → exam Monte-Carlo → CAT diagnostic → AOM → robust planner → composer (B7) → teacher (B8, 14 moves over verified atoms) → student turns → typed evidence → belief/memory/misconception update (B10) → AOM prediction errors — with receipts on every layer, plus mock post-mortem + attempt coach (B11) and behaviour engine (B9, internal flags only). Proven this week: four-world robustness (edge grows hostile), 10-day closed-loop true learning vs control, weak-topic recovery, bit-for-bit replay, and **goal-agnosticism — the same brain runs CBSE Class 8 Science with zero kernel changes**. Content bank (generated, see `COUNTERS.json`): **13 topics · 54 concepts · 105 verified items · 104 verified atoms** across two goals (UPSC Polity + CBSE Class 8 Science). Zero LLM decisions, structural. What remains for public V1-A: **Brain Lab web (Wave 1 — green-lit, blueprint in `06`) and the content floor**; then Wave-2 student PWA + sync (gated, `06_FRONTEND_BLUEPRINT.md` §4).

## 2. What works (verified — see EXPERIMENTS_AND_TESTS for numbers)

| Capability | Status | Proof |
|---|---|---|
| Learning Envelope (7 rules + no-upgrade) | ✅ live | `test/envelope.test.ts` |
| Belief engine (prior, EKF, decay, Elo 2nd opinion, honest bands) | ✅ live | `test/belief.test.ts` |
| Memory engine (Techgram Memory Model, spacing rule) | ✅ live | `test/memory.test.ts` + ADR-006 |
| B5.5 Action Outcome Model (predict→record→act→observe→error→approve; closed-loop ban) | ✅ live | `test/aom.test.ts` + end-to-end loop test |
| Exam Monte-Carlo (negative marking, attempt policy) | ✅ live | `test/exam.test.ts` |
| CAT diagnostic (info gain, 20–25 items, bands + sharpen) | ✅ live | `test/diagnostic.test.ts` |
| Planner (robust, VoI, prereq sequencing, two-pass fill, triage; 100% AOM-sourced) | ✅ live | `test/planner.test.ts` + §5 sweep |
| **G0 four worlds** (friendly/misspecified/adversarial/sealed-hidden) | ✅ planner useful in ALL; edge grows hostile | `test/g0_worlds.test.ts` + §10 |
| **B7 Session Composer** (plan→segments, layout only, receipt lineage) | ✅ live | `test/closed_loop.test.ts` |
| **B8 Teacher** (14-move machine; tier-1 atoms / tier-4 templates only; hint ladder; CONTRAST) | ✅ live | `test/closed_loop.test.ts` |
| **B10 Misconception tiers + root-cause suspects** (wired into event fabric) | ✅ live | `test/closed_loop.test.ts` |
| **B11 Mock post-mortem + attempt coach** (hand-labelled classes) | ✅ live | `test/postmortem_behaviour.test.ts` |
| **B9 Behaviour engine** (measured features, internal flags, probes, notification policy) | ✅ live | `test/postmortem_behaviour.test.ts` |
| **Closed teaching loop** (`runTeachingSession`, injected Responder) | ✅ live | `test/freeze_inspection.test.ts` |
| **Goal-agnosticism** (UPSC + CBSE Cl-8 as config) | ✅ live | `test/k12_goal_agnostic.test.ts` |
| **Docs-integrity gate** (COUNTERS.json vs docs vs code) | ✅ live | `test/docs_integrity.test.ts` |
| Brain Lab demo (CLI, 5 acts) | ✅ runs | `npm run brainlab` |
| Python prototype | 🗄️ archived reference (50/50) | EXPERIMENTS §2 |

## 3. What does NOT exist yet (honest — the true remaining gaps)

- **Brain Lab web (Wave 1)** — IN BUILD this session (`apps/brainlab`, Vite+React over the kernel; blueprint `06`). Not deployed yet.
- **Content floor** — 105/500 items; 104/150 atoms; PYQ weight table coarse. **Founder/mentor verification hours = the critical path.**
- **Wave-2 backend pieces:** IndexedDB persistence, sync server (recompute-and-verify), student auth, push delivery. Gated until Wave-1 lands + content moves.
- **Real-student evidence:** AOM parameters are `assumed`; calibration curves need the pilot (G3). Simulator results prove machinery, not real-world efficacy.
- **Hindi/bilingual atoms** (`lang` field exists; content not authored).
- **Mains scoring, Connect, Career, K12 launch, minors** — deferred per ADR-011; K12 content is prep, not launch (ADR-020).

## 4. Next actions (ordered)

1. **Wave 1 — Brain Lab web** (this session): 7 screens over the kernel, built + browser-tested.
2. **Content sprint** (parallel, Founder + mentor): items 105→500, atoms 104→150, PYQ weights refine.
3. **Exercise Brain Lab against sealed hidden worlds** before any public claim (ADR-016 claim discipline).
4. **Wave-2 (gated):** persistence → sync/recompute → tamper test → offline chaos → student PWA.
5. **Pilot:** 20–30 aspirants, 3+ weeks, pre-registered G3 criteria — Founder recruits.

## 5. Risks & standing uncertainty register [adopted 2026-10-02]

| Bucket | Level | What it means |
|---|---|---|
| Engineering | 🟢 low-medium | Core architecture credible; 116 tests + four-world gate + replay |
| Product | 🟡 HIGH | Will students find the loop useful enough to return? Unknown until pilot |
| Scientific / learning-effect | 🔴 VERY HIGH | Does the AOM predict real interventions? Does durable learning improve? Needs delayed outcomes from real students — the honest frontier |

Also: content-verification throughput is the schedule risk; friendly-world planner margin is thin (+0.4 — re-baselined honestly); multi-worker deployment rules out the singleton pattern in Wave-2 server design.

## 6. How to run / verify

```
npm test              # 116 tests incl. G0 four-worlds + docs-integrity gate
npm run counters      # regenerate docs/COUNTERS.json from the code
npm run brainlab      # CLI demo (5 acts)
npm -w kernel run typecheck
cd apps/brainlab && npm run dev   # Wave-1 web (this session)
```

## 7. Pointers

**Non-technical:** `FOUNDER_GUIDE.md` · Soul: `00_CHARTER.md` · Memory: `PROJECT_JOURNAL.md` · Evidence: `EXPERIMENTS_AND_TESTS.md` · Changes: `DECISIONS.md` (ADR-001…021) · Machine pointer: `RESUME.json` · Protocol: `README.md` · Architecture: `04_ARCHITECTURE.md` · Roadmap: `05_ROADMAP.md` · Frontend: `06_FRONTEND_BLUEPRINT.md` · K12 research: `07_OPEN_MATERIALS_RESEARCH.md` · Counts: `COUNTERS.json`
