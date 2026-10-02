/**
 * K12 SEED — CBSE Class 8 Science (physics slice): Force & Pressure, Friction, Light.
 * [ADR-020 — K12 as GoalSpec + content config; ZERO kernel changes. The 18+
 * launch decision is untouched: this pack is ahead-of-schedule content prep,
 * and the goal-agnosticism proof for the kernel.]
 *
 * LICENSING (researched 2026-10-02, see docs/07_OPEN_MATERIALS_RESEARCH.md):
 * NCERT textbooks are copyrighted (republication needs written permission);
 * Khan Academy / OpenStax / CK-12 / PhET are CC BY-NC (non-commercial).
 * THEREFORE: every atom/item here is ORIGINAL authorship aligned to the
 * CBSE/NCERT curriculum STRUCTURE (facts and syllabus structure are not
 * copyrightable). Sources are cited as alignment references, never ingested
 * text. Verified for factual accuracy against standard physics.
 */

import {
  assembleContent, type Concept, type Content, type ExamSpec, type Item, type Topic,
} from "./content.js";

export const K12_CONTENT_VERSION = "k12-cbse-8sci-0.1.0";

/**
 * K12 "exam" = mastery-threshold goal, not a marks maximisation paper.
 * We model term assessment as 40 questions × 1 mark, no negative marking
 * (school tests), cutoff = the mastery bar expressed as a pass mark (33%).
 */
export const K12_EXAM_SPEC: ExamSpec = {
  questions: 40,
  marksEach: 1,
  negativeFraction: 0,
  guessFloor: 0.25,
  cutoff: { mean: 33, sd: 4 }, // pass threshold ≈ 33%
  attemptBreakEven: 0.25, // no negative marking → always attempt
};

const TOPICS: Topic[] = [
  { id: "k_force", name: "Force & Pressure", examQuestions: 16 },
  { id: "k_fric", name: "Friction", examQuestions: 12 },
  { id: "k_light", name: "Light", examQuestions: 12 },
];

const CONCEPTS: Concept[] = [
  // Force & Pressure
  { id: "k_f_def", topicId: "k_force", name: "What is Force (push/pull)", type: "conceptual", prereqs: [], confusableWith: [] },
  { id: "k_f_effect", topicId: "k_force", name: "Effects of Force (motion, shape)", type: "conceptual", prereqs: ["k_f_def"], confusableWith: [] },
  { id: "k_f_contact", topicId: "k_force", name: "Contact vs Non-contact Forces", type: "conceptual", prereqs: ["k_f_def"], confusableWith: ["k_f_noncontact"] },
  { id: "k_f_noncontact", topicId: "k_force", name: "Non-contact Forces (gravity, magnetism, electrostatic)", type: "conceptual", prereqs: ["k_f_def"], confusableWith: ["k_f_contact"] },
  { id: "k_p_def", topicId: "k_force", name: "Pressure = Force / Area", type: "conceptual", prereqs: ["k_f_def"], confusableWith: [] },
  { id: "k_p_fluid", topicId: "k_force", name: "Pressure in Liquids & Gases", type: "applied", prereqs: ["k_p_def"], confusableWith: [] },
  // Friction
  { id: "k_fr_def", topicId: "k_fric", name: "Friction: the opposing force", type: "conceptual", prereqs: ["k_f_def"], confusableWith: [] },
  { id: "k_fr_cause", topicId: "k_fric", name: "Cause of Friction (surface interlocking)", type: "conceptual", prereqs: ["k_fr_def"], confusableWith: [] },
  { id: "k_fr_fluid", topicId: "k_fric", name: "Fluid Friction (drag) & Streamlining", type: "applied", prereqs: ["k_fr_def"], confusableWith: [] },
  { id: "k_fr_goodbad", topicId: "k_fric", name: "Friction: friend and foe", type: "conceptual", prereqs: ["k_fr_def"], confusableWith: [] },
  // Light
  { id: "k_l_refl", topicId: "k_light", name: "Reflection of Light", type: "conceptual", prereqs: [], confusableWith: [] },
  { id: "k_l_laws", topicId: "k_light", name: "Laws of Reflection & Plane Mirrors", type: "conceptual", prereqs: ["k_l_refl"], confusableWith: [] },
  { id: "k_l_regular", topicId: "k_light", name: "Regular vs Diffuse Reflection", type: "conceptual", prereqs: ["k_l_laws"], confusableWith: [] },
  { id: "k_l_eye", topicId: "k_light", name: "The Human Eye & Braille", type: "factual", prereqs: ["k_l_refl"], confusableWith: [] },
];

/** [id, conceptId, stem, options, answer, difficulty, expectedTimeSec, dimension, distractorTags] */
type ItemDef = [string, string, string, [string, string, string, string], number, number, number, Item["dimension"], Record<number, string>?];

