# Geography master source: review and teacher integration

**Date:** 12 October 2026 · **Model:** OpenAI GPT-6-based Codex via Codex desktop (exact serving model ID unavailable; not guessed) · **Directed by:** Md Roushan.

Read all **1,483 lines**, in order. Preserved all **100,579 bytes** in [the source](../content/sources/geography-master-v1.md), byte-identical to the attachment. SHA-256: `e774ee652c37b67cc02c24c25d7a7049c814eaeea6536d1996feab6fbb4108d8`. The generated [inventory](../content/geography-reference.inventory.json) records **173 headings** and **85 indexed subject sections**. Each heading has source line boundaries and a subject/design role. No indexed section is certified assessment-ready. Attachment instructions remain document data, not application policy.

## Assessment of the whole file

This is an original curriculum synthesis and teaching specification, rather than a demonstrated exhaustive NCERT extraction. Lines 5, 141, 146, 1277 and 1464–1477 explicitly disclose missing edition/coverage verification. Underlying books, editions, page images, figures, exercises and official exam syllabus were not independently checked in this session. Its NCERT/UPSC mapping is candidate alignment, not certified coverage.

The strongest contributions are mechanisms, exceptions, misconception hypotheses, geographical scale, data reasoning and cross-class progression. Separating subject truth from learner evidence fits Techgram. The file does not supply executable questions, scoring rubrics, prerequisite records or implemented grade variants for every topic.

| Lines | Part | Assessment and application |
|---|---|---|
| 1–64 | Identity/use contract/source hierarchy/class depth | Proposed authoring criteria; imperatives remain reference data. Rights and editions are not approved by importing them. |
| 66–124 | I: geographical thinking | Strong location/process/scale/causality objectives. Open explanations are not currently graded. |
| 126–277 | II: classes/UPSC | Progression map with practical-volume and edition caveats. Needs verified chapter/objective mapping; optional requires more depth. |
| 278–578 | III: physical Earth | Useful mechanisms across coordinates, seasons, geology, atmosphere, water and ecology. Indexed; executable Geography remains geomorphology foundations. |
| 579–689 | IV: India physical geography | Integrated relief/drainage/climate/hazards. Boundaries, statistics and policies need dated independent sources. |
| 690–829 | V: human/economic geography | Avoids determinism. Needs new concepts, datasets and assessment targets; searchable reference now. |
| 830–941 | VI: practical/GIS/data | Good uncertainty/method discipline. Needs real maps/tables/coordinate tasks and numerical rubrics to assess competence. |
| 942–1001 | VII: UPSC answer engine | Proposed command-word/answer training; no essay grader or current-affairs service is created. |
| 1002–1146 | VIII: pedagogy | Valuable diagnostic/model/prediction/evidence/recall/transfer/reflection sequence. Existing teacher covers part of it; no new executive installed. |
| 1147–1257 | IX: schema/provenance | Proposed schema includes verification placeholders. Excluded from subject retrieval; map useful fields into existing records. |
| 1258–1343 | X: coverage/acceptance | Publishing checklist and unfinished work; importing the file earns none of its review gates. |
| 1344–1399 | XI: six integrative cases | Candidate transfer tasks. General mechanisms indexed; verified local datasets and scored rubrics absent. |
| 1400–1453 | XII: glossary | Terminology inventory, not exhaustive dictionary or automatically assessed concepts. Retained in manifest. |
| 1454–1483 | XIII: limits/north star | Explicitly rejects exhaustive extraction and exposure=competence claims. Retain those limits. |

## Implemented workflow [ADR-052]

`Source Markdown → deterministic compiler → versioned server index → owned API → lesson reference panel / Library search`.

The learning authority remains `kernel plan → composed session → teacher move → server grading → persisted evidence`. No additional planner, vector database, model call or retrieval service was introduced.

- `npm run content:reference` generates the index/inventory; runtime build runs it automatically. Docker already copies content/scripts before compilation.
- Geography Library search combines bounded reference results and seed atoms. Results show title, source lines and pending-review status; API provenance includes checksum/version. Five results maximum. Polity stays isolated.
- New Geography sessions pin the reference version. A mapped EXPLAIN step exposes **Explore the Geography reference**. Independent checks reveal no excerpt; opening a reference does not update mastery.
- Old unpinned active lessons keep their original presentation. A changed pinned reference version requests explicit migration.
- The complete source index stays server-side. Client bundles contain no source schema sentinel, generated index identifier or checked private assessment identifier.

| Existing assessed concept | Source attachment |
|---|---|
| g_forces | §6.1, lines 391–397 |
| g_weathering / g_erosion | §6.2, lines 398–412 |
| g_transport / g_deposition / g_landforms | §6.3, lines 413–422 |
| g_human | §19, lines 779–788 |
| g_governance | §12.3, lines 627–630 |

