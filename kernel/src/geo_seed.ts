/**
 * GEOMORPHOLOGY PACK — the S2 golden-replay content [ADR-028].
 * Class 8 student → IAS aspiration → Geomorphology → 40 minutes.
 * ORIGINAL authorship aligned to NCERT geography structure (licensing: docs/07).
 * Includes curiosity hooks, goal connections, humor and capability mapping —
 * the content metadata the session-experience layer composes from.
 */

import {
  assembleContent, type Concept, type Content, type ExamSpec, type Item, type Topic,
} from "./content.js";

export const GEO_CONTENT_VERSION = "geo-geomorphology-0.1.0";

export const GEO_EXAM_SPEC: ExamSpec = {
  questions: 30, marksEach: 1, negativeFraction: 0, guessFloor: 0.25,
  cutoff: { mean: 10, sd: 2 }, attemptBreakEven: 0.25,
};

const TOPICS: Topic[] = [{ id: "g_geo", name: "Geomorphology", examQuestions: 30 }];

const CONCEPTS: Concept[] = [
  { id: "g_forces", topicId: "g_geo", name: "Earth's internal forces", type: "conceptual", prereqs: [], confusableWith: [] },
  { id: "g_weathering", topicId: "g_geo", name: "Weathering", type: "conceptual", prereqs: [], confusableWith: ["g_erosion"] },
  { id: "g_erosion", topicId: "g_geo", name: "Erosion", type: "conceptual", prereqs: ["g_weathering"], confusableWith: ["g_transport", "g_weathering"] },
  { id: "g_transport", topicId: "g_geo", name: "Transportation", type: "conceptual", prereqs: ["g_erosion"], confusableWith: ["g_deposition", "g_erosion"] },
  { id: "g_deposition", topicId: "g_geo", name: "Deposition", type: "conceptual", prereqs: ["g_transport"], confusableWith: ["g_transport"] },
  { id: "g_landforms", topicId: "g_geo", name: "River landforms (valleys, deltas, floodplains)", type: "applied", prereqs: ["g_deposition", "g_erosion"], confusableWith: [] },
  { id: "g_human", topicId: "g_geo", name: "Landforms & human settlement", type: "applied", prereqs: ["g_landforms"], confusableWith: [] },
  { id: "g_governance", topicId: "g_geo", name: "Geomorphology in governance (flood planning)", type: "applied", prereqs: ["g_human"], confusableWith: [] },
];

/** [id, conceptId, stem, options, answer, difficulty, expectedTimeSec, dimension, distractorTags] */
type ItemDef = [string, string, string, [string, string, string, string], number, number, number, Item["dimension"], Record<number, string>?];

const ITEMS: ItemDef[] = [
  ["g_i_1", "g_forces", "Movement of the Earth's plates primarily creates—", ["Smooth plains", "Mountains and faults", "Deltas", "Beaches"], 1, 2, 35, "conceptual"],
  ["g_i_2", "g_forces", "Folding and faulting are both results of—", ["Water flow", "Internal Earth forces compressing or cracking the crust", "Wind deposition", "Human mining"], 1, 2, 40, "conceptual", { 0: "m_k_gravity_contact" }],
  ["g_i_3", "g_weathering", "Weathering is the breaking down of rock—", ["While it is being carried away", "IN PLACE, without moving the debris", "Only by rivers", "Only underground"], 1, 2, 40, "conceptual", { 0: "m_weathering_transport_confusion" }],
  ["g_i_4", "g_weathering", "Which is an example of chemical weathering?", ["A rock cracking when water freezes in cracks", "Iron in a rock rusting and crumbling", "A rock rolling down a slope", "Sand hitting a cliff"], 1, 3, 45, "conceptual"],
  ["g_i_5", "g_erosion", "Erosion differs from weathering because erosion—", ["Breaks rock in place", "REMOVES and carries the broken material away", "Only happens underground", "Needs human tools"], 1, 3, 45, "conceptual", { 0: "m_weathering_transport_confusion" }],
  ["g_i_6", "g_erosion", "Which agent shapes landforms by eroding them MOST actively in a desert?", ["Running water", "Wind", "Glaciers", "Waves"], 1, 2, 35, "recall"],
  ["g_i_7", "g_transport", "A river carries sediment downstream. The process is—", ["Deposition", "Transportation", "Weathering", "Folding"], 1, 2, 35, "recall", { 0: "m_transport_deposition_confusion" }],
  ["g_i_8", "g_transport", "When a river's speed DECREASES, it first—", ["Erodes more", "Starts dropping (depositing) its load", "Digs a deeper gorge", "Reverses direction"], 1, 3, 45, "conceptual", { 0: "m_transport_deposition_confusion" }],
  ["g_i_9", "g_deposition", "Deltas form at a river's mouth because—", ["The water speeds up", "The river meets still water and drops its sediment", "Plates collide there", "Wind blows the sand"], 1, 2, 40, "conceptual", { 2: "m_k_gravity_contact" }],
  ["g_i_10", "g_deposition", "Floodplains are built by—", ["Repeated deposition during floods", "One giant flood only", "Volcanic ash", "Plate collision"], 0, 2, 35, "conceptual"],
  ["g_i_11", "g_landforms", "A deep V-shaped valley is carved mainly by—", ["Wind deposition", "Vertical river erosion in uplands", "Wave deposition", "Glacial melting at the coast"], 1, 3, 45, "conceptual"],
  ["g_i_12", "g_landforms", "Why do deltas and floodplains attract dense settlement?", ["They erode fast", "Deposited sediment makes flat, fertile farmland", "They are earthquake-free", "Rivers never flood there"], 1, 3, 50, "application", { 3: "m_flood_free_myth" }],
  ["g_i_13", "g_human", "Cities near rivers face a repeated geomorphic risk of—", ["Lateral inversion", "Flooding on the floodplain", "Plate collision", "Chemical weathering of citizens"], 1, 2, 35, "application"],
  ["g_i_14", "g_human", "Before building on a floodplain, an administrator should primarily study—", ["The river's historical behaviour and flood levels", "Only the current weather", "The soil colour", "The number of bridges"], 0, 3, 50, "application"],
  ["g_i_15", "g_governance", "After a major flood, the FIRST geomorphic question a district officer should ask is—", ["Where will the river deposit sediment and flood next?", "Who to blame", "How to rename the river", "Whether to ban rain"], 0, 3, 55, "application"],
  ["g_i_16", "g_governance", "Embankments (levees) change a river's behaviour by—", ["Stopping erosion forever", "Constraining the channel, which can raise flood peaks downstream", "Adding sediment", "Reducing rainfall"], 1, 4, 60, "application"],
];

