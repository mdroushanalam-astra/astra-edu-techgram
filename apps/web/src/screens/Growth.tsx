/**
 * GROWTH — THEN→NOW with receipts [ADR-032]. Capability change visible,
 * agency moments, watch-it-think reveals. No scores to chase — evidence.
 */
import { useMemo } from "react";
import { growthFor, journeyFor, milestonesFor, shiftsFor, agencyFor, type SanctuaryState } from "../kernel/adapter.js";

export function GrowthScreen({ sanct }: { sanct: SanctuaryState }) {
  const g = useMemo(() => growthFor(sanct), [sanct]);
  const j = useMemo(() => journeyFor(sanct), [sanct]);
  const ms = useMemo(() => milestonesFor(sanct), [sanct]);
  const sh = useMemo(() => shiftsFor(sanct), [sanct]);
  const ag = useMemo(() => agencyFor(sanct), [sanct]);

  return (
    <div className="screen rise">
      <div className="screen-head">
        <h1>growth, with receipts</h1>
        <p className="dim">every line here is earned from evidence — the same evidence a pilot would audit. no xp, no badges.</p>
      </div>

      <div className="glass" style={{ padding: "20px 24px", marginBottom: 16 }}>
        <div className="mono whisper" style={{ marginBottom: 10 }}>{g.summary}</div>
        {g.lines.slice(0, 6).map((l) => (
          <div key={l.conceptId} className="band" style={{ marginBottom: 10 }}>
            <span className="dim" style={{ minWidth: 170, fontSize: 14 }}>{l.conceptName}</span>
            <div className="rail">
              <div className="fill" style={{ width: `${Math.min(100, l.currentMean * 100)}%` }} />
              {l.baselineMean !== null && <div className="mist" style={{ left: 0, width: `${Math.max(0, l.baselineMean * 100)}%`, opacity: 0.4 }} />}
            </div>
            <span className="val">{l.improvement !== null ? `${l.improvement > 0 ? "+" : ""}${(l.improvement * 100).toFixed(0)}` : "then: —"} → {(l.currentMean * 100).toFixed(0)}%</span>
          </div>
        ))}
        {g.lines.length === 0 && <p className="whisper">nothing evidenced yet. the first honest sessions build the baseline.</p>}
      </div>

      <div className="glass" style={{ padding: "20px 24px", marginBottom: 16 }}>
        <div className="mono whisper" style={{ marginBottom: 10 }}>capabilities — what you can DO</div>
        {j.map((e) => (
          <div key={e.capability} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14.5 }}>{e.capability}</span>
              <span className="mono whisper">{e.conceptsEvidenced}/{e.conceptsTracked} evidenced</span>
            </div>
            <div className="band" style={{ marginTop: 5 }}>
              <div className="rail"><div className="fill" style={{ width: `${e.meanMastery * 100}%` }} /></div>
            </div>
            {e.canDo && <div className="whisper" style={{ color: "var(--ok)", marginTop: 3 }}>{e.canDo}</div>}
          </div>
        ))}
      </div>

      {ms.length > 0 && (
        <div className="glass" style={{ padding: "20px 24px", marginBottom: 16 }}>
          <div className="mono whisper" style={{ marginBottom: 10 }}>moments you earned</div>
          {ms.map((m, i) => (
            <div key={i} style={{ marginBottom: 8, display: "flex", gap: 10 }}>
              <span style={{ color: "var(--warm)" }}>✦</span>
              <span style={{ fontSize: 14.5 }}>{m.description} <span className="whisper">(day {m.day})</span></span>
            </div>
          ))}
        </div>
      )}

      <div className="glass" style={{ padding: "20px 24px", marginBottom: 16 }}>
        <div className="mono whisper" style={{ marginBottom: 10 }}>your decisions — the agency gradient</div>
        <p className="dim" style={{ fontSize: 14.5 }}>{ag.note}</p>
        {ag.nextTransferMove && (
          <div className="why-inline" style={{ borderLeftColor: "var(--cool)" }}>{ag.nextTransferMove.offer}</div>
        )}
        {ag.byDecision.slice(0, 3).map((d) => (
          <div key={d.decision} className="whisper" style={{ marginTop: 8 }}>· {d.decision.replace(/_/g, " ")}: {d.evidence}</div>
        ))}
      </div>

      {sh.length > 0 && (
        <div className="glass" style={{ padding: "20px 24px" }}>
          <div className="mono whisper" style={{ marginBottom: 10 }}>changed-my-mind moments</div>
          {sh.slice(0, 3).map((c) => (
            <div key={c.conceptId} className="dim" style={{ fontSize: 14, marginBottom: 6 }}>
              <b style={{ color: "var(--ink)" }}>{c.conceptName}</b>: {c.verdict} ({(c.shift * 100).toFixed(0)} pts)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
