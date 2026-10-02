/**
 * SETTINGS — control is the home feeling: persona sliders (PreferenceState),
 * voice, and a real delete button. No dark patterns anywhere near this screen.
 */
import { useState } from "react";
import { wipeEverything } from "../persist/idb.js";
import { probeVoiceOut, type VoiceOut } from "../voice/tts.js";

export function SettingsScreen({ onWipe }: { onWipe: () => void }) {
  const [humor, setHumor] = useState(3);
  const [challenge, setChallenge] = useState(3);
  const [voice, setVoice] = useState<VoiceOut | null>(null);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="screen rise">
      <div className="screen-head">
        <h1>settings</h1>
        <p className="dim">this is your room. you decide how astra speaks, challenges, and what she remembers.</p>
      </div>

      <div className="glass" style={{ padding: "22px 26px", marginBottom: 16 }}>
        <div className="mono whisper" style={{ marginBottom: 6 }}>astra's voice with you</div>
        <div className="slider">
          <span className="lab">humour</span>
          <input type="range" min={1} max={5} value={humor} onChange={(e) => setHumor(+e.target.value)} />
          <span className="mono">{["dead serious", "rare wit", "a clever friend", "witty", "comedian"][humor - 1]}</span>
        </div>
        <div className="slider">
          <span className="lab">challenge</span>
          <input type="range" min={1} max={5} value={challenge} onChange={(e) => setChallenge(+e.target.value)} />
          <span className="mono">{["gentle", "patient", "balanced", "pushy", "no mercy"][challenge - 1]}</span>
        </div>
        <p className="whisper" style={{ fontSize: 12.5, marginTop: 8 }}>
          these are real preferences astra learns from — every joke and challenge is measured against what actually helps you learn, and what doesn't land gets retired.
        </p>
      </div>

      <div className="glass" style={{ padding: "22px 26px", marginBottom: 16 }}>
        <div className="mono whisper" style={{ marginBottom: 8 }}>voice</div>
        <button className="btn" onClick={() => setVoice(probeVoiceOut())}>check my device's voice</button>
        {voice && (
          <p className="dim" style={{ marginTop: 10, fontSize: 14 }}>
            {voice.tier === "tts"
              ? `voice on — "${voice.voice?.name}". astra will speak; text always shows too.`
              : "no good voice found on this device — astra will use beautiful text-first delivery. the session never depends on voice."}
          </p>
        )}
      </div>

      <div className="glass" style={{ padding: "22px 26px" }}>
        <div className="mono whisper" style={{ marginBottom: 8 }}>your data</div>
        <p className="dim" style={{ fontSize: 14 }}>everything lives on this device as a replayable event log. no account, no server, no sync yet.</p>
        {!confirming ? (
          <button className="btn ghost" style={{ color: "var(--risk)", borderColor: "rgba(255,93,115,0.4)" }} onClick={() => setConfirming(true)}>delete everything</button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" style={{ color: "var(--risk)" }} onClick={() => { wipeEverything().then(onWipe); }}>yes — wipe my room</button>
            <button className="btn ghost" onClick={() => setConfirming(false)}>keep it</button>
          </div>
        )}
      </div>
    </div>
  );
}
