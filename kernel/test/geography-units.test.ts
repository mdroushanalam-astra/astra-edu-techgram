import { describe, expect, it } from "vitest";
import { buildGeographyUnits, buildGeographyUnitAtoms, geographyUnits, unitFrontier } from "../../scripts/geography_units.js";
import { compileGeographyUnits } from "../../scripts/geography_units_compiler.mjs";
import { runConnectedSession, type RuntimeRequest } from "../../scripts/connected_session.js";
import { buildBeliefModel, DEFAULT_MEMORY_PARAMS, replay, startTeacherSession, nextMove, applyStudentTurn, type Segment } from "../src/index.js";
import { fileURLToPath } from "node:url";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const request: RuntimeRequest = { catalog: "units", student_id: "u", pack: "geography", command_id: "start", day: 1, days_to_exam: 90, minutes: 40,
  preferences: { geographyUnit: "maps_motions" }, events: [] };
type View = ReturnType<typeof runConnectedSession>;
function next(v: View, correct = true, confidence = 3) {
  const command = `step-${v.lesson.step_id}`;
  const q: RuntimeRequest = { ...request, events: v.events, context: JSON.parse(JSON.stringify(v.runtime_context)), command_id: command };
  if (v.lesson.input === "item_response") q.answer = { item_id: v.item.id, choice: (v.runtime_context.move!.item!.answer + (correct ? 0 : 1)) % 4, confidence, time_sec: 40, command_id: command };
  else q.action = { action: "continue", step_id: v.lesson.step_id };
  return runConnectedSession(q);
}
describe("Assessed Geography units", () => {
  it("rejects incomplete assessment roles and cyclic prerequisites before publishing", () => {
    const source = fileURLToPath(new URL("../../content/units/geography", import.meta.url));
    const directory = mkdtempSync(join(tmpdir(), "techgram-unit-gate-"));
    const files = readdirSync(source).filter(f => f.endsWith(".json"));
    try {
      for(const f of files) writeFileSync(join(directory,f),readFileSync(join(source,f)));
      const path = join(directory,files[0]!); const original = readFileSync(path,"utf8");
      const missing = JSON.parse(original); missing.concepts[0].items.pop(); writeFileSync(path,JSON.stringify(missing));
      expect(()=>compileGeographyUnits(directory)).toThrow("assessment roles");
      const cycle = JSON.parse(original); cycle.concepts[0].prereqs=[cycle.concepts[0].id]; writeFileSync(path,JSON.stringify(cycle));
      expect(()=>compileGeographyUnits(directory)).toThrow("cycle");
    } finally { for(const f of files) unlinkSync(join(directory,f)); rmdirSync(directory); }
  });
  it("executes diagnostic, repair, practice, fresh check and independent transfer for every authored concept", () => {
    const model = buildBeliefModel(buildGeographyUnits(), DEFAULT_MEMORY_PARAMS), state = replay(model, []), bank = buildGeographyUnitAtoms();
    for (const c of geographyUnits.concepts) {
      const teacher = startTeacherSession();
      const segment: Segment = { id: "cycle", protocol: "assessed-unit", kind: "teach", conceptId: c.id, conceptName: c.name,
        minutes: 38, sourceBlockIndex: 0, objective: c.name,
        prediction: { dMastery: 0, stabilityMultiplier: 1, dUncertaintyVar: 0, status: "assumed", confidence: 0, aomVersion: "test" } };
      const seen: string[] = [];
      for(let n=0;n<30;n++) {
        const move = nextMove(model, state.belief, state.misconceptions, teacher, { segments: [segment] }, bank);
        if(!move) break;
        if(move.item) {
          seen.push(move.item.purpose!);
          if(move.item.purpose === "check" || move.item.purpose === "transfer") expect(move.expectEvidence).toMatchObject({ hintsAllowed: false });
          applyStudentTurn(teacher, { correct: false, confidence: 2 });
        }
      }
      expect(seen).toEqual(["diagnostic", "practice", "check", "transfer"]);
    }
  });
  it("publishes complete private assessments and source/diagram/atom coverage for all four units", () => {
    const compiled = compileGeographyUnits(fileURLToPath(new URL("../../content/units/geography", import.meta.url)));
    expect(compiled).toEqual(geographyUnits);
    expect(compiled.concepts).toHaveLength(20); expect(compiled.items).toHaveLength(80); expect(compiled.atoms).toHaveLength(120);
    for (const c of compiled.concepts) {
      const items = compiled.items.filter(i => i.conceptId === c.id);
      expect(new Set(items.map(i => i.purpose))).toEqual(new Set(["diagnostic", "practice", "check", "transfer"]));
      expect(new Set(items.map(i => i.stem)).size).toBe(4);
      expect(items.every(i => i.options.length === 4 && i.answer >= 0 && i.answer < 4)).toBe(true);
    }
  });
  it("selects evidenced prerequisite frontiers before advanced monsoon teaching", () => {
    const model = buildBeliefModel(buildGeographyUnits(), DEFAULT_MEMORY_PARAMS);
    const frontier = unitFrontier("monsoon", model, replay(model, []).belief);
    expect(frontier.ids).toEqual(["gu_coordinates"]);
    expect(frontier.prerequisitesIncluded).toBe(true);
    const start = runConnectedSession({ ...request, preferences: { geographyUnit: "monsoon" } });
    expect(start.lesson.concept_id).toBe("gu_coordinates");
    expect(start.plan.personalisationApplied.join(" ")).toContain("unmet prerequisites");
  });
  it("routes weak diagnostics to explanation and confident correct responses to a fresh check", () => {
    const v = runConnectedSession(request);
    expect(v.lesson.hints_allowed).toBe(false); expect(v.teaching).toBeNull(); expect(v.lesson.board).not.toHaveProperty("nodes");
    const weak = next(v, false); const strong = next(v, true);
    expect(weak.lesson.move).toBe("EXPLAIN"); expect(weak.lesson.board.kind).toBe("process-flow");
    expect(strong.lesson.move).toBe("RETRIEVAL_PROMPT"); expect(strong.item.id.endsWith("_check")).toBe(true);
    expect(strong.lesson.hints_allowed).toBe(false);
    expect(next(strong, false).lesson.move).toBe("EXPLAIN");
  });
  it("provides supported practice then a distinct independent transfer without hints", () => {
    let v = next(runConnectedSession(request), false);
    v = next(v); expect(v.item.id.endsWith("_practice")).toBe(true); expect(v.lesson.hints_allowed).toBe(true);
    const issued = v.item.id;
    v = next(v, false); expect(v.lesson.move).toBe("WORKED_EXAMPLE");
    v = next(v); expect(v.item.id.endsWith("_check")).toBe(true);
    v = next(v); expect(v.lesson.move).toBe("TRANSFER_ITEM"); expect(v.item.id).not.toBe(issued);
    expect(v.lesson.hints_allowed).toBe(false);
    expect(() => runConnectedSession({ ...request, events: v.events, context: v.runtime_context, command_id: "hint", action: { action: "hint", step_id: v.lesson.step_id } })).toThrow("independent");
  });
  it("completes every unit focus through serialized requests with private keys withheld", () => {
    for (const u of geographyUnits.units) {
      let v = runConnectedSession({ ...request, preferences: { geographyUnit: u.id } });
      for (let n=0;n<40 && v.session.status !== "completed";n++) {
        expect(JSON.stringify(v.item)).not.toContain('"answer"'); v = next(v, n % 2 === 0, 2);
      }
      expect(v.session.status).toBe("completed");
      expect(v.session.answers.length).toBeGreaterThan(0);
    }
  });
  it("preserves old active grading and isolates its evidence when starting the new catalog", () => {
    const legacy = runConnectedSession({ ...request, catalog: undefined });
    const resumed = runConnectedSession({ ...request, context: legacy.runtime_context, events: legacy.events });
    expect(resumed.content_version).toBe(legacy.content_version); expect(resumed.item).toEqual(legacy.item);
    const done = runConnectedSession({ ...request, context: resumed.runtime_context, events: resumed.events, command_id: "finish-old", action: { action: "finish", step_id: resumed.lesson.step_id } });
    const fresh = runConnectedSession({ ...request, context: done.runtime_context, events: done.events, command_id: "new" });
    expect(fresh.content_version).toBe(geographyUnits.version);
    expect(fresh.concepts.every(c => c.grey)).toBe(true); expect(fresh.events.length).toBeGreaterThan(done.events.length);
  });
  it("uses independent outcomes to unlock the next maps concept while retaining a weak prerequisite", () => {
    function finish(correct: boolean) {
      let v = runConnectedSession(request);
      for(let n=0;n<40 && v.session.status !== "completed";n++) v = next(v, correct, 3);
      return runConnectedSession({ ...request, command_id: correct ? "strong-next" : "weak-next", events: v.events, context: v.runtime_context });
    }
    const strong = finish(true), weak = finish(false);
    expect(weak.lesson.concept_id).toBe("gu_coordinates");
    expect(strong.lesson.concept_id).not.toBe("gu_coordinates");
    expect(strong.plan.blocks[0]?.conceptId).toBe(strong.lesson.concept_id);
  });
});
