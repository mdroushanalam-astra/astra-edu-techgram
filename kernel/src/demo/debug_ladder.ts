import { buildSeedContent } from "../polity_seed.js";
import { buildBeliefModel, initialState, DEFAULT_BELIEF_PARAMS } from "../belief.js";
import { DEFAULT_MEMORY_PARAMS } from "../memory.js";
import { startTeacherSession, nextMove, applyStudentTurn } from "../teacher.js";
import { newMisconceptionState } from "../diagnosis.js";
import { buildPolityAtomBank } from "../polity_atoms.js";
import { getAtom } from "../atoms.js";

const content = buildSeedContent();
const model = buildBeliefModel(content, DEFAULT_MEMORY_PARAMS, DEFAULT_BELIEF_PARAMS, { selfRating: 3 });
const bank = buildPolityAtomBank();
console.log("hint_l1 for c_fr_21:", getAtom(bank, "c_fr_21", "hint_l1")?.id ?? "MISSING");
const st = initialState(model);
const teach = { id: "seg_test_teach", kind: "teach" as const, conceptId: "c_fr_21", conceptName: "A21", minutes: 20, sourceBlockIndex: 0,
  prediction: { dMastery: 0, stabilityMultiplier: 1, dUncertaintyVar: 0, status: "assumed" as const, confidence: 0.4, aomVersion: "aom" }, objective: "t" };
const teacher = startTeacherSession();
const oneSegment = { segments: [teach] };
let m = nextMove(model, st, newMisconceptionState(), teacher, oneSegment, bank);
let guard = 0;
while (m && guard < 14) {
  guard++;
  console.log(guard, m.move, "hintLevel:", teacher.hintLevel, "shown:", teacher.hintShownLevel, "outcome:", teacher.lastOutcome);
  if (m.expectEvidence.kind === "item_response") applyStudentTurn(teacher, { correct: false, confidence: 2 });
  m = nextMove(model, st, newMisconceptionState(), teacher, oneSegment, bank);
}
