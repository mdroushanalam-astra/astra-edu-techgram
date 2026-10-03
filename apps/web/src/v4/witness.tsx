/**
 * THE WITNESS [v4] — a crash must never be a blank page.
 * Any render error shows its exact message + stack on screen (with a reload)
 * — the app reports its own failure honestly, like everything else here.
 */
import React from "react";

interface S { err: Error | null }

export class Witness extends React.Component<{ children: React.ReactNode }, S> {
  state: S = { err: null };

  static getDerivedStateFromError(err: Error): S { return { err }; }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[TECHGRAM CRASH]", err, info?.componentStack);
  }

  render() {
    if (this.state.err) {
      return (
        <div style={{ minHeight: "100vh", background: "var(--obsidian, #030507)", color: "#f2f2f2", display: "grid", placeItems: "center", padding: 30, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          <div style={{ maxWidth: 720, border: "1px solid rgba(255,180,92,0.4)", borderRadius: 12, padding: "30px 36px", background: "rgba(255,255,255,0.03)" }}>
            <div style={{ font: "500 11px 'JetBrains Mono', monospace", letterSpacing: "0.12em", color: "#ffb45c", marginBottom: 12 }}>TECHGRAM HIT A WALL — HERE IS EXACTLY WHAT HAPPENED</div>
            <div style={{ fontSize: 17, marginBottom: 14, fontWeight: 600 }}>{this.state.err.message}</div>
            <pre style={{ fontSize: 11.5, whiteSpace: "pre-wrap", color: "#94a3b8", maxHeight: 260, overflow: "auto", fontFamily: "'JetBrains Mono', monospace" }}>{this.state.err.stack}</pre>
            <button
              onClick={() => { this.setState({ err: null }); location.reload(); }}
              style={{ marginTop: 18, padding: "12px 24px", borderRadius: 8, border: "1px solid rgba(255,180,92,0.45)", background: "rgba(245,158,11,0.1)", color: "#ffb45c", cursor: "pointer", font: "500 14px 'Plus Jakarta Sans'" }}
            >Reload the room</button>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
