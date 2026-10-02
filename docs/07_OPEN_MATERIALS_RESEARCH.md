# TECHGRAM — OPEN MATERIALS RESEARCH (K12 FEED)
## What we may legally and quality-wise feed the brain for K12. Researched 2026-10-02, ~14:45 (GLM-5.3-Flash via ZCode, directed by Founder).

---

## 1. THE LICENSING VERDICT (the decisive table)

| Source | License | Commercial use? | Verdict for Techgram |
|---|---|---|---|
| **NCERT textbooks** | © NCERT (Copyright Act 1957; 2024 advisory) | **NO — republication/reuse needs written permission** (free to download & read only) | **ALIGN, never ingest.** Curriculum structure/topics are facts — our atoms are original authorship aligned to their chapter structure. Permission route exists for later partnership. |
| **DIKSHA (Sunbird)** | Platform: MIT. Content: per-item OER, varies | Platform yes; content per-item | **Per-item license check before any use.** Great as curriculum-alignment reference (state boards). |
| **Khan Academy** | CC BY-NC-SA | **NO (non-commercial)** | Reference only. Never ingest into the product. |
| **OpenStax** | CC BY-NC-SA (whole library since transition) | **NO** | Reference only (their physics is superb as a correctness cross-check). |
| **CK-12 FlexBooks** | CC BY-NC | **NO** | Reference only. |
| **PhET simulations** | CC BY-NC 4.0 (HTML5); commercial via PhET-iO partnership / paid license | NO by default; paid path exists | **Defer.** If interactive sims matter later → PhET-iO partnership (budgeted decision, not a legal accident). |
| **Wikipedia text** | CC BY-SA (+GFDL) | **YES** — attribution + ShareAlike (adaptations must carry the same license) | **Usable with discipline:** attribute + share-alike applies to derived text; images checked per-file. Use for fact-grounding, prefer original phrasing. |
| **Original authorship + human verification** | Ours | YES — the asset is ours | **THE MODEL.** Same as UPSC: content compiler drafts → risk-weighted human verification → signed, versioned atoms. |

**The strategic conclusion:** the famous "free" K12 sources are mostly NON-COMMERCIAL. A commercial EdTech product's content must be **authored original, aligned to public curriculum structures** (facts, syllabi, and learning-outcome frameworks are not copyrightable), with sources cited as alignment references. This is exactly the architecture we already built — the research confirms it instead of forcing a pivot.

**Sources consulted:** NCERT press release/advisory (ncert.nic.in), NCERT CIET OER & licensing guidance (ciet.ncert.gov.in), DIKSHA/PIB/UNESCO fact sheets, Khan Academy support/licensing articles, OpenStax licensing help + licensing-transition blog, PhET licensing & PhET-iO partnership pages, Wikipedia:Reusing Wikipedia content + CC BY-SA 4.0 deed.

---

## 2. THE CURRICULUM ANCHOR (K12 seed v0)

**Chosen slice: CBSE Class 8 Science — physics chapters** (rationalized 2023-24 numbering): Force & Pressure (Ch 8), Friction (Ch 9), Light (Ch 13). Note: the new NCF-2023-aligned textbooks ("Curiosity") are renumbering/restructuring — our content is anchored to CONCEPTS (prerequisite-structured), so renumbering costs nothing.

**What was built (`kernel/src/k12_seed.ts`, commit `6eb4466`):**
- 3 topics · 14 concepts · prerequisite + confusability edges
- 25 items with misconception tags (e.g. "gravity is a contact force", "knife cuts by friction", "liquid pressure pushes down only")
- 21 original atoms (explanations, a worked pressure calculation, contrast atoms, hint ladder seeds)
- GoalSpec: **mastery-threshold payoff** — school test modelled as 40×1 mark, no negative marking, pass bar ≈33%

**Quality checks run (executable):** prior positive-definite on the K14 graph · weights derive to the 40-question paper · the FULL kernel loop (plan → compose → teach → evidence) runs on K12 content with zero code changes · 10-day closed loop shows true learning + honest tracking · tier discipline holds (every taught concept has a verified explanation atom).

**THE HEADLINE: goal-agnosticism is now proven, not claimed.** One brain — UPSC Polity and CBSE Class 8 Science are both just content config.

---

## 3. K12 QUALITY PRINCIPLES (what "verified" means for children)

1. **Simpler language, same epistemics** — atoms at reading level; envelopes/bands identical (a 13-year-old deserves honest uncertainty as much as an aspirant).
2. **Misconception-first authoring** — K12 physics misconceptions are famous and well-documented (gravity-as-contact, pressure-is-downward-only, heavier-objects-fall-faster); distractor tags encode them from day 1.
3. **Wellbeing wall is ABSOLUTE for minors** — when K12 students are eventually admitted (deferred per ADR-011 until compliance): stricter data minimisation, parental consent, verifiable parental controls, no behavioural ads ever, lighter load caps. The 18+ launch decision stands for the pilot; K12 content is *preparation*, not launch.
4. **Parents get receipts, not labels** — the parent report shows facts with intervals; the behaviour engine's flags never become "your child is X".
5. **Board variance is config** — CBSE today; ICSE/state boards are GoalSpec + graph variants, not forks.

---

## 4. WHAT WE DID NOT DO (honesty)

- No ingestion of any third-party text into the product.
- No claim that 84+21 atoms "covers" Class 8 — it's a seed proving the pipeline; full coverage is the content sprint (Founder + mentor verification hours remain the bottleneck).
- No minors product decisions taken — K12 launch compliance (DPDP child rules) is a later, deliberate ADR.
