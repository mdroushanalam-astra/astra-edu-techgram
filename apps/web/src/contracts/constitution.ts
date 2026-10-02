/**
 * SPRINT 0 — FRONTEND CONTRACTS [ADR-032]
 * ========================================
 * The typed boundary between the frozen kernel and the enterprise frontend
 * ("Intelligent Sanctuary"). Nothing in this folder imports the kernel —
 * the kernel-adapter maps kernel outputs INTO these types. A React
 * component may know `LearningState`; it may never know covariance.
 *
 * THE CONSTITUTION OF THIS FRONTEND (mechanical, CI-enforced):
 *   1. The frontend cannot generate educational truth. It renders layout,
 *      animation, transitions, interaction — never mastery, diagnosis,
 *      preferences, praise, recommendations, or progress claims.
 *   2. CLAIM PROVENANCE [ADR-032]: every student-facing utterance carries
 *      mandatory provenance — an evidence GRAPH (multi-reference), not a
 *      single ref, because honest sentences combine sources.
 *   3. The kernel decides WHAT; the Presence Layer decides HOW it is
 *      expressed (voice, gaze, gesture, timing, emphasis) — never WHAT.
 *   4. Voice is a capability-gated tier system; it is never a dependency
 *      for learning (Tier 0 text/tap is universal).
 *   5. Wrong answers are curiosity gaps, never punishment (no red).
 */