const ITEMS: ItemDef[] = [
  // Force basics
  ["k_i_1", "k_f_def", "A force is best described as—", ["A push or a pull", "Only a pull", "Only a push", "A form of energy stored in objects"], 0, 1, 30, "recall"],
  ["k_i_2", "k_f_def", "Kicking a football and lifting a bag have one thing in common — both apply—", ["A force", "A pressure", "A friction", "A reflection"], 0, 1, 25, "recall"],
  ["k_i_3", "k_f_effect", "A force can change—", ["Only the speed of a moving object", "Only the direction of motion", "Only the shape of objects", "An object's speed, direction of motion, or shape"], 3, 2, 40, "conceptual"],
  ["k_i_4", "k_f_effect", "Pressing a rubber ball with your hand changes its—", ["Shape only", "Speed only", "Direction only", "Neither shape nor motion"], 0, 2, 35, "conceptual", { 3: "m_k_force_no_effect" }],
  // Contact vs non-contact
  ["k_i_5", "k_f_contact", "Which is a CONTACT force?", ["Muscular force while pushing a trolley", "Magnetic force", "Gravitational force", "Electrostatic force"], 0, 2, 35, "recall", { 2: "m_k_gravity_contact" }],
  ["k_i_6", "k_f_noncontact", "A compass needle swings without touching the magnet. This is—", ["Muscular force", "Friction", "Magnetic (non-contact) force", "Pressure"], 2, 2, 40, "conceptual"],
  ["k_i_7", "k_f_noncontact", "An apple falls from a tree because of—", ["Air pressure", "Gravitational (non-contact) force", "Friction from the branch", "Electrostatic force"], 1, 1, 30, "recall"],
  // Pressure
  ["k_i_8", "k_p_def", "Pressure is defined as—", ["Force × Area", "Force ÷ Area", "Area ÷ Force", "Force + Area"], 1, 1, 30, "recall"],
  ["k_i_9", "k_p_def", "A sharp knife cuts better than a blunt one because—", ["It has less weight", "Its smaller area increases pressure on the surface", "It has more friction", "It is shinier"], 1, 2, 45, "conceptual", { 2: "m_k_knife_friction" }],
  ["k_i_10", "k_p_def", "Camel's broad feet help it walk on sand because they—", ["Increase pressure on sand", "Decrease pressure by increasing area", "Reduce gravity", "Increase friction"], 1, 2, 45, "conceptual"],
  ["k_i_11", "k_p_fluid", "Water pressure at the bottom of a container is—", ["Less than at the top", "Equal to air pressure only", "Greater than at the top", "Zero"], 2, 2, 35, "conceptual"],
  ["k_i_12", "k_p_fluid", "Liquids and gases exert pressure—", ["Only downward", "On the walls and bottom of their container, in all directions", "Only on the bottom", "Only upward"], 1, 2, 40, "conceptual", { 0: "m_k_pressure_down_only" }],
  // Friction
  ["k_i_13", "k_fr_def", "Friction always acts—", ["In the direction of motion", "Opposite to the direction of relative motion", "Perpendicular to motion", "Downward only"], 1, 2, 35, "conceptual"],
  ["k_i_14", "k_fr_cause", "Friction is caused mainly by—", ["Magnetism between surfaces", "Irregularities (roughness) interlocking between surfaces", "Air pressure differences", "Weight of the object"], 1, 2, 40, "conceptual", { 3: "m_k_friction_weight" }],
  ["k_i_15", "k_fr_fluid", "Sharks and airplanes have streamlined shapes to—", ["Increase fluid friction (drag)", "Reduce fluid friction (drag)", "Increase weight", "Improve looks"], 1, 2, 40, "conceptual"],
  ["k_i_16", "k_fr_goodbad", "Which is an example of friction being USEFUL?", ["Worn-out shoe soles", "Being able to walk without slipping", "Machines heating up", "Fuel wastage"], 1, 2, 35, "conceptual"],
  ["k_i_17", "k_fr_goodbad", "Sprinkling talcum powder on a carrom board—", ["Increases friction", "Decreases friction", "Has no effect", "Reverses motion"], 1, 1, 30, "recall"],
  // Light
  ["k_i_18", "k_l_refl", "Light bounces back from a surface. This is called—", ["Refraction", "Reflection", "Absorption", "Diffusion"], 1, 1, 25, "recall"],
  ["k_i_19", "k_l_laws", "The angle of incidence is ALWAYS equal to—", ["The angle of refraction", "The angle of reflection", "90 degrees", "Half the angle of reflection"], 1, 2, 35, "recall", { 0: "m_k_refraction_confusion" }],
  ["k_i_20", "k_l_laws", "Your image in a PLANE mirror appears—", ["Same size, laterally inverted", "Smaller and upright", "Larger and inverted", "Same size, not inverted"], 0, 2, 40, "conceptual"],
  ["k_i_21", "k_l_regular", "A rough wall reflects light—", ["Regularly, forming images", "Diffusely (scattered in many directions)", "Without reflecting anything", "Only at night"], 1, 2, 40, "conceptual"],
  ["k_i_22", "k_l_regular", "A mirror gives a clear image but a wall does not, because the mirror—", ["Absorbs light", "Has a smooth surface causing regular reflection", "Is white", "Is thin"], 1, 2, 40, "conceptual", { 0: "m_k_absorption_mirrors" }],
  ["k_i_23", "k_l_eye", "The sense organ that lets us see is—", ["The ear", "The eye", "The skin", "The nose"], 1, 1, 20, "recall"],
  ["k_i_24", "k_l_eye", "Visually challenged people read using—", ["Braille script (raised dots)", "Reflection charts", "Magnets", "Sound mirrors"], 0, 1, 30, "recall"],
  ["k_i_25", "k_l_laws", "In a plane mirror, the 'lateral inversion' means—", ["The image is upside down", "Left and right appear swapped", "The image is bigger", "The image is behind you"], 1, 2, 35, "conceptual"],
];

