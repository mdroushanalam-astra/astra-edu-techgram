// THE FULL DOCS SWEEP [2026-10-04] — bring every document to truth as of ADR-046 / Entry 48.
const fs = require('fs');
const root = 'C:/Users/Md Roushan/.gemini/antigravity/scratch/astra-edu-techgram/docs/';
const read = (f) => fs.readFileSync(root + f, 'utf8');
const write = (f, s) => { fs.writeFileSync(root + f, s); console.log(f + ': updated'); };

// ── 1. docs/README.md — mother index: date, document map, ledger rows ──────
let r = read('README.md');
r = r.replace('*Last updated: 2026-10-02 ~05:00*', '*Last updated: 2026-10-04 ~18:00*');
const mapAnchor = '| 13 | **`07_OPEN_MATERIALS_RESEARCH.md`** | K12 open-materials licensing verdict table + quality principles. What may legally be fed to the brain. | On new source research | Append sections |';
if (r.includes(mapAnchor)) {
  r = r.replace(mapAnchor, mapAnchor + '\n' + [
    '| 14 | **`09_FRONTEND_EXPERIENCE_GUIDE_EXTERNAL.md`** | The external 20-case experience guide preserved verbatim (Entry 24). | Read-only reference | Read-only |',
    '| 15 | **`10_MASTER_ROADMAP.md`** | **THE single build sequence (corrected, founder-adopted): Phases 0–8 + gates + invariants. Governs the cognitive-runtime build; supersedes 05_ROADMAP for that scope.** | On phase transitions | Status notes |',
    '| 16 | **`PHASE5_EXPERIMENT_REPORT.md` + `LAYER_INTERACTION_REPORT.md`** | The two big experiment reports (30 scenarios; 24 students × per-layer traces × ablations) — each in plain AND technical language. Raw data alongside as JSON. | After each campaign re-run | Overwrite/addenda |',
  ].join('\n'));
}
// ledger rows for everything since Entry 15 (grouped honestly)
const ledgerTail = '| 2026-10-03 ~01:30–02:30 | **GATE-0 INSPECTION + BRAIN FREEZE v0.1 SIGNED** (commit 1cc4cf3, ADR-031): 5 real defects found & fixed (approval-provenance gap caught by live probes; unknown-concept replay crash; NaN envelope hole; NaN agency day; dead duplicate agencyIndex); freeze_probes.mts + chaos_injection.test.ts; release ladder + coverage gate + UPSC-adults beta ruling; 174/174 tests; stopped at the FRONTEND DESIGN GATE | GLM-5.3-Flash (Z.ai) via ZCode | BACKEND_FREEZE_CHECKLIST (new), DECISIONS (ADR-031), EXPERIMENTS §16, JOURNAL 15, docs/08 (rows 37–42), CURRENT_STATE, RESUME.json, COUNTERS | Entry 15 |';
if (r.includes(ledgerTail)) {
  r = r.replace(ledgerTail, ledgerTail + '\n' + [
    '| 2026-10-03 → 10-04 | **THE FRONTEND ERA (Entries 16–32):** design gate closed (ADR-032) → the Sanctuary built → v2 REJECTED by the founder → the Warm Room v3 (S1–S4: Meeting, VoiceIntent+interruption, mood-lit classroom, the Return — ADR-033) → the external experience guide preserved (docs/09) → v4 Obsidian & Amber (screens 1–8 + metrics debrief, orb-with-face, the Mountain) → blank-page bug solved → polish + Real-World Layer v1. Kernel untouched throughout — the freeze held | GLM-5.3-Flash (Z.ai) via ZCode | apps/web/*, docs/06, DECISIONS (ADR-032/033), JOURNAL 16–32, CURRENT_STATE, RESUME.json | Entries 16–32 |',
    '| 2026-10-04 (early) | **THE COGNITIVE TURN (Entries 33–39):** founder unfroze the kernel for cognitive work — C1 the Cognitive Executive (ADR-035), Genesis & UCS adjudicated (ADR-036), Self-discovery over self-monitoring (ADR-037), the Experience Architecture (ADR-038), the Cognitive Runtime refinement (ADR-039), the corrected Master Roadmap locked (docs/10) and the corrected position adopted | GLM-5.3-Flash (Z.ai) via ZCode | kernel/src/cognitive/*, DECISIONS (ADR-035..039), docs/10, JOURNAL 33–39 | Entries 33–39 |',
    '| 2026-10-04 ~02:00–13:00 | **PHASES 0–2 (Entries 40–42):** Phase 0 Cognitive Architecture Foundation COMPLETE (primitives, ownership, ExperiencePlan seam; 5270d24) → Phase 1 deep gate RAN honestly (exec wins calibration, loses true marks −1) → FORENSIC AUDIT proves the loop OPEN (9c390db) → founder orders the repair → **THE DEVELOPMENTAL LOOP CLOSED** (3647521+6a9f1f3, ADR-040): counterfactual-proven, Conductor integrated, deep gate 12/12 seeds executive beats linear 12 vs 10 | GLM-5.3-Flash (Z.ai) via ZCode | kernel/src/cognitive/*, DECISIONS (ADR-040), EXPERIMENTS §17, JOURNAL 40–42, docs | Entries 40–42 |',
    '| 2026-10-04 ~13:30–16:30 | **S4 + PHASES 4–6 (Entries 43–46):** S4 IN THE LOOP (fffa71f, ADR-041: live strategy experiments, matched A/B keep/reject, adoption changes future decisions) → Phase 4 EXPRESSION (61ff2ec, ADR-042: provenance utterances, ethics wall at the voice, earned self-correction, LLM bridge bounded — LLM OFF/ON byte-identical) → Phase 5 WORLD ADAPTER + THE THIRTY (57bc1cb, ADR-043: UCS boundary, 30/30 scenarios, 30W/0L mean +3.13) → Phase 6 DEMO (b7fdbbe, ADR-044: the 3-minute arc BY the machinery + perturbation counterfactuals) | GLM-5.3-Flash (Z.ai) via ZCode | kernel/src/cognitive/*, adapter/*, lab/*, DECISIONS (ADR-041..044), EXPERIMENTS §18–§21, docs | Entries 43–46 |',
    '| 2026-10-04 ~16:45–18:00 | **THE LAYER STUDY + THE STRENGTHENING PASS (Entries 47–48):** 24 real-time student situations, 1,152 turns traced layer-by-layer, influence measured BY ABLATION (executive 84.6%, belief-aiming 82.9%, wall 15.4%, self-model 0% in-regime — LAYER_INTERACTION_REPORT.md, ADR-045) → founder asks the three follow-ups → **STRENGTHENING PASS** (da5e753, ADR-046: staleness targeting closes all advanced-student inversions; proportional self-model; live calibration channel — self-model 0%→3.2%, 77% exam-panic; no ethical violations found anywhere). 291 tests (kernel 282 + web 9) | GLM-5.3-Flash (Z.ai) via ZCode | kernel/src/cognitive/targeting.ts + executives, lab/layer-trace, DECISIONS (ADR-045/046), EXPERIMENTS §22–§23, LAYER_INTERACTION_REPORT + addendum, JOURNAL 47–48, docs | Entries 47–48 |',
  ].join('\n'));
}
write('README.md', r);

