import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { geographyReference } from "../content/geography-reference.generated.js";

export function compileGeographyUnits(directory: string) {
  const units = readdirSync(directory).filter(f => f.endsWith(".json")).sort().map(f => JSON.parse(readFileSync(join(directory, f), "utf8")));
  const concepts = units.flatMap(u => u.concepts.map((c: any) => ({ ...c, unit: u.id })));
  const ids = new Set(concepts.map(c => c.id));
  if (ids.size !== concepts.length || new Set(units.map(u => u.id)).size !== units.length) throw new Error("Duplicate unit/concept ID");
  const roles = ["diagnostic", "practice", "check", "transfer"];
  for (const c of concepts) {
    if (!/^gu_[a-z_]+$/.test(c.id) || !c.name || c.mechanism.length < 80 || c.example.length < 30 || c.mistake.length < 30) throw new Error("Incomplete concept authoring");
    if (!geographyReference.sections.some(s => s.number === c.section && s.status === "reference_indexed")) throw new Error("Missing source anchor");
    if (c.nodes.length !== 3 || c.nodes.some((n: string) => !n || n.length > 45)) throw new Error("Invalid diagram");
    if (c.items.length !== 4 || roles.some(role => c.items.filter((i: string[]) => i[0] === role).length !== 1)) throw new Error("Incomplete assessment roles");
    for (const i of c.items) if (i.length !== 6 || new Set(i.slice(2)).size !== 4 || i.some((v: string) => !v)) throw new Error("Ambiguous/invalid item structure");
    for (const p of c.prereqs) if (!ids.has(p)) throw new Error("Unknown prerequisite");
    const visit = (id: string, path: string[]) => {
      if (path.includes(id)) throw new Error("Prerequisite cycle");
      for (const next of concepts.find(v => v.id === id)!.prereqs) visit(next, [...path, id]);
    }; visit(c.id, []);
  }
  const version = `geography-units-1-${createHash("sha256").update(JSON.stringify(units)).digest("hex").slice(0, 12)}`;
  const atoms = concepts.flatMap(c => [
    ["explanation", c.mechanism], ["example", c.example], ["common_mistake", c.mistake],
    ["hint_l1", `Check this distinction: ${c.mistake}`], ["hint_l2", c.mechanism], ["hint_l3", `Worked situation: ${c.example}`],
  ].map(([kind, body]) => ({ id: `${c.id}_${kind}`, conceptId: c.id, kind, body, lang: "en", version: 1,
    source: `Geography master §${c.section}`, verifiedBy: "Original unit authoring · subject review pending", riskLevel: "fact" })));
  const items = concepts.flatMap(c => c.items.map((i: string[]) => {
    const shift = parseInt(createHash("sha256").update(`${c.id}:${i[0]}`).digest("hex").slice(0, 2), 16) % 4;
    const choices = i.slice(2); const options = choices.slice(4 - shift).concat(choices.slice(0, 4 - shift));
    return { id: `${c.id}_${i[0]}`, conceptId: c.id, purpose: i[0], stem: i[1], options, answer: shift,
      rationale: c.mechanism, difficulty: i[0] === "transfer" ? 4 : 3, expectedTimeSec: i[0] === "transfer" ? 60 : 40,
      dimension: i[0] === "transfer" ? "transfer" : i[0] === "practice" ? "application" : "conceptual", distractorTags: {} };
  }));
  return { version, status: "seed; subject review pending", sourceVersion: geographyReference.version,
    units: units.map(u => ({ id: u.id, title: u.title, conceptIds: u.concepts.map((c: any) => c.id) })),
    concepts: concepts.map(({ items: _items, ...c }) => c), atoms, items };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pack = compileGeographyUnits("content/units/geography");
  writeFileSync("content/geography-units.generated.ts", `// Generated private teaching/assessment assets. Never import into frontend.\nexport const geographyUnits = ${JSON.stringify(pack, null, 2)} as const;\n`);
  console.log(`Compiled ${pack.units.length} teaching units / ${pack.concepts.length} concepts / ${pack.items.length} items / ${pack.atoms.length} atoms; subject review pending.`);
}
