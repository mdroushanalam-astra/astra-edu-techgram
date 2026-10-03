# TECHGRAM: THE FRONTEND EXPERIENCE GUIDE
## How the student-facing app should look, move, talk to the brain, handle interruptions, and keep Class 6–12 students coming back, honestly.

> **Who this is written for:** the founder, who has no coding or architecture background. Every technical word is explained the first time. Picture-heavy: there are screen sketches, storyboards and day-by-day tables because you said you cannot yet *see* the workflow.
>
> **How it was made:** from all 18 project documents as they stand on 3 Oct 2026 (Charter, North Star, Goals, Architecture, Roadmap, Frontend Blueprint, Decisions ADR-001 to ADR-033, Journal entries 00–23, Experiments, Current State, Vision Ledger, Brain-Freeze checklist, and the rest).
>
> **Facts vs opinions:** facts come from the documents. Anything marked **[MY PROPOSAL]** or **My honest view** is my own recommendation. You and the design team can overrule it. The documents' own rules (the Charter, the Brain Freeze, the Engagement Ethics Wall) are treated as binding.

---

# PART 0: THE FIVE-MINUTE VERSION

1. **Techgram's brain is finished and frozen. The frontend (what students see) is what is being redesigned.** The brain has 183 passing checks. It already decides what to teach, when, why, and how sure it is. The frontend must *show* that intelligence beautifully. It must never invent any of it.
2. **There is no "backend server" yet.** The brain is a code library that runs **inside the student's phone/laptop browser**. So "frontend talks to backend" currently means "the screen talks to the brain living in the same app", and a thin server comes later for syncing and safety.
3. **The frontend has been built twice and rejected twice** ("so boring", then "still fucked up"). Version 3 ("Warm Room", with *Astra* the guide and a human-style *Mentor*) is built end-to-end and works, but a **big visual and animation redesign is next**, led by you, live.
4. **Your target is now Classes 6 to 12 (about ages 11 to 18).** That is a bigger shift than it sounds. It changes the look (three age styles), the safety rules (children's data law, parent consent), and the content (only a small Class 8 science sample exists today). Section 2 explains this honestly.
5. **"Seductive and retentive" is achievable, but only the honest way.** The strongest pull is real: the app *remembers you*, shows *proof you are improving*, makes learning feel like a *place you belong*, and lets you *finish a good session in 10 minutes*. Your own rules ban guilt, fake urgency and gambling-style rewards. For children that is also the law and the right thing.
6. **The best technology is mostly what you already have** (Vite + React + TypeScript, IndexedDB, speech synthesis). Add a small, free, well-known set of tools for animation, maths display, sound, and a few safety and quality helpers (Section 12). Do **not** rewrite the stack.

---

# PART 1: WHERE THINGS STAND TODAY (SO YOU CAN SEE IT)

## 1.1 The restaurant picture

| In a restaurant | In Techgram |
|---|---|
| **The kitchen** (where decisions about food are made) | **The brain / kernel**: decides what the student studies next, how hard, and why. Frozen, tested, no AI model inside. |
| **The waiter** (carries orders both ways, never cooks) | **The adapter + Presence Layer**: translates between screen and brain, and turns brain decisions into *scenes* (who speaks, what appears on the board). |
| **The dining room** (what customers see and feel) | **The frontend**: Astra, the Mentor, the board, the study room, the animations. |
| **The menu** | **Content**: questions and lesson scripts (called "atoms"), verified by humans. |
| **The head chef's rule: "waiters never cook"** | **The Claim-Provenance law**: every sentence on screen must trace back to something the brain actually knows. The frontend cannot make up teaching facts. |

## 1.2 What exists right now (from the documents)

| Piece | Status | Plain meaning |
|---|---|---|
| Brain (kernel) | ✅ Built, **frozen** (ADR-031) | 174 checks; no new thinking-organs until real students use the product |
| Frontend v1 "Intelligent Sanctuary" (deep-space look) | ❌ Built, **rejected** ("so boring") | Mentor too small, stage empty, nothing moved |
| Frontend v2 "Warm Room" | ❌ Built, **rejected** ("still fucked up") | Closer to your boards, but the art, composition and motion did not reach your taste |
| Frontend v3 "Two-character build" (ADR-033) | ✅ **Built end-to-end**, browser-checked, 183 tests, ~81 KB compressed | Sign-up → The Meeting → mood-lit classroom → The Return → back to the room. Visually still needs the drastic pass. |
| Drastic visual + animation pass | ⏭ **Next**, founder-led and live | Mentor seated at the desk, your generated art swapped in, cinematic transitions, richer motion |
| Server (sync, login, push, nightly jobs) | ❌ Not built | "Wave 2". Everything is stored locally in the browser for now. |
| Content for Classes 6–12 | ⚠️ Tiny | Only a Class 8 science slice (3 topics, 14 concepts, 25 questions, 21 lesson scripts) plus UPSC Polity |

## 1.3 The two characters + the brain (so every screen makes sense)

```
        ┌────────────────────────────────────────────────────────┐
        │  THE BRAIN (frozen).  Decides.  Knows what is true.    │
        └──────────────┬───────────────────────────┬─────────────┘
                       │ decisions + evidence       │ events (what the student did)
                       ▼                            ▲
        ┌──────────────────────────┐   ┌──────────────────────────┐
        │  ASTRA  (the orb)        │   │  THE MENTOR  (teacher)   │
        │  the guide, the           │   │  sits with you at the    │
        │  "employee": meets you,   │   │  desk, teaches the       │
        │  explains the plan, hands │   │  session the brain       │
        │  you to the teacher,      │   │  planned. Expresses;     │
        │  debriefs afterwards      │   │  never invents.          │
        └──────────────────────────┘   └──────────────────────────┘
```

**Rule from ADR-033:** Astra controls the *conversation* (onboarding, plan presentation, handoffs, debrief, next-step options, nudge timing). She can **never** control the *truth*: what you know, what you should study, whether a misconception is confirmed. Those belong to the brain.

## 1.4 The honest summary of the frontend problem

The *engineering* of the frontend is in good shape. The *taste and feel* is the open problem. Two rejections in one day mean the way of working must change (live, side by side with your boards, art first, rich motion). Part 13 proposes how to run that session.

---

# PART 2: WHO WE ARE DESIGNING FOR: CLASSES 6 TO 12

## 2.1 One brain, three "skins"

A 11-year-old in Class 6 and a 17-year-old in Class 12 should not see the same app. Same brain, same rules, three looks and voices. **[MY PROPOSAL]**

| | **EXPLORER** (Classes 6–8, ~11–13) | **ACHIEVER** (Classes 9–10, ~14–15) | **PATHFINDER** (Classes 11–12, ~16–18) |
|---|---|---|---|
| **Main motivation** | Curiosity, play, being praised by a trusted adult | Not falling behind, board-exam fear, friends | Entrance exams (JEE/NEET/CUET etc.), future, independence |
| **Look** | Warmest, most characterful; bigger buttons, bigger illustrations | Balanced; more information visible | Calmest, densest, "grown-up" tools; least cartoonish |
| **Astra's voice** | Playful, short sentences, light jokes | Friendly coach, direct | Respectful peer-mentor, concise |
| **Session length (starting hypothesis)** | 20–25 min | 30–35 min | 40–50 min |
| **Reading load** | Voice-first; short text; picture-led | Mixed | Text-first is fine |
| **Typical device** | Shared family phone/tablet | Own phone, shared laptop | Own phone + laptop |
| **Parent role** | Needs the parent as consent-giver and sometimes co-user | Consent-giver; worried about exam results | Consent-giver (if under 18); wants autonomy |
| **Goals** | Understand and enjoy; build a base | Unit tests, term exams, **Class 10 boards** | **Class 12 boards + entrance exam** |
| **What "growth" looks like** | "I can now explain friction to my sister" | "I fixed my weak topics before boards" | "I can plan my own revision and see where marks leak" |

The three session lengths are **starting guesses**. The brain already measures each student's real best session length after a few days and replaces the guess (ADR-024).

## 2.2 ⚠️ Three honest flags about "Classes 6–12" (please read)

**Flag 1: your own documents currently say something different.**
- ADR-028 (2 Oct) planned a public beta for "Classes 6–10 + UPSC".
- ADR-031 (3 Oct, after the audit) ruled: *"first real cohort = adults preparing for UPSC. K12/minors stays behind the compliance ADR regardless of architectural readiness."*
- Your instruction today (Classes 6–12) is the newest. But nothing in the documents has yet *registered* it. **Decision for you:** either (a) record a new decision that supersedes ADR-031's cohort ruling and starts the compliance work, or (b) launch to adult UPSC aspirants first and design this frontend so it is *ready* for Classes 6–12. I recommend (b) as the first public step, with (a) running in parallel. See Part 14.

**Flag 2: children's data law.**
As I understand it, India's Digital Personal Data Protection Act (2023) requires a parent or guardian's **verifiable consent** before processing the data of anyone under 18, bans processing that harms a child's wellbeing, and **restricts tracking, behavioural monitoring and targeted advertising aimed at children** (the government can exempt some uses). Techgram's brain *works by* measuring behaviour (answer speed, hints, when you quit). Whether that counts as restricted "behavioural monitoring" or is covered by an educational exemption is a real legal question. **Spend an hour with a lawyer before any under-18 user touches the product.** Your own documents already assume this (Gate-5 compliance). The frontend design below includes the consent and control screens this will need.

**Flag 3: content.**
Today's content is one Class 8 physics sample. Classes 6–12 across several subjects means thousands of verified questions and lesson scripts. The Vision Ledger already says one full term of one subject is roughly 300+ items. The frontend can be beautiful, but a student who finds Class 9 maths missing leaves on Day 1. **Pick one class + one subject + one goal to launch with** (Part 14).

---

# PART 3: THE DESIGN LAWS (WHAT THE FRONTEND MUST FEEL LIKE)

These combine your design brief, ADR-032/033 and my additions.

| # | Law | In plain words | Source |
|---|---|---|---|
| 1 | **A place, not a dashboard** | It feels like a warm study room you walk into, not a list of tools | Founder brief, ADR-033 |
| 2 | **Quiet chrome, alive core** | Most of the screen is calm. The wonder lives in a few places: Astra, the mentor, the board, the transitions | ADR-032 (and your note: *err rich, not minimal*, Entry 19) |
| 3 | **Real magic only** | Anything that looks like "thinking" must be the brain really computing. No fake loading theatre | "Watch-It-Think law", Entry 16 |
| 4 | **No judgment** | A wrong answer is information. Colour for a mistake is a calm coral, never red or a buzzer | Founder brief, ADR-033 |
| 5 | **Bands, not scores** | Never one number a child can chase or hide behind. Show ranges, evidence and "what changed" | ADR-029/031 Anti-Goodhart |
| 6 | **Praise must be true** | "Whoa, that was yours, no hint" only when the evidence says so. If the session was poor: honest + supportive | ADR-033 praise policy |
| 7 | **Stillness is part of intelligence** | Astra and the mentor can go quiet while the student thinks. The system must be able to shut up | ADR-032 |
| 8 | **Interruption is welcome** | The student can say "wait" at any moment and the voice stops instantly | ADR-033 |
| 9 | **Student can override** | Every recommendation has "something else" and the system responds with evidence | Agency contract, ADR-030 |
| 10 | **Works anywhere** | Offline, cheap Android, slow data, voice off, sound off | Architecture §4 |
| 11 | **Kind to the clock** | Daily time caps, rest suggestions, no streak shaming, no night nagging for children | Charter §2.5, ADR-023 |
| 12 | **Honest about itself** | When Techgram was wrong about you, it says so on screen ("I thought diagrams worked for you; examples work better") | ADR-031 mismatch transparency |

---

# PART 4: THE SCREENS (SKETCHES YOU CAN SEE)

These sketches describe layout and feeling. They are *wireframes*, not final art. Final look comes from your generated illustrations plus the live redesign.

## 4.1 Welcome / "Who is studying?"

Needed because family phones are shared and the data lives on the device.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                  ◉  (the orb, softly breathing)       │
│                                                      │
│          "hi. who's studying today?"                  │
│                                                      │
│     ( Aarav ⌄ )   ( Meera ⌄ )   ( + new student )    │
│                                                      │
│     [ Continue ]                                      │
│                                                      │
│     grown-up? → open the Grown-up Door (small link)   │
└──────────────────────────────────────────────────────┘
```
- Under-18 profiles can have a **4-digit PIN** so a sibling cannot open them.
- **New student** → the Grown-up consent step first (Part 11), then the Meeting.

## 4.2 The Meeting (first-time onboarding)

Already built (ADR-033, S1). The idea: *it feels like meeting someone, not filling a form*.

```
┌─────────────────────────────────────────────────────────────┐
│   ◉ Astra (orb, top right)          ┌─────────────────────┐ │
│   ┌──────────────────────────┐      │   THE JOURNEY BOARD │ │
│   │ "give me a sec. I want to│      │   (chalk writes     │ │
│   │  actually look at what   │      │    itself live)     │ │
│   │  you told me."           │      │                     │ │
│   └──────────────────────────┘      │  NOW:   today       │ │
│                                     │  NEAR:  next 2 wks  │ │
│   [ looks right ] [ not quite ]     │  JOURNEY: where you │ │
│   [ how wrong am I? ]               │           are headed│ │
│                                     └─────────────────────┘ │
│   ( ✋ wait, I don't get this )                              │
└─────────────────────────────────────────────────────────────┘
```
**The sequence** (from ADR-033):
1. Auth/profile → **Layer A** details (name, goal, daily time, stage, a note about your journey).
2. Astra: "give me a sec…" → **a real pause** while the brain truly builds the goal map and first plan. *Never a fake spinner.*
3. She **reads you back** what she understood.
4. **"How wrong am I?"** gives permission to disagree.
5. **Layer B**: 3 behavioural questions ("when something gets hard I usually…"), stored as *hypotheses reality can later disprove*, never as personality labels.
6. **Three horizons**: NOW (precise), NEAR (7–14 days, provisional), JOURNEY (direction, no detailed-year promise).
7. Plan co-creation: **[Looks good] [Harder] [Lighter] [Something else]**.
8. **The handoff**: orb shifts amber → teaching cyan, "your teacher is ready, I'll be right here when you're done", the Mentor wakes.

**[MY PROPOSAL] for Classes 6–12:**
- Explorer: max ~4–5 minutes, mostly voice and tapping, one picture-based question instead of three text ones.
- Add a **"pick your mentor look"** step (cosmetic only; two or three characters, not gender- or ethnicity-coded as authority, per ADR-032).
- End the Meeting with a **taster mini-session (8–10 min)** so the very first visit ends with a real "oh, I actually got that" moment, not a settings page.

## 4.3 Home: "the study room"

```
┌──────────────────────────────────────────────────────────────┐
│  [window: night city, moon]     ◉ Astra (top-centre-right)    │
│                                  "morning, Aarav. yesterday   │
│  [bookshelf]  [plant]            you got stuck on friction.   │
│                                  I kept it for you."          │
│            ┌───────────────┐    ┌──────────────────────────┐  │
│   cat 🐱   │ THE MENTOR     │    │  TODAY'S PLAN (the board)│  │
│            │ seated at desk │    │  1. warm-up recall  6 min│  │
│            │ (alive: breathe│    │  2. friction        14   │  │
│            │  blink, glance)│    │  3. practice        10   │  │
│            └───────────────┘    │  why this? ▸            │  │
│                                  └──────────────────────────┘  │
│       [ ▶ Start today (about 30 min) ]   ( lighter day )       │
│                                                                │
│  Library · My Map · Growth · Notebook                  ⚙       │
└──────────────────────────────────────────────────────────────┘
```
- The greeting line is **memory made visible** (it is generated from real kernel data, e.g. "1 open question, yours").
- **"Why this?"** opens the receipt in kid-friendly words: *what I looked at → what I expect → what else I considered → what would change my mind.*
- **"Lighter day"** is first-class, never hidden. It is the anti-burnout valve.

## 4.4 The Classroom (the session, the killer surface)

```
┌───────────────────────────────────────────────────────────────┐
│ ◉ small orb  ·  "reasoning"  ·  14:20 ▒▒▒▒▒░░░░  segment 2/4 │  ← top bar (mood whisper)
├────────────────────────────┬──────────────────────────────────┤
│                            │   THE BOARD (chalk, glowing cyan)│
│   THE MENTOR               │                                  │
│   (alive, 40% of screen)   │   Pushing a box:                 │
│   speech bubble:           │     force ─►  [box]  ◄─ friction │
│   "notice what happens     │   (lines draw themselves as the  │
│    when the floor is rough"│    mentor speaks; the 'weak link'│
│                            │    pulses violet if a            │
│                            │    misconception is likely)      │
├────────────────────────────┴──────────────────────────────────┤
│ Q: A box is pushed but does not move. Friction is…            │
│   ( A ) bigger than the push   ( B ) smaller   ( C ) zero …   │
│  [ I'm not sure ]  [ hint ]  [ ask a doubt ]  [🎤 hold to talk] │
│  ✋ wait                                          why this? ▸   │
├───────────────────────────────────────────────────────────────┤
│ Understanding (ranges, never one score):  Friction ▓▓▓░░ ←→   │
└───────────────────────────────────────────────────────────────┘
```
**Mood light:** the whole room's light follows the interaction state (see Part 5): amber = orientation, violet = exploring ideas, teal = deep reasoning, quiet = retrieval, coral = gentle correction, gold = "eureka", soft green = consolidated.

**What happens on tap (kernel calls):** see Part 6.

## 4.5 The Return (after the session)

```
┌─────────────────────────────────────────────────────────┐
│   ◉ (amber)  "Hey. I'm back, Aarav."                    │
│                                                          │
│   BOARD: AFTER TODAY                                     │
│    ✓ strong, with evidence:  force & motion              │
│    ~ still uncertain:        friction on slopes          │
│    📝 your notes → cleaned up → Library                  │
│    tomorrow's plan updates the moment you leave          │
│                                                          │
│   "quick check: how was your energy?"  [low][okay][high] │
│   "how deep could you go today?"  [light][normal][deep]  │
│                                                          │
│   NEXT: A) 20-min repair tomorrow (I recommend this)     │
│         B) move on, revisit in 3 days                    │
│         ( something else )                               │
└─────────────────────────────────────────────────────────┘
```
Those two "how was your energy" taps become real evidence for tomorrow's plan.

## 4.6 My Map (the brain map)

A picture of what the student knows: topics as glowing regions.
- **Bright** = known, with evidence. **Pulsing** = being learned. **Grey mist = unknown** (and *unknown is not zero*). **A tiny "sharpen me?" tap** on mist turns it into a 3-question probe.
- Tap a topic → the concepts, how sure the system is, last seen, common confusions (with their "contrast" lessons).
- **Age adaptation:** Explorer = a **world/island map** where mist lifts; Achiever = a **subway-style graph**; Pathfinder = a **dense syllabus coverage map** with exam weights.

## 4.7 Growth

- **THEN / NOW** curves: not "you are 72%", but "three weeks ago you weren't sure about X; now you demonstrated it without a hint".
- **Capability Journey**: "things you can now do on your own" (the Capability Gain idea, ADR-028).
- **Changed-my-mind moments**: where Techgram admitted it was wrong about you.
- **Agency moments**: "you chose today's topic yourself." **Shown as moments and stage names, never a score** (ADR-030).

## 4.8 Notebook / Library

Where student questions and cleaned-up notes live. A question you ask mid-lesson ("why is the sky blue at noon but red at sunset?") is *parked* here, not lost, and **becomes curriculum later** (the Curiosity Ledger). The Library is the "I have a collection of my own thinking" feeling.

## 4.9 Mock / Test Lab

For unit tests and board-style mocks: the **marks-loss breakdown** (knowledge gaps, traps, careless, time pressure, guesses) and the guess-or-skip coach. For Classes 9–12 this may be the strongest "wow in 10 minutes" feature (ADR-026 calls it a *candidate* hook to test, not a proven one).

## 4.10 Settings and the Grown-up Door

Kid-friendly settings: voice on/off, sound, motion intensity, language (English / Hindi / Hinglish when content exists), text size, daily limit, break reminders, "delete my data" (real delete). The **Grown-up Door** is a small, separate area (Part 11).

---

# PART 5: LOOK, FEEL AND MOTION

## 5.1 Visual language

| Element | Direction | Notes |
|---|---|---|
| **World** | Warm lamp-lit night study room + holographic cyan chalkboard | From your vision boards ("the floor, not the ceiling") |
| **Palette (as design hypotheses)** | Warm amber = friend; teal = intelligence; violet = curiosity; coral = empathy/correction; green = consolidation | ADR-032/033. *Wrong ≠ red.* Red only for confirmed risk in the Map, and then softly |
| **Type** | Sora (headings), Inter (body), JetBrains Mono (numbers/code); add a **Devanagari font (Noto Sans Devanagari)** for Hindi | All open (OFL) |
| **Characters** | Astra = 3D-feeling colour orb + female voice. Mentor = stylised human at the desk | Not photoreal (ADR-032), art swapped in from your generated illustrations |
| **Density** | **Rich, never empty** | Your rejections said "not enough happening". Fill with life, not clutter |
| **Skins** | Explorer / Achiever / Pathfinder (Part 2) | Same layout bones, different art and copy |

## 5.2 Astra's states (the orb's "body language")

| State | Looks like | Means |
|---|---|---|
| Idle | Slow breathing glow, tiny drifting particles | Present, calm |
| Listening | Soft **cyan pulse** | "I'm hearing you" |
| Thinking | Dim **violet orbit** | The brain is really computing |
| Insight | **Amber expansion** | Something important found/learned |
| Celebrating | Brief **warm bloom** (one second) | A true, evidenced win |
| Correcting | Restrained **coral**, soft | A gentle "let's look at that" |
| Silence | Nearly still | Giving the student room to think |
| Fade | Dissolves to the edge | Handing over to the Mentor |

## 5.3 The Mentor's states

Idle (breathes, blinks, glances), speaking (lip movement driven by speech word-timing), thinking (looks to the board, hand on chin), pointing to the board, listening (turns toward you), happy (small, genuine), concerned (soft, attentive, never angry), waiting (patient), absent (steps away during student work, "the system must be able to shut up").

## 5.4 The board (the signature surface)

The board is the app's **external working memory**: it writes the plan in chalk, draws concept trees and causal chains, highlights in sync with words ("notice this" ↔ highlight at the same moment). Interactions:
- **Tap where the chain breaks** (misconception-tagged items drive this).
- **Drag to order** (sequence of an experiment).
- **Draw/annotate** with finger (use a natural ink library, Part 13).
- **Tap-to-expand** a formula; maths shown with proper notation.
- **Live toys** (Part 13): a friction slider, a ray-of-light mirror, a pressure demo, a graph you can pull.

## 5.5 Wonder moments (the 20% where engineering is allowed to show off)

These are *scheduled*, not constant, so each lands:

1. **The Real Pause** at the Meeting (the first impression that it is not a chatbot).
2. **Belief bands narrowing** after an answer (the "band shrinks" animation is the product's signature).
3. **The board writing itself** in sync with speech.
4. **Defeated Misconception**: a recurring confusion is shown as a small board "knot" that visibly unravels when the brain's tier drops (age-appropriate: "tricky idea" for Explorer, "the Art-19-vs-21 trap" for Pathfinder).
5. **Eureka bloom**: gold light + one line of true praise.
6. **Session trailer**: the last 20 seconds teases tomorrow's open loop ("tomorrow: why does ice float? you already know half the answer").
7. **Growth THEN/NOW reveal**, once a week.

## 5.6 Sound, haptics and intensity

- **Sound:** very soft (chalk, page, a warm chime). Off by default in public places. All meaning also visible (no sound-only cues).
- **Haptics (Android):** one tiny tick on correct and a soft pulse on "wait" for tactile feedback. Never on mistakes.
- **Intensity setting:** Calm / Normal / Lively, so a sensitive child or a low-end phone gets less motion without losing function. Respect the phone's **reduce-motion** setting.

## 5.7 Fallbacks (the cheap-phone promise)

| If the phone is… | Then… |
|---|---|
| Slow/old | 2D art layers with fewer particles; orb becomes a flat gradient; board animations simplified |
| Offline | Everything still works; sync later |
| Voice unavailable | Text-first mode (typewriter cadence keeps the same pauses) |
| Sound off | Captions/visual equivalents |
| Low battery | Dim effects, shorter ambient loops |

---

# PART 6: HOW THE FRONTEND TALKS TO THE BACKEND (THE BRAIN)

## 6.1 The big picture, in plain words

Today there is **no server in the loop**. The brain is a code library ("kernel") that the app imports. When the student taps an answer, the app hands that fact to the brain *on the same device*, the brain updates what it believes in a few milliseconds, and the app shows the result. Data is stored in the browser's own drawer (**IndexedDB**). A server is added later (Wave 2) to back up, verify and sync, and to send reminders.

```
 ┌─────────────────── ON THE STUDENT'S DEVICE ───────────────────────────┐
 │                                                                        │
 │  SCREEN (React)  ◄── scenes ──  PRESENCE LAYER  ◄── decisions ──┐      │
 │   Astra, Mentor,                 (who speaks, camera,           │      │
 │   Board, Buttons                  silence, timing)              │      │
 │        │ student taps/speaks                                    │      │
 │        ▼                                                        │      │
 │  CONDUCTOR (session manager) ── events ──►  KERNEL ADAPTER ─────┘      │
 │                                           (runs in a background        │
 │                                            thread so animation         │
 │                                            never freezes)              │
 │                                                  │                     │
 │                                                  ▼                     │
 │                                      THE BRAIN (frozen kernel)         │
 │                                                  │                     │
 │                          IndexedDB ◄─ saves ─────┘                     │
 └───────────────────────────────┬────────────────────────────────────────┘
                                 │ later (Wave 2): outbox of events
                                 ▼
                 ┌────────────────────────────────────────┐
                 │ SERVER: check-and-sync, login, backups, │
                 │ nightly plans, reminders, content packs │
                 └────────────────────────────────────────┘
