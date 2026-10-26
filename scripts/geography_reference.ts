import { geographyReference } from "../content/geography-reference.generated.js";
import { geographyUnits } from "../content/geography-units.generated.js";

const conceptSections: Record<string, string> = {
  g_forces: "geo_master_6_1", g_weathering: "geo_master_6_2", g_erosion: "geo_master_6_2",
  g_transport: "geo_master_6_3", g_deposition: "geo_master_6_3", g_landforms: "geo_master_6_3",
  g_human: "geo_master_19", g_governance: "geo_master_12_3",
};
export const referenceVersion = geographyReference.version;
export function teacherReference(conceptId: string) {
  const unit = geographyUnits.concepts.find(c => c.id === conceptId);
  const sectionId = unit ? `geo_master_${unit.section.replaceAll(".", "_")}` : conceptSections[conceptId];
  const section = geographyReference.sections.find(s => s.id === sectionId && s.status === "reference_indexed");
  if (!section) return null;
  return { id: section.id, title: section.title, body: section.body.slice(0, 1600).replaceAll("**", ""),
    source: `${geographyReference.title} · §${section.number} · lines ${section.line_start}–${section.line_end}`,
    review: section.review, document_version: referenceVersion, sha256: geographyReference.sha256,
    line_start: section.line_start, line_end: section.line_end, assessment_ready: false };
}

export function searchGeographyReference(query: string) {
  const stop = new Set(["the", "and", "what", "why", "how", "does", "can", "for", "with", "from", "are", "this", "that"]);
  const words = [...new Set((query.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? []).filter(w => w.length > 2 && !stop.has(w)))].slice(0, 12);
  if (!words.length) return [];
  return geographyReference.sections.filter(s => s.status === "reference_indexed")
    .map(s => ({ s, score: words.reduce((n, w) => n + (s.title.toLowerCase().includes(w) ? 4 : 0) + (s.body.toLowerCase().includes(w) ? 1 : 0), 0) }))
    .filter(r => r.score > 0).sort((a, b) => b.score - a.score || a.s.line_start - b.s.line_start).slice(0, 5)
    .map(({ s }) => {
      const hit = words.map(w => s.body.toLowerCase().indexOf(w)).filter(n => n >= 0).sort((a, b) => a - b)[0] ?? 0;
      const start = s.body.length <= 1400 ? 0 : Math.max(0, s.body.lastIndexOf("\n", Math.max(0, hit - 120)) + 1);
      return { id: s.id, concept_id: s.id, title: s.title, body: `${start ? "…" : ""}${s.body.slice(start, start + 1400).replaceAll("**", "")}${s.body.length > start + 1400 ? "…" : ""}`,
        source: `${geographyReference.title} · §${s.number} · lines ${s.line_start}–${s.line_end}`, review: s.review,
        provenance: { document_id: geographyReference.document_id, sha256: geographyReference.sha256, version: referenceVersion,
          line_start: s.line_start, line_end: s.line_end }, assessment_ready: false };
    });
}
