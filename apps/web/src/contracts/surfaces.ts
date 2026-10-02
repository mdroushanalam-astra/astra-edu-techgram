/**
 * SPRINT 0 — SURFACES [ADR-032]
 * Six destinations. Two universal primitives (NOT screens — ChatGPT
 * refinement adopted: they are woven through every destination).
 * "Don't put everything on screen": intelligence is in selection.
 */

export type Surface =
  | "home"          // the room: greeting, today's plan + why, one-tap start/override
  | "session"       // the killer surface: hologram + blackboard + evidence (50% of build effort)
  | "brain_map"     // living grey-mist constellation; tap band → why + sharpen
  | "growth"        // THEN→NOW capability moments, milestones, watch-it-think reveals
  | "notebook"      // artifacts, board ink, curiosity ledger (endowment — theirs)
  | "settings";     // persona sliders (PreferenceState), voice, data, delete-everything

/** Universal primitives — available inside surfaces, never separate destinations. */
export type UniversalPrimitive =
  | "why_this"      // opens evidence + uncertainty + opportunity cost inline, anywhere
  | "agency_moment" // "you noticed your confidence was too high before I did" — contextual
  | "override";     // every recommendation overridable; response is evidence, not punishment