export function buildGeomorphologyContent(): Content {
  const items: Item[] = ITEMS.map(
    ([id, conceptId, stem, options, answer, difficulty, timeSec, dimension, tags]) => ({
      id, conceptId, stem, options, answer, difficulty, expectedTimeSec: timeSec,
      dimension, distractorTags: tags ?? {},
    }),
  );
  return assembleContent(GEO_CONTENT_VERSION, GEO_EXAM_SPEC, TOPICS, CONCEPTS, items);
}

// ---- IAS aspiration + capability graph (K12 GoalSpec flavour) ----

export const GEO_GOAL = {
  id: "ias_aspiration_class8",
  aspiration: "IAS officer",
  deadlineDay: 90,
  payoff: "expected_marks" as const,
};

/** Capability Journey: goal → capabilities → concepts. [% toward IAS is banned; this is what we show.] */
export const GEO_CAPABILITIES: { capability: string; conceptIds: string[] }[] = [
  { capability: "Physical-process reasoning", conceptIds: ["g_forces", "g_weathering", "g_erosion", "g_transport", "g_deposition"] },
  { capability: "Landform reading", conceptIds: ["g_landforms"] },
  { capability: "Land-use & disaster planning", conceptIds: ["g_human"] },
  { capability: "Governance connection", conceptIds: ["g_governance"] },
];

/** Curiosity hooks for the session-experience layer (open loops). */
export const GEO_HOOKS: { question: string; conceptId: string }[] = [
  { question: "Why do some rivers suddenly abandon their channel and take a new path?", conceptId: "g_transport" },
  { question: "Why do people keep rebuilding cities on floodplains that flood?", conceptId: "g_human" },
  { question: "Can a delta ever shrink instead of grow?", conceptId: "g_deposition" },
];

export const GEO_GOAL_CONNECTIONS: Record<string, string> = {
  g_erosion: "IAS connection: flood control starts with knowing what a river can carry away.",
  g_transport: "IAS connection: settlement planning follows the sediment a river moves.",
  g_deposition: "IAS connection: fertile floodplains AND flood losses both come from deposition.",
  g_human: "IAS connection: every district plan is applied geomorphology — rivers read before files.",
  g_governance: "IAS connection: embankment policy IS geomorphology — constrain a river and it constrains you back.",
};

/** Humor assets (content, not improvisation) — the brain decides whether to spend them. */
export const GEO_HUMOR: { style: string; text: string }[] = [
  { style: "dry", text: "Rivers are nature's delivery service — they keep losing parcels and building mountains of mud." },
  { style: "exam", text: "A river's career plan: erode in the hills, carry in the middle, deposit at the office, and retire in a delta." },
];
