import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

export function compileGeographyReference(bytes: Buffer) {
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const lines = bytes.toString("utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  if (lines[0] !== "# TECHGRAM GEOGRAPHY MASTER KNOWLEDGE BASE") throw new Error("Unexpected Geography reference title");
  const headings: { title: string; number: string | null; line: number; depth: number }[] = [];
  lines.forEach((line, i) => {
    const match = line.match(/^(#{1,3}) (.+)$/);
    if (match) headings.push({ title: match[2]!, number: match[2]!.match(/^(\d+(?:\.\d+)?)\.?(?:\s|$)/)?.[1] ?? null, line: i + 1, depth: match[1]!.length });
  });
  const sections = headings.map((heading, i) => {
    const end = (headings[i + 1]?.line ?? lines.length + 1) - 1;
    const number = heading.number ? Number(heading.number.split(".")[0]) : null;
    const kind = number !== null && ((number >= 4 && number <= 25) || (number >= 39 && number <= 44)) ? "subject_reference" : "curriculum_or_design_reference";
    const body = lines.slice(heading.line, end).join("\n").replace(/\n---\s*$/, "").trim();
    return { id: `geo_master_${heading.number?.replaceAll(".", "_") ?? `heading_${heading.line}`}`, title: heading.title,
      number: heading.number, line_start: heading.line, line_end: end, kind, body,
      status: kind === "subject_reference" && body ? "reference_indexed" : "reference_only",
      review: "User-supplied synthesis · edition/source verification and expert review pending", assessment_ready: false };
  });
  if (new Set(sections.map(s => s.id)).size !== sections.length) throw new Error("Duplicate Geography section ID");
  return { document_id: "geography-master-v1", title: "Techgram Geography Master Knowledge Base", source_path: "content/sources/geography-master-v1.md",
    sha256, version: `geography-master-v1-${sha256.slice(0, 12)}`, line_count: lines.length, bytes: bytes.length,
    audit_status: "Original synthesis supplied by Founder; underlying textbooks/editions not independently audited", sections };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const reference = compileGeographyReference(readFileSync("content/sources/geography-master-v1.md"));
  writeFileSync("content/geography-reference.generated.ts", `// Generated from the immutable supplied source; rebuild with npm run content:reference.\nexport const geographyReference = ${JSON.stringify(reference, null, 2)} as const;\n`);
  const { sections, ...metadata } = reference;
  writeFileSync("content/geography-reference.inventory.json", JSON.stringify({ ...metadata, headings: sections.length,
    indexed_sections: sections.filter(s => s.status === "reference_indexed").length, sections: sections.map(({ body, ...s }) => ({ ...s, characters: body.length })) }, null, 2) + "\n");
  console.log(`Indexed ${reference.line_count} source lines / ${sections.filter(s => s.status === "reference_indexed").length} subject sections; none certified assessment-ready.`);
}