// ── 2. docs/10_MASTER_ROADMAP.md — status banner ────────────────────────────
let m = read('10_MASTER_ROADMAP.md');
const mTitle = '# TECHGRAM — CORRECTED MASTER ROADMAP';
if (!m.includes('STATUS [2026-10-04]')) {
  m = m.replace(mTitle, mTitle + '\n' + [
    '',
    '> **STATUS [2026-10-04]: PHASES 0–6 ALL COMPLETE AT KERNEL LEVEL, EACH WITH ITS GATE EARNED.**',
    '> Phase 0 foundation [ADR-038/040 evidence, commit 5270d24] · Phase 1 deep gate [EXPERIMENTS §17: executive 12 vs linear 10 on 12/12 seeds, belief error halved] · Phase 2 loop CLOSED with counterfactual proof [ADR-040] · Phase 3 body integrated (Conductor executes every decision in the gate flow) · Phase 4 Expression [ADR-042: LLM OFF/ON byte-identical, ethics wall at the voice] · Phase 5 World Adapter + THE THIRTY [ADR-043: 30/30 scenarios, 30W/0L, mean +3.13] · Phase 6 demo [ADR-044: the arc BY the machinery + perturbation counterfactuals] — then the Layer Interaction Study [ADR-045: 24 students, influence by ablation] and the Strengthening Pass [ADR-046: staleness targeting closes the advanced-student inversions; proportional self-model; live calibration channel].',
    '> Evidence: EXPERIMENTS_AND_TESTS.md §17–§23 · reports: PHASE5_EXPERIMENT_REPORT.md, LAYER_INTERACTION_REPORT.md · 291 tests, all rigs permanent CI gates.',
    '> **NEXT: Phase 7 (the real human pilot) — gated on the founder, the content floor, and Wave-2.**',
  ].join('\n'));
}
write('10_MASTER_ROADMAP.md', m);

