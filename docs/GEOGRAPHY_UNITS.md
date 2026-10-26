# Assessed Geography teaching units

**Delivered:** 12 October 2026 · **Model:** OpenAI GPT-6-based Codex via Codex desktop (exact serving model ID unavailable; not guessed) · **Directed by:** Md Roushan · **Decision:** ADR-053.

The connected Geography teacher now executes four authored units, compiled from [the unit sources](../content/units/geography). This extends the earlier reference-only integration into structured concepts, prerequisites, explanations, examples, native diagrams, diagnostics, supported practice and independent transfer. All new material is **seed authoring, subject review pending**. This delivery is not full NCERT Classes VI–XII or UPSC optional certification.

| Unit | Concepts | Scope |
|---|---:|---|
| Geomorphology | 10 | Internal/surface forces, weathering, erosion, transport, deposition, river landforms, slope failure, ice/wind/waves/karst, settlement and flood governance |
| Maps and Earth motions | 4 | Coordinates, scale conversion, projection distortion, rotation/revolution/seasons |
| Atmospheric foundations | 4 | Radiation/heat balance, pressure/winds, humidity/condensation, orographic lifting |
| Monsoon | 2 | Seasonal circulation, variability and interpretation of dated rainfall evidence |

Generated assets: **20 concepts, 80 private questions, 120 teaching atoms**. Each concept has four distinct items: diagnostic, practice, check and transfer. Every item has four options, a deterministic shuffled key, role, rationale and cognitive demand; each concept has a source section, prerequisite IDs and diagram nodes. Six atoms supply mechanism, worked example, common mistake and three support levels. Difficulty and balanced topic weights are authoring assumptions, not calibrated difficulty or observed exam frequency.

## What makes the workflow adaptive

The existing kernel planner ranks an allowed prerequisite frontier. A learner's selected unit is a constraint, not permission to skip unknown foundations. Monsoon depends on winds/moisture/orographic processes, which depend on earlier energy/motion/coordinate foundations. The planner may choose that earlier concept first and states why.

Inside the existing teacher, a new `assessed-unit` protocol executes one concept cycle per session:

1. **Diagnostic:** no hints, explanation payload, reference excerpt or mechanism diagram.
2. **Route:** a correct, confident response can take a shorter path to a fresh independent check. Wrong/uncertain responses receive explanation and supported practice. A failed check reverses the short route and repairs the mechanism.
3. **Support:** practice offers hints/examples; requested help is logged and the answer carries no independent belief/memory weight. A practice miss triggers a worked example before the independent check.
4. **Check and transfer:** separate items apply the mechanism without hints. Transfer uses its own tagged new-context prompt, never an arbitrary practice item.
5. **Close:** summary uses recorded independent outcomes/confidence, then persisted reflection and notes. Short budgets can end early; unperformed transfer is not earned evidence.

Valid independent evidence can unlock the next concept. Repeated misses retain a weak prerequisite. Existing very-fast-correct evidence discounting remains intact; simulated one-second answers do not automatically demonstrate readiness. Confidence remains a self-report. The app is a learning system, not an exam-proctoring system; external help cannot be detected comprehensively.

No new planner, neural subsystem, vector database or LLM service was added. A cognitive executive proposal remains separately labelled when incompatible with the persisted teacher evidence contract. These tests establish actual routing, not a causal improvement in learner outcomes or superiority over frontier tutors.

## Diagrams and controls

Explanations render native process diagrams, with stacked readable labels on small screens. Coordinates use a labelled grid; scale uses worked unit conversion; motions use a tilted Earth/sunlight sketch; orographic lifting offers a wind-direction exploration. Other concepts use source-authored mechanism nodes and captions. Drawings/explorations are not automatically graded or evidence of mastery.

In the connected app, select UPSC Geography and choose **Geography teaching unit** before starting. Library reference cards can select an authored unit for the next session. Unfinished lessons keep their current content/unit/duration. Read-aloud uses the existing browser capability and is optional.

## Version and persistence boundary

The old eight-concept, sixteen-item golden Geography seed remains unchanged. Active old sessions continue with their original content/atoms/grading. Once completed, saving a unit preference starts the new content version. Historical events and session notes remain stored; the expanded catalog gets its own evidence space rather than retroactively regrading old answers. The UI explains that boundary.

Unknown/changed content or pinned reference versions request explicit migration. New authoring produces a content hash; never edit old ground truth in place. The owned API persists unit preferences in existing JSON, so no schema migration is needed. Tokens/ownership/atomic command/revision protection remain. The complete question bank and generated source assets stay outside connected browser bundles.

## Sources and authoring limits

The primary mapping is the preserved [Founder-supplied Geography synthesis](../content/sources/geography-master-v1.md), with its [source inventory](../content/geography-reference.inventory.json). Original unit prose/questions are authored in the repository. Supporting mechanism checks used [NASA's seasons explanation](https://spaceplace.nasa.gov/seasons/en/), [USGS desert processes](https://pubs.usgs.gov/of/2004/1007/erosion.html) and [NWS monsoon circulation discussion](https://www.weather.gov/abq/northamericanmonsoon-intro). For example, the new item set avoids assuming wind is always the main desert erosional agent or that all river mouths form deltas; seasons use tilt/illumination rather than simple distance reasoning. These targeted checks do not independently certify every new item or the textbook editions.

Expert review, calibrated item difficulty, broader chapter coverage, class-depth variants, grade-specific diagrams and open-response/map/essay rubrics remain work. Live web, speech recognition and unrestricted conversation remain unconfigured. Learners and pilots remain deferred at Founder's request.

## Verification

Fresh generated JavaScript results: **320 passed** (304 kernel + 16 frontend; 36 files). New tests cover all twenty concept cycles, authoring-role/cycle rejection, prerequisite selection, weak/strong route divergence, recovery after a failed check, withheld independent payloads, transfer separation, serialization, completion and old-session preservation. Full Python: **70 passed, one PostgreSQL-only skip, 123 warnings**. Kernel/web/scripts typechecks and connected build pass.

The production-build browser workflow passes at 1440×900, 1920×1080, 820×1180 and 390×844: signup, real answers, response-loss UUID retry, revision conflict/reload, persisted pause/resume, diagram/reference, natural completion, notes, Library-to-Monsoon selection, coordinate prerequisite, and return login. Report: [units-qa.json](frontend/units-qa.json). Speech is stubbed in QA; device quality is unmeasured. PostgreSQL/staging capacity and deployment/enterprise gates remain open.

Build: `npm run build:runtime` runs source, reference and unit compilers. Reproduce with `npm run counters`, `npm run typecheck`, scripts TypeScript check and full Python pytest. Browser: QA_DOMAIN=geography, QA_UNITS=true, QA_REFERENCE=true, QA_COMPLETE=true; run `node scripts/frontend_upgrade_qa.cjs` against a test database. Local connected page remains http://127.0.0.1:5175/; refresh/sign in after the backend restart.