```

## 6.2 The four kinds of message

| Message | Direction | Plain meaning | Example |
|---|---|---|---|
| **Event** | screen → brain | "The student did something" | `answered question q_017: option C, took 22 s, said "sure"` |
| **Decision request (slot)** | screen → brain | "What should go here?" | `NEXT_STEP_IN_SESSION`, `NEXT_SESSION`, `NOTIFICATION`, `FORECAST`, `MOCK_PLAN` |
| **Scene** | presence layer → screen | "Here's exactly what to show, no improvising" | `Mentor: EXPLAIN friction (atom a_212), board: draw box + arrows, orb: fade, camera: board-focus` |
| **Utterance (with provenance)** | inside a scene | "A sentence plus the evidence it comes from" | see 6.4 |

All four are *typed* (a strict form that code checks), so a wrong message is caught immediately rather than shown to a child.

## 6.3 The life of one tap (storyboard)

```
t = 0 ms      Student taps option C.
t = 10 ms     The screen shows the button pressed (instant feel, no waiting).
t = 15 ms     CONDUCTOR packages an EVENT {item, option, time, confidence}.
t = 20 ms     KERNEL ADAPTER sends it to the brain (background thread).
t = 25–60 ms  BRAIN: updates belief (and related topics), memory timing,
              misconception counters; logs a receipt; picks the next move.