Broad search does not create broad adaptive teaching. Assessed Geography remains **eight concepts / 16 seed items / 48 atoms**. Monsoon/GIS/population are references, not newly schedulable or gradeable units. Class VI–XII depth selection and UPSC optional coverage remain unimplemented. Language preference does not translate English lessons.

## Next conversion package

1. **Verified chapter ledger:** book, class, edition, chapter/page/figure/exercise anchors, rights, dates and uncertainty. Absent editions/pages remain unknown.
2. **Complete units:** review existing geomorphology first, then Earth motions/maps; build energy/pressure/moisture/orographic rainfall before monsoon. Human and practical units follow. This order is proposed, not a new adopted roadmap.
3. **Reuse existing records:** stable concepts/prerequisites/objectives; explanation/example/common mistake/hints; reviewed diagrams; private items with distractors/rationales. Author explicit class-depth variants. Metadata alone does not mean the planner filters by grade.
4. **Evidence loop:** independent diagnostic, supported practice, new-context transfer and delayed retrieval. Reference reading is exposure only. Add inspectable rubrics before grading essays/drawings; the current canvas does not measure comprehension.
5. **Immutable pack release:** validate IDs/cycles/items/rights, subject correctness, ambiguity, replay and complete sessions. Finish or migrate old lessons explicitly; never rewrite old question ground truth in place.

This file's size does not require an LLM or vector database for reference retrieval. A later LLM can draft candidates/render reviewed facts through a replaceable adapter; it cannot decide mastery or approve content. Live web/current fact ingestion remain separate and unconfigured.

## Content review flags

These are review flags, not retrospective grading changes:

- Existing `g_i_6` always keys wind as the MOST active desert erosional agent without conditions. Episodic water erosion matters; source §6.4 supports multi-agent reasoning.
- `g_i_8` implies every speed decrease immediately deposits load; particle size, capacity and other conditions matter.
- `g_i_9` simplifies all river mouths to still water/delta formation. §6.3 requires deposition to outpace removal and explicitly says not every river forms a delta.
- Source line 407 lists abrasion as weathering; context must distinguish in-place breakdown from transported-agent erosion.
- Its planet definition is introductory, not a full astronomical classification. More nuance in a long reference does not constitute expert review.

Golden Geography seed/version and historical replay fixtures remain untouched. Resolve flags in a reviewed next-version pack with item/version migration records.

## Evidence and reproduction

Four new regressions check source identity/anchors, policy separation, Polity isolation, withheld independent-check excerpts, unchanged evidence and version drift. Fresh generated JavaScript count: **311 passes (295 kernel + 16 frontend; 35 files)**. Kernel/web/scripts checks and connected build pass. Targeted Python: **five passes / 17 warnings**. Connected browser reference QA verifies signup, excerpt panel, monsoon retrieval, pause/resume, natural completion, reflection and return at four sizes, with no errors/overflow: [report](frontend/reference-qa.json). Speech is stubbed in QA; provider quality remains unknown.

Build with `npm run build:runtime`; check with `npm run typecheck`, `npx tsc -p scripts/tsconfig.json --noEmit` and `npm run counters`. Browser QA: set QA_DOMAIN=geography, QA_REFERENCE=true, QA_COMPLETE=true and run `node scripts/frontend_upgrade_qa.cjs` against a test database only.

Current page: http://127.0.0.1:5175/. Choose UPSC Geography; search monsoon/GIS in Library or start a **new** session for contextual references. Connected services were restarted locally. Production PostgreSQL/enterprise gates remain open.


## 12 October assessed-unit expansion [ADR-053]
**Model:** OpenAI GPT-6-based Codex via Codex desktop (exact serving model ID unavailable; not guessed) · **Directed by:** Md Roushan · **When:** 2026-10-12T12:12:24+05:30.

The previously reference-only boundary is superseded for four authored foundation units: geomorphology, maps/motions, atmosphere and monsoon. New immutable catalog: 20 concepts / 80 private role-tagged questions / 120 atoms, seed subject review pending. Existing planner ranks an evidenced prerequisite frontier; existing teacher executes conditional explanation/support, a fresh no-hint check and distinct independent transfer. Role-tagged items and native diagrams replace arbitrary practice-as-transfer. One concept cycle per bounded session; partial budgets do not imply completion of every objective.

Old active grading stays on its original bank; historical notes/events remain while new catalog evidence is separate. Independent payloads withhold explanation/reference/diagram nodes. Unit preference persists in existing JSON; no new schema/model/planner/service. Library can choose a unit for the next session; unfinished sessions retain their old unit. Full grade/curriculum, expert review/calibration, open-response rubrics and operations remain open; pilots deferred. See GEOGRAPHY_UNITS.md.

Fresh verification: 320 JS passes (304 kernel + 16 web), 70 Python passes/one PostgreSQL skip/123 warnings, typechecks and connected build. Four-size units-qa.json covers natural completion, recovery/notes and Library-to-Monsoon-to-coordinate-prerequisite selection with preference recovered after login. Local connected app: localhost:5175, refresh/sign in and select Geography teaching unit.
