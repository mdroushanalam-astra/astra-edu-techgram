import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { compileGeographyReference } from "../../scripts/geography_reference_compiler.mjs";
import { geographyReference } from "../../content/geography-reference.generated.js";
import { searchGeographyReference, teacherReference } from "../../scripts/geography_reference.js";
import { knowledgeSearch, runConnectedSession, type RuntimeRequest } from "../../scripts/connected_session.js";

const bytes = readFileSync(new URL("../../content/sources/geography-master-v1.md", import.meta.url));
const start: RuntimeRequest = { student_id: "s", pack: "geography", command_id: "start", day: 1, days_to_exam: 90, minutes: 40, events: [] };
describe("Supplied Geography source boundary", () => {
  it("rebuilds every section with byte provenance and accurate source line anchors", () => {
    const compiled = compileGeographyReference(bytes);
    expect(compiled).toEqual(geographyReference);
    expect(compiled.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
    const lines = bytes.toString("utf8").split(/\r?\n/);
    for (const s of compiled.sections) {
      expect(lines[s.line_start - 1]).toContain(s.title);
      expect(s.line_end).toBeGreaterThanOrEqual(s.line_start);
      expect(s.assessment_ready).toBe(false);
    }
    expect(() => compileGeographyReference(Buffer.from("Unexpected document"))).toThrow("title");
  });
  it("searches monsoon and GIS references without importing design instructions or grading keys", () => {
    expect(searchGeographyReference("monsoon circulation").some(s => s.title.includes("Monsoon"))).toBe(true);
    expect(searchGeographyReference("GIS").some(s => s.title.includes("GIS"))).toBe(true);
    expect(searchGeographyReference("concept_id canonical_name formal_definition")).toEqual([]);
    expect(knowledgeSearch("geography", "monsoon").results.length).toBeLessThanOrEqual(5);
    expect(knowledgeSearch("polity", "monsoon").results.some(s => s.id.startsWith("geo_master"))).toBe(false);
    expect(JSON.stringify(knowledgeSearch("geography", "monsoon"))).not.toContain('"answer"');
    expect(teacherReference("unknown_concept")).toBeNull();
  });
  it("adds traceable context only at a mapped explanation, never an independent question", () => {
    let view = runConnectedSession(start);
    expect(view.lesson.reference).toBeNull();
    for (let step = 0; step < 60 && view.lesson.move !== "EXPLAIN"; step++) {
      const command = `step-${step}`;
      const request: RuntimeRequest = { ...start, command_id: command, context: JSON.parse(JSON.stringify(view.runtime_context)), events: view.events };
      if (view.lesson.input === "item_response") request.answer = { item_id: view.item.id, choice: 0, confidence: 2, time_sec: 1, command_id: command };
      else request.action = { action: "continue", step_id: view.lesson.step_id };
      view = runConnectedSession(request);
    }
    expect(view.lesson.move).toBe("EXPLAIN");
    expect(view.lesson.reference?.document_version).toBe(geographyReference.version);
    expect(view.lesson.reference?.source).toContain("lines");
    expect(view.lesson.reference?.body.length).toBeLessThanOrEqual(1600);
    const repeat = runConnectedSession({ ...start, command_id: "repeat", context: view.runtime_context, events: view.events });
    expect(repeat.events).toEqual(view.events);
    expect(repeat.concepts).toEqual(view.concepts);
  });
  it("keeps old unpinned lessons unchanged and rejects reference version drift", () => {
    const view = runConnectedSession(start);
    expect(() => runConnectedSession({ ...start, context: { ...view.runtime_context, referenceVersion: "different" }, events: view.events })).toThrow("migration");
    const old = runConnectedSession({ ...start, context: { ...view.runtime_context, referenceVersion: undefined }, events: view.events });
    expect(old.runtime_context.referenceVersion).toBeUndefined();
    expect(old.lesson.reference).toBeNull();
  });
});