// ── 3. docs/04_ARCHITECTURE.md — System B section + closing pointer ────────
let a = read('04_ARCHITECTURE.md');
const archTail = '*Spec complete. Sequence, dates, and gates: `05_ROADMAP.md`.*';
if (!a.includes('SYSTEM B — THE COGNITIVE RUNTIME')) {
  a = a.replace(archTail, [
    '---',
    '',
    '## 11. SYSTEM B — THE COGNITIVE RUNTIME [ADR-035..046, built 2026-10-04]',
    'The frozen brain above (System A) is untouched — behavioral invariance is test-enforced (shadow-belief deep-compare in every Layer Study scenario; Phase 0 purity tests). Above it sits the cognitive runtime:',
    '- `cognitive/executive.ts` — C1: workspace → candidates → constraints (contract + ethics) → consequence-aware select → receipt. Owns StrategyParameters (its only self-tunables) + proportional self-model levers + the live calibration channel [ADR-041/046].',
    '- `cognitive/self-development.ts` — S0–S4: genesis, self-prediction, the Self-Error Ledger, VoI self-inquiry, strategy experiments, the phase2 gate.',
    '- `cognitive/developmental-session.ts` — THE COMPOSED LOOP: S1 predict before every decision → decide with insights → S2 structural judging → ledger → deriveSelfInsights → next decisions. Counterfactual switch: learningEnabled:false.',
    '- `cognitive/strategy-experiments.ts` — proposal → matched A/B → keep/reject on TRUE learning → adoption into future sessions.',
    '- `cognitive/expression.ts` — typed utterances under the claim-provenance law; the ethics wall enforced AT THE VOICE; why-this + earned self-correction; density control; board payloads; the bounded LLM bridge.',
    '- `cognitive/conductor.ts` + `experience-plan.ts` — the seam and the execution steps.',
    '- `cognitive/targeting.ts` — staleness-aware need [ADR-046]: long-untouched concepts get a bounded maintenance boost.',
    '- `adapter/world-adapter.ts` + `adapter/worlds.ts` — THE UCS BOUNDARY: worlds (UPSC Polity, CBSE-8, synthetic), 10 student archetypes, prior weights (the Executive may aim with) strictly apart from external weights (the evaluator — brain-inaccessible).',
    '',
    '**The laws:** the Executive decides → the Conductor executes → Presence expresses → the LLM voices → the UI renders (never the reverse) · no self-update without evidence (the counterfactual switch is the standing proof) · anti-Goodhart (the evaluator is never consulted by the brain — ablation-proven) · every layer traced and ablation-measured [ADR-045].',
    '',
    '*Spec complete. Cognitive-runtime sequence: `10_MASTER_ROADMAP.md` (Phases 0–6 COMPLETE). V1-A product sequence: `05_ROADMAP.md`.*',
  ].join('\n'));
}
write('04_ARCHITECTURE.md', a);

// ── 4. docs/05_ROADMAP.md — suite line + supersede pointer ─────────────────
let rp = read('05_ROADMAP.md');
rp = rp.replace('> Suite: 174/174 tests · 20 files · typecheck clean · typecheck+counters enforced.',
  '> Suite: 291/291 tests · kernel 31 files + web · typecheck clean · typecheck+counters enforced. **For the cognitive-runtime build (System B), the governing sequence is now `10_MASTER_ROADMAP.md` (corrected, founder-adopted; Phases 0–6 COMPLETE) — the phase tables below remain the V1-A product-sequence history.**');
write('05_ROADMAP.md', rp);

// ── 5. docs/03_GOALS.md — uncertainty register row ─────────────────────────
let g = read('03_GOALS.md');
g = g.replace('| Engineering | 🟢 low-medium | Core architecture credible: 174 tests + chaos injection + live probes, Brain Freeze v0.1 signed after a defect-finding Gate-0 audit [ADR-031] |',
  '| Engineering | 🟢 low-medium | Core architecture credible: 291 tests + chaos injection + live probes + the Phase 5 thirty-scenario rig + the 24-situation layer study, all permanent gates [ADR-043/045]; the cognitive runtime built and gate-earned [ADR-035..046]; System A still frozen [ADR-031] |');
write('03_GOALS.md', g);

