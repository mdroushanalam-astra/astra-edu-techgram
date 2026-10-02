/**
 * NOTEBOOK — theirs: artifacts, curiosity ledger, session history.
 * Endowment — the place they make, the questions they asked.
 */
import { growthFor, type SanctuaryState } from "../kernel/adapter.js";
import { useState } from "react";

export function NotebookScreen({ sanct, onAsk }: { sanct: SanctuaryState; onAsk: (q: string) => void }) {
  const g = growthFor(sanct);
  const [q, setQ] = useState("");
  return (
    <div className="screen rise">
      <div className="screen-head">
        <h1>your notebook</h1>
        <p className="dim">your questions drive the curriculum here — curiosity is evidence, not a distraction.</p>
      </div>

      <div className="glass" style={{ padding: "20px 24px", marginBottom: 16 }}>
        <div className="mono whisper" style={{ marginBottom: 10 }}>the curiosity ledger</div>
        {sanct.sys.curiosity.questions.length === 0 && (
          <p className="whisper">nothing yet. ask anything about what you're learning — it gets kept, followed up, and folded into future sessions.</p>
        )}
        {sanct.sys.curiosity.questions.map((q) => (
          <div key={q.id} style={{ marginBottom: 10, display: "flex", gap: 10 }}>
            <span style={{ color: q.status === "unresolved" ? "var(--violet)" : "var(--ok)" }}>{q.status === "unresolved" ? "○" : "●"}</span>
            <span style={{ fontSize: 14.5 }}>{q.question}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="ask astra anything about this topic…"
            style={{ flex: 1, background: "var(--surface-2)", border: "1px solid var(--line-soft)", borderRadius: 10, color: "var(--ink)", padding: "10px 14px", font: "14px var(--font-body)" }}
          />
          <button className="btn" disabled={!q.trim()} onClick={() => { onAsk(q.trim()); setQ(""); }}>keep it</button>
        </div>
      </div>

      <div className="glass" style={{ padding: "20px 24px" }}>
        <div className="mono whisper" style={{ marginBottom: 10 }}>session history ({sanct.events.filter((e) => e.type === "item_response").length} answered signals)</div>
        {sanct.events.length === 0 && <p className="whisper">the room is new. everything you do here gets kept in your own log — on your device, replayable, exportable. no server knows.</p>}
        {[...new Set(sanct.events.map((e) => e.day))].slice(-5).reverse().map((d) => (
          <div key={d} className="dim" style={{ fontSize: 14, marginBottom: 6 }}>
            day {d}: {sanct.events.filter((e) => e.day === d && e.type === "item_response").length} answers ·{" "}
            {g.lines.length ? "bands updated with evidence" : "baseline building"}
          </div>
        ))}
      </div>
    </div>
  );
}
