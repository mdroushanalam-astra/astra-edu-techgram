/**
 * BRAIN MAP — the living grey mist [ADR-032]. Honest bands; unknowns glow
 * as mist to be sharpened, never deficits. Red only for CONFIRMED risks.
 */
import { useMemo, useState } from "react";
import { conceptRows, content, type SanctuaryState } from "../kernel/adapter.js";
import type { ConceptRow } from "../kernel/adapter.js";

export function BrainMapScreen({ sanct }: { sanct: SanctuaryState }) {
  const rows = useMemo(() => conceptRows(sanct.sys.belief), [sanct]);
  const [sel, setSel] = useState<ConceptRow | null>(null);
  const byTopic = useMemo(() => {
    const m = new Map<string, ConceptRow[]>();
    for (const c of content.concepts) {
      const row = rows.find((r) => r.id === c.id);
      if (!row) continue;
      const t = content.topicById.get(c.topicId)?.name ?? "the map";
      m.set(t, [...(m.get(t) ?? []), row]);
    }
    return [...m.entries()];
  }, [rows]);

  return (
    <div className="screen rise">
      <div className="screen-head">
        <h1>your map</h1>
        <p className="dim">solid light is evidenced; the violet mist is what we haven't measured yet — every patch is a question, not a grade.</p>
      </div>
      {byTopic.map(([topic, rs]) => (
        <div key={topic} className="glass" style={{ padding: "18px 22px", marginBottom: 16 }}>
          <div className="mono whisper" style={{ marginBottom: 12 }}>{topic}</div>
          {rs.map((r) => (
            <div key={r.id} className="mist-node" onClick={() => setSel(r)} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 14.5 }}>{r.name}</span>
                <span className="mono" style={{ color: r.grey ? "var(--violet)" : "var(--ink-3)" }}>
                  {r.grey ? "unknown-ish" : `${(r.lo * 100).toFixed(0)}–${(r.hi * 100).toFixed(0)}%`}
                </span>
              </div>
              <div className="band">
                <div className="rail">
                  {r.grey ? (
                    <div className="mist" style={{ left: `${Math.max(0, r.lo * 100)}%`, width: `${Math.max(8, (r.hi - r.lo) * 100)}%` }} />
                  ) : (
                    <div className="fill" style={{ left: `${r.lo * 100}%`, width: `${Math.max(4, (r.hi - r.lo) * 100)}%` }} />
                  )}
                </div>
                <span className="val">{r.grey ? "sharpen me?" : `n_eff ${r.nEff.toFixed(1)}`}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
      {sel && (
        <div className="glass rise" style={{ padding: "20px 24px" }}>
          <h2>{sel.name}</h2>
          <p className="dim">{sel.grey
            ? `we've seen ${sel.nEff.toFixed(1)} signals — not enough to claim anything. want to spend ten minutes sharpening this?`
            : `evidence places you between ${(sel.lo * 100).toFixed(0)}% and ${(sel.hi * 100).toFixed(0)}%. the band is the truth; a single number would be a performance.`}</p>
          <button className="btn" onClick={() => setSel(null)}>close</button>
        </div>
      )}
    </div>
  );
}
