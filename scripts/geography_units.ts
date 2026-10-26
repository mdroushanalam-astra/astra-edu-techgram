import { geographyUnits } from "../content/geography-units.generated.js";
import { assembleContent, assembleAtomBank, type Item, type Atom, type BeliefModel, type BeliefState, reportConcept } from "../kernel/src/index.js";
export { geographyUnits };
export function buildGeographyUnits() {
  return assembleContent(geographyUnits.version, { questions: 20, marksEach: 1, negativeFraction: 0, guessFloor: .25,
    cutoff: { mean: 10, sd: 2 }, attemptBreakEven: .25 },
    geographyUnits.units.map(u => ({ id: u.id, name: u.title, examQuestions: u.conceptIds.length })),
    geographyUnits.concepts.map(c => ({ id: c.id, name: c.name, topicId: c.unit, type: "conceptual", prereqs: [...c.prereqs], confusableWith: [] })),
    JSON.parse(JSON.stringify(geographyUnits.items)) as Item[]);
}
export function buildGeographyUnitAtoms() {
  return assembleAtomBank(geographyUnits.version, JSON.parse(JSON.stringify(geographyUnits.atoms)) as Atom[]);
}
/** Resolve the learner's unit to an evidenced prerequisite frontier; kernel ranks that frontier. */
export function unitFrontier(unit: string, model: BeliefModel, state: BeliefState) {
  const selected = geographyUnits.units.find(u => u.id === unit) ?? geographyUnits.units.find(u => u.id === "geomorphology")!;
  const ready = (id: string) => { const r = reportConcept(model, state, id); return !r.grey && (r.mean >= .55 || r.nEff >= 2 && r.mean >= .45); };
  const frontier = new Set<string>();
  const visit = (id: string) => {
    const c = model.content.conceptById.get(id)!;
    const unmet = c.prereqs.filter(p => !ready(p));
    if (unmet.length) unmet.forEach(visit); else frontier.add(id);
  }; selected.conceptIds.forEach(visit);
  return { ids: [...frontier], selected: selected.title, prerequisitesIncluded: [...frontier].some(id => !(selected.conceptIds as readonly string[]).includes(id)) };
}
