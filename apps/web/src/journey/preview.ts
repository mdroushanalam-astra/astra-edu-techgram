import type { LearningView } from "../connected/api.js";
import type { Adapter } from "./model.js";
// Only imported in preview builds. Connected bundles never include these answers.
const items = [
    { id: "preview-weathering", stem: "A rock breaks into smaller pieces without moving. Which process is this?", options: ["Weathering", "Transport", "Deposition", "Erosion"], answer: 0, concept: "Weathering", explanation: "Weathering breaks rock down in place. Erosion removes it; transport carries it elsewhere." },
    { id: "preview-transport", stem: "A river carries sand downstream. What is happening to the sediment?", options: ["It is being deposited", "It is being transported", "It is weathering in place", "It is becoming a tributary"], answer: 1, concept: "Transport", explanation: "Transport is the movement of sediment by water. Sediment remains in motion until conditions favour deposition." },
    { id: "preview-deposition", stem: "A river enters a calm lake and slows down. What is most likely to happen?", options: ["It carries larger rocks faster", "All sediment dissolves", "Some sediment is deposited", "It stops weathering everywhere"], answer: 2, concept: "Deposition", explanation: "When a river loses velocity, its capacity to carry sediment falls. Material can settle and form deposits." },
    { id: "preview-delta", stem: "Why can a delta form near a river mouth?", options: ["The river accelerates into still water", "Sediment accumulates as flow slows", "The mouth prevents deposition", "Only weathering occurs there"], answer: 1, concept: "Deposition", explanation: "At the river mouth, slowing water may deposit sediment. A delta develops when sediment accumulation exceeds removal." },
];
export function previewAdapter(): Adapter {
    let revision = 0;
    let budget = 40;
    const commands = new Map<string, LearningView>();
    const counts: Record<string, {
        n: number;
        correct: number;
    }> = {};
    function view(feedback: LearningView["feedback"] = null): LearningView {
        const item = items[revision % items.length]!;
        return { student_id: "preview", revision, model_version: "illustrative-preview", content_version: "river-demo-1", item: { id: item.id, stem: item.stem, options: item.options, concept_id: item.concept, dimension: "understanding" }, feedback, teaching: null,
            concepts: ["Weathering", "Erosion", "Transport", "Deposition"].map(name => { const c = counts[name]; const mean = c ? c.correct / c.n : .5; return { id: name, name, mean, lo: Math.max(0, mean - .3), hi: Math.min(1, mean + .3), grey: !c, nEff: c?.n ?? 0 }; }),
            plan: { blocks: [{ conceptName: "River Systems", action: "retrieval", reason: "Check breaking, moving and settling material.", minutes: 5, assumption: "Illustrative preview plan" }, { conceptName: "Transport → Deposition", action: "explain", reason: "Explore what changes when a river slows down.", minutes: Math.round((budget - 5) * 4 / 7), assumption: "Illustrative preview plan" }, { conceptName: "River Systems", action: "apply", reason: "Apply the idea to a river mouth.", minutes: budget - 5 - Math.round((budget - 5) * 4 / 7), assumption: "Illustrative preview plan" }], personalisationApplied: ["Preview curriculum; no validated learner model."] },
            decision: { directive: { learningAction: "retrieval" }, receipt: { reason: ["This preview explores the distinction between weathering, transport and deposition."], confidence: .5 } } };
    }
    return { mode: "preview", async authenticate(_r, name) { return { name: name || "Arjun", spaces: [] }; }, async onboard(p) { return { student_id: "preview", name: p.name, goal: p.goal }; }, async start(_id, minutes, command) { budget = minutes; if (!commands.has(command))
            commands.set(command, view()); return commands.get(command)!; },
        async answer(old, choice, _confidence, _seconds, _minutes, command) { if (commands.has(command))
            return commands.get(command)!; const item = items[revision % items.length]!; if (old.revision !== revision || old.item.id !== item.id)
            throw new Error("The preview question changed. Reload the activity."); const c = counts[item.concept] ?? { n: 0, correct: 0 }; c.n++; c.correct += Number(choice === item.answer); counts[item.concept] = c; revision++; const next = view({ correct: choice === item.answer, correct_option: item.answer, correct_text: item.options[item.answer]!, concept_id: item.concept, explanation: { body: item.explanation, source: "Illustrative River Systems preview", verified_by: "Preview content" } }); commands.set(command, next); return next; },
        signout() { commands.clear(); revision = 0; Object.keys(counts).forEach(k => delete counts[k]); } };
}