t = 70 ms     PRESENCE LAYER turns the move into a SCENE:
              "Mentor: attentive (not angry). Orb: coral, soft. Board: highlight
               the weak link. Utterance with evidence link."
t = 90 ms     SCREEN animates the scene (band narrows, board glows, speech starts).
t = 100 ms    IndexedDB saves the event (so a crash loses nothing).
```
(Timings are targets on a mid-range phone, to be measured on a real cheap Android.)

## 6.4 The "claim provenance" rule, shown as an example

Every sentence Astra or the Mentor says carries its evidence, and a check refuses to display it otherwise.

```
UTTERANCE
  text:        "Nice, that one was yours. No hint."
  evidenceRefs:[ event#2041 (correct, no hint), decision#d77 (retrieval move) ]
  uncertainty: band 0.46–0.78, n_eff 3.2
  rendering:   warm, brief (praise policy: true + specific)
  humor:       authored line #h12 (no generated jokes)
```
If any piece is missing, the line **is not shown**. This is why the app cannot "lie nicely".

## 6.5 Why the brain should run in a background thread

The brain sometimes does heavy work (for example, 2,000 simulated exam days for the forecast). If that ran on the same thread as the animation, the orb would stutter. **[MY PROPOSAL]** run the kernel in a **Web Worker** (a background worker inside the browser) and talk to it through a small helper (Comlink, Part 12). Animations then stay smooth on cheap phones. This changes *no* kernel code (the freeze stays intact); it is only how the app calls it.

## 6.6 Saving, offline, and syncing (plain words)

| Topic | How it works |
|---|---|
| **Saving** | Every event goes into IndexedDB immediately. State is *rebuilt* from the saved events (the diary idea). |
| **Offline** | Nothing needs the internet during a session. |
| **Sync (later)** | Events wait in an "outbox", like letters in a post box. When online they are sent. The server re-reads the diary itself ("recompute and verify") and compares, so a tampered phone cannot corrupt truth. |
| **If the phone is lost** | Today: data lost (it is local-only!). That is a real problem for children's families. Add an **export/backup code** now, real sync in Wave 2. |
| **If two tabs are open** | Use a lock so only one writes (a "web lock") to avoid double events. |
| **If the clock is changed** | Use server time when synced; flag impossible time jumps; never trust a device clock for spacing calculations alone. |
| **App updates** | A new version waits until the current session ends (never mid-lesson). |

## 6.7 What the frontend may and may not do (because the brain is frozen)

| ✅ Allowed | ❌ Not allowed (needs a new decision and evidence) |
|---|---|
| Render scenes, animate, play voice, sound | Create new learning decisions or "smart" rules |
| Collect events and self-reports (tap-chips) | Invent new cognitive subsystems or planning modes |
| Add UI settings (intensity, language, text size) | Show a single mastery score, rank, or leaderboard |
| Read all brain outputs (plan, receipts, bands) | Change what counts as "mastered" |
| Log presentation-layer events (e.g. interruption counts) | Add new brain event types without an ADR (the freeze allows a *frontend-discovered hole* to be raised with evidence) |

## 6.8 What happens when something goes wrong

| Problem | What the student sees | What the system does |
|---|---|---|
| Brain throws an error | Astra: "hmm, I lost my place. let me reload that." Session resumes from last saved segment | Log the error (no personal data), fall back to the last good plan |
| Storage full/denied | Gentle prompt to free space or export | Ask for persistent storage; protect the current session in memory |
| Voice engine fails | Text-first with same pacing | Switch voice tier automatically |
| Art fails to load | Flat, clean fallback scene | Lazy-load with retries |
| Internet drops | Nothing changes | Sync later |
| Student closes the app mid-segment | Next open: "want to pick up where we left off?" | Resume from the last saved event |

---

# PART 7: THE SESSION, MINUTE BY MINUTE (A 40-MINUTE EXAMPLE FOR ACHIEVER)

For Explorer shorten each part; for Pathfinder add a transfer task. Every row names the brain call so the frontend team knows nothing is made up.

| Min | What the student sees and hears | Scene / camera | Brain call |
|---|---|---|---|
| 0:00 | Room fades up. Astra: "Hey Aarav. Yesterday you cracked pressure. Today friction." Mentor glances up | Wide shot, warm amber | `NEXT_SESSION` plan, `MEMORY_OPEN` line |
| 0:30 | Handoff: orb fades; Mentor: "Ready? Warm-up first." | Mentor close-up | `composeSession` |
| 1:00 | **Warm-up recall**: 3 quick questions, no hints, quiet room | Retrieval quiet light | `RETRIEVAL_PROMPT` × 3 |
| 6:00 | Mentor: "two of three; one slipped." Band narrows on screen | Board-focus | `observe` events, belief update |
| 7:00 | **Teach**: Mentor explains friction using a push-the-box drawing; board writes itself | Violet exploring → teal reasoning | `EXPLAIN` (atom chosen by brain) |
| 12:00 | Student taps **✋ wait, I don't get this** | Voice stops instantly; orb cyan; Mentor leans in | interruption (Part 8) |
| 14:00 | Mentor re-explains with a different example | Same scene, new atom | `WORKED_EXAMPLE` |
| 18:00 | **Check**: one question; student picks the trap option confidently | Coral, soft | `observe`, misconception counter +2 |
| 19:00 | **Contrast**: two ideas side by side, difference highlighted; the "knot" appears on the board | Board dominates | `CONTRAST` |
| 24:00 | **Practice** with hint ladder (cue → remove one option → reason) | Reasoning teal | `HINT_L1/L2/L3` |
| 30:00 | Student answers without a hint: gold bloom, "that one was yours" | Eureka gold | evidenced praise only |
| 33:00 | **Break check**: "your answers got slower over the last 9 questions; want a 5-minute break?" | Room dims slightly | `BreakPolicy` (measured fatigue) |
| 37:00 | **Calibration**: "how sure are you about friction now? (1–5)" | Quiet | `CALIBRATION_PROMPT` |
| 39:00 | Mentor closes with a true summary; hands back to Astra | Orb returns amber | `SUMMARISE_CLOSE` |
| 40:00+ | **The Return** (Part 4.5) | Amber | debrief + two options |

**Note:** the session shape comes from the Session Composer (warm-up → teach/practice → calibration wrap). The **minutes shift for each student** after the brain measures their real tolerance.

---

# PART 8: INTERRUPTIONS: THE FULL PLAYBOOK

Interruptions are normal for students aged 11–18 (siblings, parents, notifications, boredom, doubts). The design principle: **never punish, never lose progress, always offer a way back in under 5 seconds.**

## 8.1 Interruptions the student starts

| # | Interruption | What the student does | What they see/hear | What gets recorded | What the brain/app does after |
|---|---|---|---|---|---|
| 1 | **"Wait"** (didn't catch it) | Taps ✋ or says "wait" | Voice stops at once. Orb cyan. Astra: "Yep, stop me there. Which part?" chips: [start that again] [why this?] [I disagree] | Interruption timestamp + segment (presentation event); `help_requested` if the kernel already has it | Re-run the move with a different phrasing/atom |
| 2 | **"I don't get this"** | Taps or says it | Mentor slows down, offers [simpler example] [show a picture] [do one together] | `help_requested`, concept id | Brain may switch to `WORKED_EXAMPLE`, lower difficulty |
| 3 | **"Why am I doing this?"** | Taps Why this? | The receipt in kid words, overlay with kernel thinking | `explanation_read_time` | Return to the move, nothing lost |
| 4 | **Off-topic doubt** | Taps *Ask a doubt* | Mentor: "good question. park it, or answer it now?" [park in notebook] [answer now] | Curiosity ledger item | If answerable from verified atoms, answer. Otherwise saved for a mentor/thread. Never an invented answer. |
| 5 | **"I'm not sure"** (instead of guessing) | Taps button | Mentor: "good, that's useful. I'll count it as 'not yet'." | Low-confidence report | Treated as evidence of uncertainty, not as wrong |
| 6 | **"Skip"** | Taps skip | One gentle ask: [too hard] [too easy] [not now] | `content_skipped`, reason | Adjust difficulty/order; no guilt text |
| 7 | **"I'm bored"** | Taps mood-chip (if present) or leaves | Mentor offers [a 2-minute challenge] [switch topic] [short break] | Self-report | Move to a challenge or shorten the session |
| 8 | **"I want to stop"** | Taps *finish* | "No problem. Want me to save where we are?" [save and stop] [one last tiny one] | `session_abandoned` (with minute) | Return screen runs a *short* version; tomorrow's plan lightens |
| 9 | **"I disagree with the plan"** | Taps [I disagree] | Astra asks "what feels off?" [too hard] [too easy] [wrong topic] [something else] | Agency observation (proposed-with-reason) | Brain re-plans with the student's input and says what changed |
| 10 | **Hold-to-talk** (voice) | Presses mic | Orb listening pulse, captions appear | Transcript → evidence | If speech fails, offer typing |

## 8.2 Interruptions the world starts

| # | Interruption | Detect | What the student sees | System action |
|---|---|---|---|---|
| 11 | **Phone call / switched app** | Page hidden event | Everything pauses silently | Save state; on return: "welcome back, want to continue from here?" |
| 12 | **Screen locks** | Same | Same | Voice stops; resume possible |
| 13 | **Internet drops** | Network event | Nothing changes (offline) | Queue events for sync |
| 14 | **Battery low** | Battery hint if supported | Astra: "your battery's low. shall I save and wrap up in 5 min?" | Reduce animation, short close |
| 15 | **Parent/sibling walks in** | Student taps *pause* | "Paused. I'll hold your place." | Hold state; auto-timeout after long idle |
| 16 | **Long silence (60+ s)** | Idle timer | Astra stays quiet at 30 s, then a soft orb pulse at 60 s, then "still there? no rush." | Do not log as failure |
| 17 | **Very long idle (10+ min)** | Idle timer | "I'll save this for you." | Save, end session gracefully |
| 18 | **App update available** | Service worker | Nothing during session | Apply at next open |
| 19 | **Second device opens same profile** | Sync (later) | "Opened on another device. Continue here?" | Last-writer rules with server verification |
| 20 | **Bad audio / noisy room** | Poor ASR confidence | Offer text/typing | Voice tier drops quietly |

## 8.3 The resume rules (so nothing feels lost)

1. **Resume at the last completed segment boundary** if the interruption lasted more than ~10 minutes; otherwise resume mid-segment.
2. **Never repeat a question the student already answered** unless the brain schedules it for spaced retrieval.
3. **Never show "you left!"** or any guilt line. The only message: "welcome back."
4. **Interrupted time still counts as time studied**, but only measured active time feeds fatigue calculations.
5. **The Return screen adapts:** a session cut short gets a 30-second debrief and a gentle plan, not a full report.

## 8.4 Sample scripts (tone check, Explorer vs Pathfinder)

| Moment | Explorer (Class 6–8) | Pathfinder (Class 11–12) |
|---|---|---|
| "Wait" | "Yep, stop me there! Which bit got fuzzy?" | "Stopped. Which step lost you?" |
| Long silence | "Take your time, brain-explorer. I'll hum quietly." | "No rush. I'll be here." |
| Wrong answer | "Ooh, close! That's a classic mix-up. Let's peek at why." | "That's the standard trap here. Let's look at the difference." |
| True win | "Whoa. That one was all you!" | "That was clean. No hint, correct." |
| End | "Good work today. Tomorrow's mystery: why does ice float?" | "Solid session. Tomorrow I'll test whether this stuck." |

(All lines must still carry provenance. Jokes come from an authored library, never generated on the fly.)

---

# PART 9: RETENTION: WHY STUDENTS COME BACK (HONESTLY)

## 9.1 First, the reframe

You asked for "seductive and retentive". Your own documents (Charter §2.5, ADR-023) already say **no** to manipulation: no guilt, no false urgency, no gambling-style variable rewards, no emotional targeting. For children, such tactics are also being regulated in India. The good news: the **honest toolkit is genuinely stronger over months**, because it builds a reason to return that students themselves would defend.

The research frame is Self-Determination Theory: people return to things that give them **autonomy** (my choice), **competence** (I'm getting better and can see it), and **relatedness** (someone knows me).

## 9.2 The reasons to return, by time horizon

| Horizon | The honest hook | How the frontend shows it |
|---|---|---|
| **Within a session** | A feeling of being *understood* and *getting it* | Responsive Mentor, band narrowing, "that one was yours" |
| **Next day** | **Continuity**: "I kept your question for you" | Greeting line from memory; yesterday's ink still on the board; open loop from the trailer |
| **3 days** | **Spaced review feels like magic**: "do you still have it?" | A short recall; success proves the memory model works |
| **Week** | **Growth proof**: THEN/NOW reveal | Weekly "what changed" moment |
| **Month** | **Capability journey**: "8 things you can now do alone" | Capability moments (not a score) |
| **Season/year** | **Direction and readiness**: "boards in 120 days, here's where you stand" | Honest forecast range (a scenario, never a promise) |
| **Always** | **Belonging**: a place with a character who is on your side | The room, the cat, the plant, the lamp. Small constant details |

## 9.3 Engagement ideas that pass the ethics wall **[MY PROPOSALS]**

| Idea | Why it is honest | Age notes |
|---|---|---|
| **Tiny-win mode** ("just 8 minutes today") | Lowers the cost of showing up on bad days | Essential for Explorer and exam stress |
| **Curiosity ledger / parked questions** | Real student questions become tomorrow's lesson | Makes curiosity feel valued |
| **Defeated misconception** | A visible, earned win against a repeated mistake | Rename per age ("tricky idea" vs "trap") |
| **Mentor remembers small things** | Memory is the strongest attachment honestly earned | Uses only stored, true facts |
| **Choose-your-next-step (two options)** | Autonomy, plus Agency Transfer | Already in the Return |
| **Weekly "me vs last month" board** | Competence evidence | Skip comparisons to other students |
| **Study-buddy invitation (post-beta)** | Relatedness | Only after consent/moderation ADR, never named-peer comparison for minors (ADR-028) |
| **Mentor/parent "good news" card (opt-in)** | Adults notice real progress | Facts and ranges only; student sees exactly what the adult sees |
| **Seasonal rhythm** (exam-countdown mode, holiday light mode) | Matches the real school year | Triage mode near boards |

## 9.4 What we will NOT do (and why)

| Banned | Why |
|---|---|
| Streak-loss shame ("you broke a 12-day streak!") | Guilt; punishes sick days; harms wellbeing |
| Leaderboards and rank vs classmates | Demotivates most students; named-peer comparison for minors is excluded |
| Slot-machine rewards, loot boxes | Variable-reward exploitation |
| Fake countdowns or "only today" offers | False urgency |
| Notifications at night, guilt copy, or more than one per day | Ethics wall + the brain's own policy (≤1 per day, back-off after 2 ignored) |
| A single "mastery %" or XP bar | Goodhart's law: students chase the number instead of learning |
| "Your friends are ahead of you" | Social pressure |

## 9.5 Notifications **[MY PROPOSAL, built on the brain's rules]**

- The brain decides *whether and when* (about 15 min before the student's measured usual time; skip if the plan is done; halve after two ignored).
- Copy is warm and specific: *"your 6-minute recall on friction is ready. whenever you like."* Never guilt.
- For under-16s: **no notifications after a set evening hour** (parents can change it).
- Delivery depends on the phone and internet; the *decision* is the brain's. Do not claim reminders work offline.

## 9.6 How retention is measured (the pilot's four layers)

Learning · Retention (does knowledge survive) · Decision quality · **Agency** (is the student getting better at running their own learning). Return-rate experiments only use the curated, ethics-checked registry of mechanisms (ADR-025), with logged propensities.

---

# PART 10: STUDENT JOURNEYS: DAY 1, 2, 3 … TO THE FINAL GOAL

All details below are **[MY PROPOSAL]**, built from the documented mechanics. Where a mechanism is already in the brain, it is named. "Final goal" depends on the class.

## 10.1 NEW STUDENT: the first 14 days (example: Aarav, Class 9, aiming at boards in ~150 days)

| Day | What the student experiences | What the brain/app does | Why it keeps them |
|---|---|---|---|
| **0 (install)** | Pick profile → grown-up consent → **The Meeting** (≈6–8 min) → a **10-minute taster session** → The Return | Builds goal map + first plan; takes Layer A/B answers as *hypotheses*; short diagnostic via information-gain questions | A real "I got that" in the first 15 minutes; feels understood |
| **1** | Greeting that remembers: "yesterday you got pressure. today friction." 25-min plan. One true praise moment | Plan from yesterday's evidence; spaced-review due items for tomorrow set | Continuity, small win |
| **2** | **First recall**: "do you still have yesterday?" 6-minute warm-up before new work | Memory model checks forgetting; reviews scheduled by exam-date value | The surprise of *remembering* |
| **3** | **First misconception contrast** (if one appeared): two ideas side by side; a "knot" on the board | Misconception tier candidate → probable | "It noticed my exact mix-up" |
| **4** | Optional **lighter day** if energy was low (from Return chips) | Planner halves minutes if fatigue/load says so, with a receipt | Shows the app respects them |
| **5** | **Mini-test** (10 questions) → **marks-loss mini breakdown** (gaps / traps / careless) | Post-mortem rules; first attempt-policy hint | The "wow, it explains my mistakes" feature |
| **6** | Weekend: **free exploration**: ask doubts, play with a physics toy, or rest | Curiosity ledger; no plan pressure | Choice (autonomy) |
| **7** | **Week-1 Growth moment**: THEN/NOW; map shows mist lifting; Astra refreshes the three horizons | Capability journey, horizons refresh | First visible proof; reason to continue |
| **8–10** | The student starts getting **choices** ("pick today's topic?") | Agency observations (proposed vs accepted) | Ownership |
| **11–12** | Mentor remembers: "you like worked examples first. I checked: you improve more with them." | Preference learning (a measured hypothesis, with n) | Feels personal, but honest |
| **13** | **Changed-my-mind moment** if the brain was wrong about a preference | Mismatch transparency | Trust: "it admits mistakes" |
| **14** | **Two-week review** with Astra: what's working, what's tiring; invite a grown-up view (opt-in) | Evidence-based plan edits | Social proof from the adult, if wanted |

## 10.2 Weeks 3 to 12 (the habit and the middle)

| Period | Student experience | System behaviour |
|---|---|---|
| **Weeks 3–4** | Rhythm forms; the app learns the best study window; first **unit test** and post-mortem | Chronotype window (only when logged), nudge timing; load caps |
| **Month 2** | First **capability moments** ("independently demonstrated 5 things you couldn't at the start"); transfer tasks; a "Defeated misconception" celebration | Capability Gain measured; confirmed misconception resolved |
| **Month 3** | Student starts **proposing** the plan; Astra evaluates and agrees or explains why not | Agency stage shifts toward *shared* |
| **Month 4+** | Exam-countdown mode appears when boards approach; revision beats new content | Triage mode (consolidation, mocks), forecast range |
| **Exam week** | Light, calm mode: short recalls, sleep reminders, no new topics | Wellbeing-first plan |
| **After the exam** | "How did it go?" (optional result entry) | Outcome label with consent, mock→real calibration |

## 10.3 Final goals by class **[MY PROPOSAL]**

| Class | Final goal the journey points to | What "done" looks like for the student |
|---|---|---|
| 6–8 | Strong foundations, curiosity, school unit tests | "I can explain it myself"; capabilities list grows; confident in school tests |
| 9–10 | **Class 10 boards** (and foundation for Class 11 streams) | Weak topics repaired in time; mock results explained; calm exam week |
| 11–12 | **Class 12 boards + entrance exam** (goal-spec per exam) | Own revision planning; marks leaks fixed; attempt strategy coached; independent decisions (Agency stage "student-led") |

The deeper end-state from ADR-027: *the student ends up knowing what they understand, what they don't, how they get stuck, how to recover, how to test themselves, and can see themselves becoming more capable.* **Techgram teaches the student what learning themselves looks like.**

## 10.4 EXISTING STUDENT: the scenarios the app must handle gracefully

| Scenario | What the student sees | System does |
|---|---|---|
| **A. Back the next morning** | Room warms; "good morning, Aarav. here's today." | Normal flow |
| **B. Missed 2–3 days** | "Welcome back. No catch-up lecture. Here's a gentle 12-minute refresh." No streak-break message | Lighter plan; reviews prioritised by decay; belief probe "what got in the way?" only if the pattern persists |
| **C. Gone 2+ weeks** | "Some things faded. That's normal. Want a 10-minute 'what do I still have' check?" | Memory decay reflected honestly; bands widen; quick re-diagnostic |
| **D. Right before a test** | "Test in 3 days. Here's the highest-value 25 minutes." | Triage mode, forecast scenario with assumptions |
| **E. After a bad test result** | "That's tough. Want to see exactly where the marks went?" (no pity, no hype) | Post-mortem; supportive; if repeated distress signals, gentle "talk to someone you trust" line, never a diagnosis |
| **F. New academic year / next class** | "New year. I'm bringing what you know into Class 10." | New GoalSpec; evidence carries over |
| **G. Shared family phone** | Profile picker + PIN | Separate stores per profile; no cross-visibility |
| **H. New phone or lost phone** | "Enter your recovery code" (today) / sign-in (Wave 2) | Export/import; later server restore |
| **I. Changes goal** (school exam → Olympiad) | "Okay, new direction. Let me redraw the map." | New GoalSpec; history kept |
| **J. Wants to quit the app** | Honest exit: "Want me to export your notes? Your data is deleted when you say." | Real delete + export, no guilt |

---

# PART 11: THE GROWN-UP LAYER AND SAFETY (REQUIRED FOR UNDER-18s)

## 11.1 The Grown-up Door (compliance, not a parent dashboard)

Your documents deferred parent *reports*. For minors you still need a **small, mandatory grown-up area**:

| Feature | Purpose |
|---|---|
| **Consent step at first use** (verifiable method decided with your lawyer) | Legal requirement for under-18s as I understand it |
| **Privacy summary in plain words** | "Here is what Techgram stores, why, and where." |
| **Controls** | Daily time limit, quiet hours, notification on/off, voice-in on/off (default **off** for children), delete all data, export data |
| **Transparency** | The student can see exactly what any grown-up sees |
| **Optional weekly "good news" card (opt-in, later)** | Facts with ranges; never labels; never a ranking |

## 11.2 Safety design for children

| Area | Rule |
|---|---|
| **No strangers** | No open chat. Social features (study rooms) wait for a consent + moderation decision |
| **No free-form LLM chat for kids at launch** | Doubts answered only from verified atoms or parked for a human (the doubt cascade is gated on content coverage) |
| **No ads, no third-party trackers** | Avoid analytics SDKs that profile users; use first-party, minimal, on-device measurement |
| **Time wellbeing** | Daily cap, break prompts, evening quiet hours for under-16s |
| **Distress signals** | The brain never diagnoses. A pattern of withdrawal leads to lighter plans and a soft "it's okay to talk to someone you trust" line, with guardian-visible resource info if configured |
| **Content safety** | All text from verified atoms; reading-level checks; report-a-mistake button on every lesson line |
| **Accessibility** | See Part 12.4 |
| **Data location** | On-device by default (a real privacy advantage) |

---

# PART 12: THE TECH STACK

## 12.1 Keep what you have (do not rewrite)

| Layer | Current | Verdict |
|---|---|---|
| App framework | Vite + React + TypeScript (PWA, ~81 KB compressed) | **Keep.** Fast, small, same language as the brain |
| Brain | TypeScript package (`@techgram/kernel`) | **Keep, frozen** |
| Storage | IndexedDB (local-only) | **Keep.** Add backup/export, then Wave-2 sync |
| Voice out | Browser speech synthesis with a quality probe | **Keep.** Add better optional voices (12.2) |
| Art | Hand-coded SVG/CSS with ART-SWAP slots | **Replace with your generated art in the slots.** The slots already exist |
| Design tokens | `tokens.css` / theme CSS | **Keep, extend** with age skins |

## 12.2 Add (small, free, mainstream) **[MY PROPOSAL]**

| Need | Recommended | Why (plain words) | Phase |
|---|---|---|---|
| **State machines for characters** (orb/mentor states) | **XState** | Describes "idle → listening → thinking → speaking" as a clean diagram that code obeys; ideal for the Presence Layer | Redesign |
| **Character & orb animation** | **Rive** (state-machine animation, small files) with **Lottie** for simple effects | Interactive, lightweight, runs on cheap phones; art team can edit animations without code | Redesign |
| **UI motion** | **Motion (Framer Motion)** and/or **GSAP** | Page transitions, springy cards, timelines | Redesign |
| **3D orb** (optional, capable devices only) | **React Three Fiber + drei** (three.js) | Gorgeous orb; fall back to 2D on weak devices | Later |
| **Hand-drawn board look** | **rough.js** + **perfect-freehand** | Chalk/ink strokes that feel human | Redesign |
| **Maths notation** (essential for 9–12) | **KaTeX** (display), **MathLive** (student input) | Beautiful equations, fast, offline | Early |
| **Graphs and geometry toys** | **JSXGraph**, **Mafs**, **Function Plot**, **Chart.js** | Interactive graphs without paid tools | Redesign |
| **Physics toys** (friction, forces, pressure) | **Matter.js** (2D physics) | The Class 8 sample (forces, friction, pressure) comes alive | Redesign |
| **Background thread for the brain** | **Web Worker + Comlink** | Smooth animation while the brain computes | Redesign |
| **Sound** | **Howler.js** (effects), **Tone.js** (if you want generative ambient) | Soft, cross-browser audio | Redesign |
| **Offline/PWA** | **vite-plugin-pwa / Workbox** | Installable, offline-first, safe updates | Wave 2 prep |
| **Local DB helper** | **Dexie** | Simpler IndexedDB | Early |
| **Accessible components** | **Radix UI** primitives | Keyboard, screen-reader, focus handled correctly | Redesign |
| **Translations** | **i18next** | English/Hindi/Hinglish switching | Early |
| **Gestures** | **@use-gesture** | Drag, swipe, press-and-hold for the mic | Redesign |
| **Voice in (opt-in)** | **Whisper via transformers.js** + **Silero VAD** | Fully on-device speech recognition, no data leaves the phone | Later (opt-in; off for children by default) |
| **Better voices (optional)** | **Piper** or **Kokoro** TTS | Natural offline voices (check each voice's licence) | Later |
| **Component workshop** | **Storybook** | See every state of Astra/Mentor/board in isolation; great for design reviews with you | Redesign |
| **UI testing** | **Playwright** + **axe-core** | Tests that click through the app; automatic accessibility checks | Wave 2 |
| **Performance checks** | **Lighthouse CI**, **web-vitals** | Prevent slow builds creeping in | Wave 2 |

## 12.3 The stack decision you offered to make: web vs desktop vs app store

| Option | Verdict |
|---|---|
| **Keep the web stack (PWA)** | ✅ **Recommended now.** Students are on phones; the brain is TypeScript; no rewrite; installable; offline |
| **Wrap it as an Android app later with Capacitor** | ✅ Good second step: Play Store presence, more reliable notifications, same code |
| **Desktop version with Tauri** | Optional later for school labs and laptops, same code |
| **Switch to a different language/framework** | ❌ Not justified. It would throw away the working kernel adapter and gain little |

**Why this answers your "desktop-first is on the table" note:** the kernel is TypeScript and can run anywhere. Keep one codebase; wrap it as needed.

## 12.4 Quality bars (so it is "world class", measurably)

| Bar | Target (starting budgets; validate on real hardware) |
|---|---|
| **First load** | Under 300 KB compressed for the core (currently ~81 KB) + lazy-loaded art |
| **Speed** | Opens usable in a few seconds on a mid-range Android on slow data; animations at a steady 60 fps during sessions |
| **Test device** | A **real cheap Android phone** (borrowing one is free) plus a 5-year-old laptop |
| **Accessibility** | WCAG 2.2 AA: colour contrast, keyboard use, screen-reader labels, **never colour-only meaning**, captions for all speech, reduce-motion honoured |
| **Reading** | Explorer copy at a reading level matched to the class; a readable-font option (e.g. Lexend; evidence for dyslexia benefit is mixed, so offer it as a comfort choice) |
| **Languages** | English first; Hindi/Hinglish when verified content exists (the `lang` field is ready) |
| **Offline** | Complete session offline from first open after install |
| **Privacy** | On-device by default; no third-party trackers for minors |

---

# PART 13: WHERE TO FIND WORLD-CLASS FEATURES FOR FREE

**Always check each licence.** Terms change, and some "free" resources are free only for non-commercial use. Your own research (docs/07) already found that Khan Academy, OpenStax, CK-12 and PhET are non-commercial and must not be put into the product.

| You want… | Free / open options | Licence note |
|---|---|---|
| **Animated characters** | Rive (runtime open-source, editor free plan), LottieFiles (free animations), Spine ✗ (paid) | Check Lottie files individually; avoid Live2D (licence) |
| **Illustrations** | Your **own generated art** (best), unDraw, Open Peeps, Storyset, Humaaans | Many are free for commercial use with conditions; read terms |
| **Icons** | Lucide, Phosphor, Tabler, Heroicons | Open (ISC/MIT) |
| **Fonts** | Google Fonts (Sora, Inter, Lexend, Noto Sans Devanagari), Fontsource | Open (OFL) |
| **Sound effects** | Freesound (filter to CC0), Kenney.nl audio (CC0), Mixkit | Prefer CC0; credit when required |
| **Game-style art & UI kits** | Kenney.nl (CC0), OpenGameArt (varied) | Prefer CC0; check each pack |
| **3D / hologram effects** | three.js examples, React Three Fiber, "drei" helpers, Shadertoy ideas (re-implement, don't copy blindly) | Open for libraries; shaders have own licences |
| **Maths display and input** | KaTeX, MathLive | MIT |
| **Interactive graphs / geometry** | JSXGraph, Mafs, Function Plot, Chart.js, D3 | Open. **GeoGebra is free for non-commercial only** — avoid in a commercial product. Desmos API: check terms |
| **Physics / science toys** | Matter.js, p5.js, three.js, your own simple canvases | Open. **PhET is non-commercial by default** (use ideas, not their code) |
| **Chalk / ink feel** | rough.js, perfect-freehand, rough-notation | MIT |
| **Voice (speech out)** | Browser speech synthesis (free), Piper, Kokoro | Check each voice's licence |
| **Voice (speech in)** | Whisper via transformers.js, Vosk, Silero VAD | Open; opt-in only; off for children by default |
| **Hindi / Indian languages** | Noto fonts, i18next, AI4Bharat tools (IndicTrans2) for *authoring* help, Bhashini | Use for drafting; human-verify everything |
| **Design tools** | Figma free plan (layouts), Penpot (open-source), Excalidraw (sketches), Storybook (components) | Free tiers have limits |
| **Hosting** | Cloudflare Pages / Netlify / Vercel free tiers | Limits and terms change; plan to pay later |
| **Testing & quality** | Playwright, axe-core, Lighthouse, WebPageTest | Open/free |
| **Error tracking** | Sentry free tier (turn off personal data) | For minors, minimise or self-host |
| **Inspiration** | Duolingo (character delight), Headspace (calm), Brilliant (interactive explanations), Notion (clean minimal), Apple Fitness rings (earned visuals), Pixar-style rigging references | Study the *feeling*, never copy assets |

**My honest view on "free":** the tools are free. The scarce thing is **a person with taste to assemble them**. Two rejected builds in a day suggests that an hour or two per week from a **human UI/motion designer** (even a student intern or freelancer) will pay back more than another tool.

---

# PART 14: HOW TO BUILD IT FROM HERE

## 14.1 The live redesign session protocol (your own rules from Entry 19, made concrete)

**Before the session (1 hour of prep):**
1. Put your generated art (mentor, room, props) in a folder with transparent backgrounds (PNG/WebP/SVG) and clear names.
2. Collect your vision boards in one place with each target screen.
3. Decide: Explorer / Achiever / Pathfinder, which one first? (Recommendation: start with **Achiever**, the middle; the others derive from it.)

**During the session (you watch live):**
1. **Art swap-in first** into the existing ART-SWAP slots, then judge layout.
2. **One screen at a time**, side by side with its board. Approve or change before moving on.
3. **Motion and density rich**: add, then trim.
4. **Record decisions** as you go (screenshots + a short note per screen).
5. **Stop rule:** if two screens are rejected twice, change method (reference grab from a designer, simpler art direction).

## 14.2 Build order **[MY PROPOSAL]**

| Step | Deliverable | Gate |
|---|---|---|
| 1 | Redesign pass (art, composition, motion) on Home + Classroom only | Your approval, side by side with boards |
| 2 | Presence Layer state machines (XState) + Rive characters | All states visible in Storybook |
| 3 | Brain moved to a background worker | Same results, smoother animation |
| 4 | Interruption playbook (Part 8) implemented for the top 10 cases | A scripted interruption test passes |
| 5 | Age skins (Explorer/Achiever/Pathfinder) as theme + copy packs | Each skin passes the same test script |
| 6 | Grown-up Door + consent + export/backup | Lawyer review |
| 7 | Maths/graph toys for one subject | Student can use them offline |
| 8 | Performance & accessibility pass on real cheap Android | Budgets met |
| 9 | **G4 Product Experience Gate** (below) | Tested with real students, 5 per age band |
| 10 | Deploy decision (Gate-2) and Wave 2 (sync, login) | Founder decision |

## 14.3 The G4 test (what "good" means, measured)

Run with **5 real students per band** (with parent consent) after the redesign:

| Test | Pass looks like |
|---|---|
| **Time to first "wow"** | Under 90 seconds from opening the app |
| **Meeting completion** | At least 4 of 5 finish onboarding without help |
| **Comprehension of "Why this?"** | Student can say in their own words why today's plan was chosen |
| **Interruption recovery** | Student recovers from "wait / call / lock-screen" in under 10 seconds |
| **Return screen** | Student understands the two next-step options |
| **"Was it alive?" rating** | Mentor/board feel alive, not a "PowerPoint with a glowing person beside it" (your own bar) |
| **No-confusion on bands** | Student can read a range without asking what it means |
| **Comfort** | No motion-sickness, readable text, works one-handed |
| **Next-day return intent** | Student says they'd come back, *and then actually does* in the following days |

## 14.4 Decisions I need from you

| # | Decision | My default |
|---|---|---|
| 1 | Launch order: adult UPSC first, or Classes 6–12 first? (Records a new ADR either way.) | Adults first; design now for 6–12; start the compliance work in parallel |
| 2 | Which class + subject + goal for the first student launch? | One class, one subject (e.g. Class 9 or 10 science/maths) with a board goal |
| 3 | Which age skin first? | Achiever (Classes 9–10) |
| 4 | Who is the human designer/motion artist, even part-time? | One person, a few hours a week |
| 5 | Who verifies school content (a real teacher)? | One experienced subject teacher |
| 6 | Voice: default on or off? | Voice **on** for Explorer, off-by-default recording/voice-in for all minors |
| 7 | Where do generated art files live and who exports them in layers? | A shared folder; you export, we integrate |
| 8 | Hindi/Hinglish from day one? | Only after English content is verified; design for it now |
| 9 | Lawyer hour for DPDP/children | Yes, before any under-18 user |
| 10 | Android wrapper (Capacitor) after the PWA works? | Yes, later |

---

# PART 15: MY HONEST CRITIQUE

1. **Retention is decided here, not in the brain.** The brain can be perfect and a child still leaves if the first 90 seconds feel flat. The redesign deserves the same discipline the brain got (tests, gates, pre-written success numbers). Use the G4 test.
2. **Visual taste is the bottleneck.** Two rejections show it. Give the project a human with strong taste and motion skills, even for a few hours a week. The rest of the stack is easy.
3. **Be careful with "seductive".** For Classes 6–12, the honest version is both the legal one and the winning one. A child (and a parent) who trusts the app returns for a year. A hooked-and-guilted child churns and tells friends.
4. **Don't over-build characters.** Two characters (Astra + Mentor) is already a lot of animation. Start with one gorgeous seated Mentor and one orb, get them *alive*, then add.
5. **Voice quality is a gamble.** Free browser voices vary a lot by phone; some sound robotic and can make a "friend" feel fake. Offer text-first with excellent pacing, then upgrade voices as an option, and test on real phones.
6. **Content breadth will decide first impressions.** A beautiful room with a single Class 8 chapter disappoints. Choose a small, deep launch slice and say so honestly.
7. **Local-only storage is a risk for families.** Lost phones and shared devices are common. Build export/recovery now.
8. **The "alive" feeling is mostly small things:** blink timing, a glance when you tap, the pause before a line, the cat shifting. Put 20% of your polish time there.
9. **Keep the claims honest:** never "your child will score X", never a bare "% chance". Show ranges and "what would change my mind".
10. **Finally, a good sign:** the architecture held. The frontend consumed the frozen brain with zero kernel changes across three redesigns. The next version only needs to be *felt*, not re-engineered.

---

# APPENDIX A: SAMPLE SCENE OBJECT (SO YOUR DESIGNER CAN SEE THE DATA)

```
SCENE  (what the screen receives; it never decides anything)
  id: scene_0188
  phase: TEACH
  move: EXPLAIN  (concept: friction_basic, atom: a_212 v3, variant: B)
  presence:
     orb:    state=fade
     mentor: state=speaking, gaze=board, gesture=point-left
  camera: board-focus (hold 6 s, then return to two-shot)
  voiceIntent: { pace: calm, energy: medium, pauseBeforeMs: 400,
                 pauseAfterMs: 800, emphasis: ["rough"], interruptible: true }
  board: [ draw(box), draw(arrow: push), draw(arrow: friction),
           highlight(link: surface_roughness, weakLink: true) ]
  mood: reasoning-teal
  utterances: [ { text: "...", evidenceRefs: [...], uncertainty: {...} } ]
  fallback: text-first card with same content
```

# APPENDIX B: FIVE-LINE GLOSSARY

- **Kernel / brain:** the frozen decision engine.
- **Presence Layer:** the translator that turns decisions into who-speaks-what-and-when.
- **Atom:** one verified lesson/hint/explanation piece.
- **Band:** a range showing what we know and how sure we are.
- **Receipt:** the "why this?" record behind every recommendation.

---

*End of guide. Companion documents: `TECHGRAM_NOTEBOOK.md` (strategy), `TECHGRAM_BRAIN_V1_EXECUTION.md` (brain build), and your project's `docs/06_FRONTEND_BLUEPRINT.md` and ADR-032/033 (frontend decisions).*
