import { describe, expect, it } from "vitest";
import { runConnectedSession, knowledgeSearch, type RuntimeRequest } from "../../scripts/connected_session.js";
import { compileLesson, compilePack } from "../../scripts/content_compiler.mjs";
import { buildBeliefModel, buildSeedContent, replay, DEFAULT_MEMORY_PARAMS, type StudentEvent } from "../src/index.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const start = (): RuntimeRequest => ({ student_id: "learner", pack: "geography", command_id: "start", day: 1, days_to_exam: 90, minutes: 40, events: [] });
const nextRequest = (v: ReturnType<typeof runConnectedSession>, action: string, command = "step"): RuntimeRequest => ({ ...start(), command_id: command, context: JSON.parse(JSON.stringify(v.runtime_context)), events: v.events, action: { action, step_id: v.lesson.step_id } });
describe("Connected teaching boundary", () => {
  it("finishes fresh Polity and Geography sessions through serialized steps with honest confidence summaries", () => {
    for (const pack of ["polity", "geography"]) {
      let view = runConnectedSession({ ...start(), pack });
      let sawCalibration = false;
      for (let step = 0; step < 180 && view.session.status !== "completed"; step++) {
        if (view.lesson.move === "CALIBRATION_PROMPT") {
          sawCalibration = true;
          const independent = view.session.answers.filter(a => !a.assisted);
          expect(view.lesson.body).toContain(`${independent.filter(a => a.correct).length} correct out of ${independent.length}`);
          expect(view.lesson.body).toContain("Assisted practice is excluded");
          expect(view.lesson.body).not.toContain("rate how sure");
        }
        const req = { ...nextRequest(view, "continue", `full-${pack}-${step}`), pack };
        if (view.lesson.input === "item_response") {
          req.action = undefined;
          req.answer = { item_id: view.item.id, choice: step % 4, confidence: 2, time_sec: 1, command_id: req.command_id };
        }
        view = runConnectedSession(req);
      }
      expect(sawCalibration).toBe(true);
      expect(view.session.status).toBe("completed");
      expect(view.session.answers.length).toBeGreaterThan(0);
    }
  });
  it("round-trips persisted teacher state without repeating a consumed question", () => {
    const first = runConnectedSession(start());
    const second = runConnectedSession({ ...nextRequest(first, "continue"), action: undefined,
      answer: { item_id: first.item.id, choice: 1, confidence: 2, time_sec: 20, command_id: "answer" } });
    expect(second.session.answers).toHaveLength(1);
    expect(second.item.id).not.toBe(first.item.id);
    expect(second.lesson.concept_id).toBe(second.runtime_context.move?.conceptId);
    expect(JSON.stringify(second.item)).not.toContain('"answer"');
    expect(second.decision.receipt.prediction_status).toBe("assumed");
  });
  it("uses explanations and persists pause/resume without changing the step", () => {
    let view = runConnectedSession(start());
    for (let i = 0; i < 30 && view.lesson.input === "item_response"; i++) view = runConnectedSession({ ...nextRequest(view, "continue", `a${i}`), action: undefined, answer: { item_id: view.item.id, choice: 0, confidence: 2, time_sec: 20, command_id: `a${i}` } });
    expect(view.lesson.body.length).toBeGreaterThan(10);
    const paused = runConnectedSession(nextRequest(view, "pause", "pause"));
    const resumed = runConnectedSession(nextRequest(paused, "resume", "resume"));
    expect(resumed.lesson.step_id).toBe(view.lesson.step_id);
    expect(resumed.lesson.body).toBe(view.lesson.body);
    expect(resumed.session.status).toBe("active");
    expect(() => runConnectedSession(nextRequest(paused, "continue"))).toThrow("Resume");
  });
  it("does not count an assisted or revealed answer as independent mastery", () => {
    const model = buildBeliefModel(buildSeedContent(), DEFAULT_MEMORY_PARAMS);
    const event: StudentEvent = { event_id: "e", idempotency_key: "e", student_id: "s", day: 1, type: "item_response", source: "server", schema_version: 1,
      payload: { item_id: model.content.items[0]!.id, concept_id: model.content.items[0]!.conceptId, correct: true, confidence: 3, time_sec: 20, assisted: true } };
    const state = replay(model, [event]);
    expect([...state.belief.nEff].every(n => n === 0)).toBe(true);
    expect(state.memory.size).toBe(0);
    const wrong = replay(model, [{ ...event, payload: { ...event.payload, correct: false, chosen_option: 0 } }]);
    expect([...wrong.belief.nEff].every(n => n === 0)).toBe(true);
  });
  it("rejects hints during independent checks and stale teaching steps", () => {
    const first = runConnectedSession(start());
    expect(first.lesson.hints_allowed).toBe(false);
    expect(() => runConnectedSession(nextRequest(first, "hint"))).toThrow("independent");
    const request = nextRequest(first, "pause"); request.action!.step_id = "stale";
    expect(() => runConnectedSession(request)).toThrow("step changed");
  });
  it("adds an example only when the learner requests that presentation", () => {
    let view = runConnectedSession(start());
    for (let i = 0; i < 30 && view.lesson.move !== "EXPLAIN"; i++) {
      const req = nextRequest(view, "continue", `e${i}`);
      if (view.lesson.input === "item_response") { req.action = undefined; req.answer = { item_id: view.item.id, choice: 0, confidence: 2, time_sec: 20, command_id: `e${i}` }; }
      view = runConnectedSession(req);
    }
    expect(view.lesson.move).toBe("EXPLAIN");
    const context = view.runtime_context;
    const formal = runConnectedSession({ ...start(), context, events: view.events, preferences: { style: "Give me another explanation" } });
    const examples = runConnectedSession({ ...start(), context, events: view.events, preferences: { style: "Show me an example" } });
    expect(examples.lesson.body.length).toBeGreaterThan(formal.lesson.body.length);
  });
  it("retrieves bounded source-linked knowledge without exposing grading keys", () => {
    const result = knowledgeSearch("geography", "sediment deposition");
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.length).toBeLessThanOrEqual(5);
    expect(result.results.every(r => r.source.startsWith("https://") || "provenance" in r && typeof r.provenance === "object" && r.provenance !== null && "sha256" in r.provenance && typeof r.provenance.sha256 === "string")).toBe(true);
    expect(result.scope).toContain("review");
    expect(JSON.stringify(result)).not.toContain('"answer"');
  });
});
describe("Knowledge compiler", () => {
  const directory = fileURLToPath(new URL("../../content/packs/geography", import.meta.url));
  const lesson = readFileSync(`${directory}/g_transport.md`, "utf8");
  it("compiles a complete pack while preserving review status", () => {
    const pack = compilePack(directory);
    expect(pack.lessons).toHaveLength(8);
    expect(pack.atoms).toHaveLength(48);
    expect(pack.atoms.every(a => a.verifiedBy.includes("pending"))).toBe(true);
  });
  it("rejects incomplete support material and unsupported publication claims", () => {
    expect(() => compileLesson(lesson.replace("## Hint 3", "## Missing"))).toThrow("Hint 3");
    expect(() => compileLesson(lesson.replace('"status": "seed"', '"status": "reviewed"'))).toThrow("review date");
    expect(() => compileLesson(lesson.replace('"source": "https:', '"source": "http:'))).toThrow("HTTPS");
  });
});