// ── 6. docs/06_FRONTEND_BLUEPRINT.md — §15 ─────────────────────────────────
let f = read('06_FRONTEND_BLUEPRINT.md');
if (!f.includes('## 15. V4 OBSIDIAN & AMBER')) {
  f += '\n---\n\n## 15. V4 OBSIDIAN & AMBER — STATUS + THE KERNEL CONTRACTS THE FRONTEND NOW CONSUMES [2026-10-04]\n**Built & browser-verified:** screens 1–8 + the metrics debrief (v4 theme tokens, orb-with-face, the Meeting through the Mountain, Confirm rows, "Here\'s what I observed"). Remaining: screens 9–11 session polish + teacher wrap-up, 13–15, the motion pass, the Real-World Layer.\n**New kernel contracts ready for the remaining screens [ADR-042]:** `cognitive/expression.ts` exports Utterance {text, evidenceRefs, prosody{pace,energy,pauses,emphasis,interruptible}, llm?}, PresenceBehavior, BoardPayload, CommunicationPolicy — the claim-provenance law and the ethics wall are enforced kernel-side BEFORE anything reaches the UI, and the LLM bridge arrives as a bounded re-voicing request with the deterministic text as fallback. The frontend renders; it never invents.\n';
}
write('06_FRONTEND_BLUEPRINT.md', f);

// ── 7. docs/08_VISION_LEDGER.md — rows 43–46 ───────────────────────────────
let v = read('08_VISION_LEDGER.md');
if (!v.includes('ROWS 43–46')) {
  v = v.replace('\n---\n\n## RULES', '\n---\n\n## ROWS 43–46 [added 2026-10-04, the cognitive-runtime era]\n\n| # | Idea | Status today | Why deferred / changed | **Reopen trigger** |\n|---|---|---|---|---|\n| 43 | Belief maintenance for advanced students (staleness-aware targeting) | ✅ DONE [ADR-046] | Fired by the Layer Study finding (selective observation → stale maps) | — |\n| 44 | Multi-seed sweeps of the experiment rigs | ⬜ PENDING (rigs run ~0.25 s each) | Single-seed per scenario is honest but thin | **Trigger:** before any public claim or pilot Gate-3 — run 5–10 seeds × all scenarios |\n| 45 | The rendered product demo of the Phase 6 arc | ⬜ PENDING | The kernel demo (demo6.ts) is the instrument; the pretty renderer rides the frontend | **Trigger:** founder go on the demo render (rides screens 9–15) |\n| 46 | Spiky-knowledge belief maintenance residual (t09/t10) | ⬜ PARTIAL [ADR-046] | The staleness boost helped; the accuracy floor still binds on half-mastered maps | **Trigger:** a layer-study re-run showing the t09/t10 inversions closed |\n\n---\n\n## RULES');
}
write('08_VISION_LEDGER.md', v);

// ── 8. docs/BACKEND_FREEZE_CHECKLIST.md — addendum ─────────────────────────
let z = read('BACKEND_FREEZE_CHECKLIST.md');
if (!z.includes('ADDENDUM [2026-10-04]')) {
  z += '\n---\n\n## 6. ADDENDUM [2026-10-04]: THE FREEZE HELD — AND WAS WELDED SHUT\n- The freeze HELD through the entire frontend build (v2 → v3 → v4) with ZERO kernel changes, and through the construction of the COGNITIVE RUNTIME above the frozen brain: frozen-organ invariance is test-enforced (Phase 0 purity deep-compares; shadow-belief identity in every one of the 24 Layer Study scenarios and the Phase 5 structural scenarios) [ADR-045/043].\n- The founder explicitly directed the cognitive RUNTIME (System B) above the frozen brain [the unfreeze directive; ADR-035..046] — that machinery lives ABOVE System A, never inside it. System A remains frozen exactly as signed below.\n- Current standing: 291 tests, including the Phase 5 thirty-scenario rig, the 24-situation layer study, the demo arc, and the strengthening gates — all permanent CI gates. The release ladder below is unchanged; the next external gate remains the content floor, then Wave-2, then the pilot.\n';
}
write('BACKEND_FREEZE_CHECKLIST.md', z);

