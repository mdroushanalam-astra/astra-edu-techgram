/**
 * HOME — the room, not a dashboard [ADR-032]. Lowercase, personal,
 * kernel-derived. One primary action, one visible reason.
 */
import { useMemo } from "react";
import {
  conceptRows, growthFor, personalisationFor, agencyFor, content,
  type SanctuaryState,
} from "../kernel/adapter.js";

export function HomeScreen({ sanct, onStart, onGo }: { sanct: SanctuaryState; onStart: () => void; onGo: (s: string) => void }) {
  const rows = useMemo(() => conceptRows(sanct.sys.belief), [sanct]);
  const g = useMemo(() => growthFor(sanct), [sanct]);
  const pers = useMemo(() => personalisationFor(sanct), [sanct]);
  const ag = useMemo(() => agencyFor(sanct), [sanct]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "good morning" : hour < 18 ? "good afternoon" : "good evening";
  const strongest = [...rows].filter((r) => !r.grey).sort((a, b) => b.mean - a.mean)[0];
  const mistiest = [...rows].sort((a, b) => (b.grey ? 1 : 0) - (a.grey ? 1 : 0) || a.nEff - b.nEff)[0];
  const improved = g.lines.filter((l) => (l.improvement ?? 0) > 0.02).length;
  const budget = pers.loadToleranceMin > 0 ? Math.min(40, Math.ceil(pers.loadToleranceMin * 1.1)) : 40;

  return (
    <div className="screen rise">
      <div style={{ maxWidth: 560, margin: "6vh auto 0" }}>
        <h1 style={{ fontSize: 30, fontWeight: 500 }}>{greet}.</h1>
        <p className="dim" style={{ fontSize: 17 }}>
          {strongest && improved > 0
            ? `you were strong on ${strongest.name.toLowerCase()}. i've been thinking about what to do with today.`
            : mistiest
              ? `i don't know much about you yet — and i won't pretend to. that's the honest starting point.`
              : `the room is quiet. that's fine.`}
        </p>

        <div className="glass" style={{ padding: "22px 24px", marginTop: 26 }}>
          <div className="whisper mono" style={{ marginBottom: 10 }}>
            {sanct.plan.totalMinutes > 0 ? `${sanct.plan.totalMinutes} min · quiet session` : "a short, honest session"}{pers.optimalSessionMin ? ` · your measured length: ~${pers.optimalSessionMin} min` : ""}
          </div>
          {sanct.plan.blocks.slice(0, 3).map((b, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 15.5 }}>{b.action === "review" ? "revisit" : b.action === "diagnose" ? "sharpen" : b.action} — <b style={{ fontWeight: 600 }}>{b.conceptName}</b></div>
              <div className="whisper">{b.reason.length > 110 ? b.reason.slice(0, 110) + "…" : b.reason}</div>
            </div>
          ))}
          {sanct.plan.foregone && (
            <div className="whisper mono" style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 8, marginTop: 10 }}>
              not chosen today: {sanct.plan.foregone.action} · {sanct.plan.foregone.conceptName} — {sanct.plan.foregone.why}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn primary" onClick={onStart}>begin — let's figure this out</button>
            <button className="btn ghost" onClick={() => onGo("brain_map")}>why this plan?</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
          <span className="chip" onClick={() => onGo("growth")}>{improved > 0 ? `${improved} concept${improved > 1 ? "s" : ""} moved with evidence` : "no measurable growth yet — that's honest"}</span>
          {ag.stage !== "no_evidence" && <span className="chip" onClick={() => onGo("growth")}>decisions: {ag.stage.replace("_", " ")}</span>}
          <span className="chip" onClick={() => onGo("notebook")}>{sanct.sys.curiosity.questions.length ? `${sanct.sys.curiosity.questions.length} open question${sanct.sys.curiosity.questions.length > 1 ? "s" : " — yours"}` : "your notebook awaits"}</span>
          <span className="chip">~{budget} min budget{pers.loadToleranceMin > 0 ? " (measured)" : ""}</span>
        </div>

        <p className="whisper" style={{ marginTop: 26, fontSize: 12.5 }}>
          nothing here is a score to chase. the mist on your map is an invitation, not a grade. you can leave anytime — the room remembers, it doesn't count.
        </p>
      </div>
    </div>
  );
}