export function buildK12Content(): Content {
  const items: Item[] = ITEMS.map(
    ([id, conceptId, stem, options, answer, difficulty, timeSec, dimension, tags]) => ({
      id, conceptId, stem, options, answer, difficulty, expectedTimeSec: timeSec,
      dimension, distractorTags: tags ?? {},
    }),
  );
  return assembleContent(K12_CONTENT_VERSION, K12_EXAM_SPEC, TOPICS, CONCEPTS, items);
}

// ---------------------------------------------------------------------------
// K12 atoms — original authorship aligned to NCERT Class 8 Science structure
// (Ch. Force & Pressure / Friction / Light). Facts from standard physics;
// phrasing is ours. Sources cited as alignment references.
// ---------------------------------------------------------------------------

import { assembleAtomBank, type Atom, type AtomBank } from "./atoms.js";

export const K12_ATOM_BANK_VERSION = "k12-cbse-8sci-atoms-0.1.0";
const V = "founder+GLM review pass 1";

type A = [string, string | undefined, Atom["kind"], string, string, Atom["riskLevel"]];

const RAW: A[] = [
  ["ka_f_def_e", "k_f_def", "explanation",
    "A force is simply a PUSH or a PULL. Kicking a ball, opening a door, tugging a rope — every one is a force. Forces cannot be seen, only their EFFECTS can.",
    "aligned to NCERT Class 8 Science, Force & Pressure", "fact"],
  ["ka_f_effect_e", "k_f_effect", "explanation",
    "A force can do three things: start or change the SPEED of a moving object, change its DIRECTION, or change its SHAPE. Squeezing a sponge changes shape; a batsman's shot changes direction and speed.",
    "aligned to NCERT Force & Pressure", "fact"],
  ["ka_f_contact_e", "k_f_contact", "explanation",
    "CONTACT forces need touching: muscular force, friction. NON-CONTACT forces act from a distance: gravity pulls an apple without the tree touching it, magnets move compass needles, a rubbed comb picks up paper electrostatically.",
    "aligned to NCERT Force & Pressure", "fact"],
  ["ka_f_contact_c", undefined, "contrast",
    "CONTRAST — contact vs non-contact: ask 'did anything TOUCH?' Pushing a trolley = touch = contact/muscular. An apple falling = nothing touched it = gravity = non-contact. Magnetic and electrostatic are ALWAYS non-contact.",
    "confusability teaching", "fact"],
  ["ka_f_noncontact_e", "k_f_noncontact", "explanation",
    "Non-contact forces act WITHOUT touching: gravity pulls everything toward the Earth, magnets attract iron across a gap, a rubbed comb lifts tiny paper bits by electrostatic force. The moment something has to TOUCH to act — that's muscular or friction, its contact cousins.",
    "aligned to NCERT Force & Pressure", "fact"],
  ["ka_p_def_e", "k_p_def", "explanation",
    "PRESSURE = FORCE ÷ AREA. Same force, smaller area → bigger pressure. That's why sharp knives cut, nails pierce, and a camel's wide feet don't sink: broad feet spread the force over more area, lowering pressure.",
    "aligned to NCERT Force & Pressure", "fact"],
  ["ka_p_def_e2", "k_p_def", "example",
    "Worked example: 20 N of force on 2 m² gives 20÷2 = 10 N/m². On 0.5 m² the SAME force gives 20÷0.5 = 40 N/m² — four times the pressure, because the area was four times smaller.",
    "standard physics arithmetic", "fact"],
  ["ka_p_fluid_e", "k_p_fluid", "explanation",
    "Liquids and gases push on everything they touch, in ALL directions — walls, bottom, even upward. Deeper water = more pressure: dam walls are thicker at the bottom for exactly this reason.",
    "aligned to NCERT Force & Pressure", "fact"],
  ["ka_fr_def_e", "k_fr_def", "explanation",
    "FRICTION is the force that opposes motion between surfaces that touch. Roll a ball and it stops — friction stole its motion, always pushing opposite to the movement.",
    "aligned to NCERT Friction", "fact"],
  ["ka_fr_cause_e", "k_fr_cause", "explanation",
    "Why friction exists: every surface has tiny bumps. When surfaces slide, the bumps interlock and resist. Rougher surface → more interlocking → more friction. That's why carpets are harder to slide than glass.",
    "aligned to NCERT Friction", "fact"],
  ["ka_fr_fluid_e", "k_fr_fluid", "explanation",
    "Liquids and gases also drag moving objects — fluid friction. Sharks, dolphins, airplanes and boats are STREAMLINED (tapered at both ends) to slice through fluid with minimum drag.",
    "aligned to NCERT Friction", "fact"],
  ["ka_fr_goodbad_e", "k_fr_goodbad", "explanation",
    "Friction is a friend: you walk, write, and brakes work because of it. Friction is a foe: it wears out soles and machine parts and wastes energy as heat. We REDUCE it with oil, powder, ball-bearings — and INCREASE it with treads and grip when we need it.",
    "aligned to NCERT Friction", "fact"],
  ["ka_fr_goodbad_c", undefined, "contrast",
    "CONTRAST — reducing vs increasing friction: oil/powder/ball-bearings REDUCE it (machines, carrom boards). Treads on shoes/tyres INCREASE it (grip). Read the stem: 'walk without slipping' needs MORE friction; 'machine parts wearing' needs LESS.",
    "confusability teaching", "fact"],
  ["ka_l_refl_e", "k_l_refl", "explanation",
    "Light travels in straight lines. When it hits a surface and bounces back, that's REFLECTION. Mirrors reflect almost all of it; walls reflect some, scattered.",
    "aligned to NCERT Light", "fact"],
  ["ka_l_laws_e", "k_l_laws", "explanation",
    "Two laws of reflection: (1) angle of incidence = angle of reflection; (2) incident ray, reflected ray, and the normal (the perpendicular line) all lie in the same plane. A plane mirror forms an image that is the same size, upright, and LATERALLY INVERTED — your left hand appears as the image's right.",
    "aligned to NCERT Light", "fact"],
  ["ka_l_regular_e", "k_l_regular", "explanation",
    "Smooth surfaces (mirror, calm water) reflect REGULARLY — parallel rays stay parallel → clear images. Rough surfaces (wall, paper) reflect DIFFUSELY — rays scatter in all directions → no image, but you still SEE the wall.",
    "aligned to NCERT Light", "fact"],
  ["ka_l_eye_e", "k_l_eye", "explanation",
    "The eye is the sense organ of sight. Visually challenged people read and write using BRAILLE — a script of raised dots touched with fingertips, developed by Louis Braille.",
    "aligned to NCERT Light", "fact"],
  ["ka_l_laws_m", "k_l_laws", "common_mistake",
    "Trap: angle of INCIDENCE equals angle of REFLECTION — not refraction (refraction is light BENDING through a different medium, Class 10 territory), and not 90°.",
    "PYQ distractor pattern", "fact"],
  ["ka_f_def_h1", "k_f_def", "hint_l1",
    "Hint L1: forget the formulas — is it something you DO to an object, or something an object HAS?",
    "teaching aid", "phrasing"],
  ["ka_p_def_h1", "k_p_def", "hint_l1",
    "Hint L1: think needle vs finger — same poking force, different sharpness. What changed?",
    "teaching aid", "phrasing"],
  ["ka_fr_def_h1", "k_fr_def", "hint_l1",
    "Hint L1: the ball you rolled eventually stopped. Something OPPOSED its motion — which direction was that force pointing?",
    "teaching aid", "phrasing"],
];

export function buildK12AtomBank(): AtomBank {
  const atoms: Atom[] = RAW.map(([id, conceptId, kind, body, source, risk], i) => ({
    id,
    conceptId,
    kind,
    body,
    lang: "en" as const,
    verifiedBy: V,
    version: 1 + (i % 2),
    source,
    riskLevel: risk,
  }));
  return assembleAtomBank(K12_ATOM_BANK_VERSION, atoms);
}

/**
 * K12 GOAL SPEC — the same kernel, a different goal. [Notebook §19]
 * Payoff: mastery-threshold by term end (not marks maximisation) — modelled
 * as a 40Q × 1-mark school test with a 33% pass bar.
 */
export const K12_GOAL = {
  id: "cbse_class8_science_physics",
  deadlineDay: 90, // term end, 90 logical days
  payoff: "expected_marks" as const,
};