// ── 9. docs/02_NORTH_STAR.md — status line after the sharpened star ────────
let n = read('02_NORTH_STAR.md');
if (!n.includes('Status [2026-10-04]')) {
  n = n.replace('That is Techgram. The working formula is **STRONG PRIOR + ACTIVE SENSING + SMALL EVIDENCE + UNCERTAINTY MODEL + DECISION OPTIMIZER → USEFUL DECISION** — never "no data → magical intelligence."',
    'That is Techgram. The working formula is **STRONG PRIOR + ACTIVE SENSING + SMALL EVIDENCE + UNCERTAINTY MODEL + DECISION OPTIMIZER → USEFUL DECISION** — never "no data → magical intelligence."\n\n**Status [2026-10-04]:** this is no longer only doctrine — the cognitive runtime EXISTS and is gate-earned [ADR-035..046]: it decides, explains why, predicts itself, investigates itself, improves itself by tested experiments, expresses itself with provenance under an ethics wall, runs any curriculum through the World Adapter, and every layer has been traced in real time and measured by ablation. Evidence: `EXPERIMENTS_AND_TESTS.md` §17–§23; reports: `PHASE5_EXPERIMENT_REPORT.md`, `LAYER_INTERACTION_REPORT.md`. All evidence SIMULATED-world — real-student efficacy remains UNKNOWN UNTIL PILOT.');
}
write('02_NORTH_STAR.md', n);

// ── 10. docs/00_CHARTER.md — the freeze sentence, updated ──────────────────
let c = read('00_CHARTER.md');
if (!c.includes('2026-10-04 update')) {
  c = c.replace('and since ADR-031 the cognitive architecture is FROZEN (no new subsystems before real-user evidence).',
    'and since ADR-031 the cognitive architecture is FROZEN (no new subsystems before real-user evidence). **2026-10-04 update:** the founder explicitly directed the COGNITIVE RUNTIME (System B) above the frozen brain [ADR-035..046]; System A remains frozen exactly as signed, and its behavioral invariance is test-enforced (shadow-belief identity, purity deep-compares). The anti-Goodhart law now extends upward: the runtime may never rewrite evidence, the evaluator, or ground truth — proven by ablation.');
}
write('00_CHARTER.md', c);

// ── 11. docs/FOUNDER_GUIDE.md — Chapter 13 + stamp ─────────────────────────
let fg = read('FOUNDER_GUIDE.md');
if (!fg.includes('Chapter 13')) {
  const ch13 = [
    '---',
    '',
    '**Chapter 13 — the machine learned to know itself (4 Oct, the cognitive era).** You unfroze the brain for one purpose: make the intelligence itself more powerful. What was built above the frozen brain (which never changed — proven by tests that compare it to a shadow copy on every run) is a set of new layers that turn a calculating engine into something closer to a mind. It now **predicts its own behavior before every single decision**, and writes down every time reality proves it wrong. It **improves its own strategy** the scientific way: it proposes a change, tests it against a matched twin in a simulator, and adopts it only if it genuinely wins — twice, in the experiments, the same proposal was kept in one situation and rejected in another, because the evidence, not the machine\'s pride, decides. It **speaks** — every sentence carries its evidence, guilt and pressure phrases are physically impossible for it to say, it admits mistakes out loud ("I was about to step in again — my notes say I do that too early with you"), and it praises rarely, specifically, and only what it observed. It **runs any curriculum** — the same brain passed through UPSC Polity, CBSE Class 8 Science, and invented worlds without ever learning what those subjects are. And then it was tested the way you demanded: **thirty different scenarios** (students, worlds, hostile conditions) — it beat the old teacher in all thirty — and **twenty-four real-time student simulations** where every layer was watched working and then individually disconnected to measure how much each one matters: the aiming layer and the rest layer carry the machine, the self-knowledge layer watches and learns, and the discipline layer never sleeps. The one real weakness found — advanced students\' maps going stale — was fixed the same day, and the machine was made stronger: its self-knowledge now modulates it continuously, and its own error rate changes how confident it sounds and how willing it is to try alternatives. The honest footnote throughout: all of this is proven in simulations with declared rules. The final verdict belongs to real students — the pilot.',
    '',
    '**Chapter 14 — where you are now (4 Oct, night).** Phases 0–6 of the corrected roadmap are complete, each with its gate earned, and strengthened after the studies. What remains before real students: the **content floor** (your and your mentors\' hours — the true critical path), the rendered product demo, Wave-2 infrastructure, and the **pilot** — the only place the final question, "do real students learn better?", can be answered. Everything else is built, measured, and documented.',
  ].join('\n');
  fg = fg.replace('---\n\n*This guide is maintained under the documentation protocol', ch13 + '\n\n---\n\n*This guide is maintained under the documentation protocol');
}
fg = fg.replace('(latest: 2026-10-03, ADR-031 audit + Brain Freeze v0.1)', '(latest: 2026-10-04, ADR-046 — the cognitive era, Chapters 13–14)');
write('FOUNDER_GUIDE.md', fg);

console.log('SWEEP COMPLETE');
