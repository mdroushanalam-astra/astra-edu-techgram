import { useEffect, useState } from "react";
import type { LearningView } from "../connected/api.js";
import { RiverDiagram } from "./Elements.js";

/** A labelled classroom model: visual exploration is not a graded observation. */
export function LessonDiagram({ lesson }: { lesson: NonNullable<LearningView["lesson"]> }) {
    const [flow, setFlow] = useState(60);
    const [prediction, setPrediction] = useState("");
    const [revealed, setRevealed] = useState(false);
    const [wind, setWind] = useState("west");
    useEffect(() => { setPrediction(""); setRevealed(false); }, [lesson.step_id]);
    if (lesson.board.kind === "process-flow" && lesson.concept_id === "gu_coordinates") return <figure className="unit-diagram coordinate-grid">
        <svg viewBox="0 0 280 220" role="img" aria-label="Schematic latitude-longitude grid locating 20 degrees north, 70 degrees east">
        <rect x="40" y="20" width="210" height="160" rx="8" fill="#0b2639" stroke="#49d4ee"/>
        {[60,100,140].map(y=><path key={y} d={`M40 ${y}h210`} stroke="#286680"/>)}
        {[75,110,145,180,215].map(x=><path key={x} d={`M${x} 20v160`} stroke="#286680"/>)}
        <path d="M40 100h210M145 20v160" stroke="#80e7ff" strokeWidth="2"/>
        <circle cx="186" cy="82" r="5" fill="#fdbd63"/><text x="185" y="67" fill="#fdbd63" fontSize="14" textAnchor="middle">20°N, 70°E</text>
        <text x="40" y="199" fill="#d9f6ff" fontSize="14">Equator: 0° latitude</text><text x="40" y="216" fill="#d9f6ff" fontSize="14">Prime meridian: 0° longitude</text>
        </svg><figcaption>Latitude measures north/south; longitude measures east/west. A coordinate pair locates a position.</figcaption><small>Schematic grid, not a surveyed map. Distortion and reference system matter.</small></figure>;
    if (lesson.board.kind === "process-flow" && lesson.concept_id === "gu_scale") return <figure className="unit-diagram"><svg viewBox="0 0 280 160" role="img" aria-label="Map scale worked example: two centimetres at 1 to 50,000 equals one kilometre">
        <path d="M30 60h220M30 48v24M140 48v24M250 48v24" stroke="#80e7ff" strokeWidth="3"/>
        <text x="140" y="32" textAnchor="middle" fill="#d9f6ff" fontSize="18">Scale 1:50,000</text>
        <text x="140" y="103" textAnchor="middle" fill="#d9f6ff" fontSize="18">2 cm × 50,000 = 100,000 cm</text>
        <text x="140" y="138" textAnchor="middle" fill="#fdbd63" fontSize="18">100,000 cm = 1 km</text></svg><figcaption>Convert the ground units after multiplying. The displayed line is illustrative; its physical screen length is not a calibrated ruler.</figcaption></figure>;
    if (lesson.board.kind === "process-flow" && lesson.concept_id === "gu_motions") return <figure className="unit-diagram"><svg viewBox="0 0 280 190" role="img" aria-label="Tilted Earth with northern hemisphere facing the Sun">
        <circle cx="45" cy="87" r="28" fill="#fdbd63"/><circle cx="210" cy="87" r="44" fill="#127dba"/>
        {[60,87,114].map(y=><path key={y} d={`M80 ${y}h82m-8-5 8 5-8 5`} stroke="#fdbd63" strokeWidth="2" fill="none"/>)}
        <path d="M184 29 235 145" stroke="#c5f4ff" strokeWidth="3"/>
        <text x="178" y="20" fill="#d9f6ff" fontSize="16">N</text><text x="238" y="165" fill="#d9f6ff" fontSize="16">S</text>
        <text x="20" y="150" fill="#d9f6ff" fontSize="16">Sun</text><text x="50" y="184" fill="#d9f6ff" fontSize="15">Tilt changes seasonal illumination.</text>
        </svg><figcaption>In this orientation the north tilts toward sunlight. Axial tilt and orbital position affect solar angle and day length; rotation still produces day/night.</figcaption><small>Not to scale; Earth–Sun distance is not the main cause of seasons.</small></figure>;
    if (lesson.board.kind === "process-flow" && lesson.concept_id === "gu_orographic") return <figure className="unit-diagram"><label>Moist wind direction<select value={wind} onChange={e=>setWind(e.target.value)}><option value="west">West to east</option><option value="east">East to west</option></select></label>
        <svg viewBox="0 0 280 200" role="img" aria-label={`Mountain: ${wind === "west" ? "west" : "east"} slope is windward`}>
        <path d="M20 175 140 50 260 175Z" fill="#0b2639" stroke="#49d4ee" strokeWidth="2"/>
        <path d={wind === "west" ? "M20 115 105 35m-4 10 4-10-10 3" : "M260 115 175 35m4 10-4-10 10 3"} fill="none" stroke="#fdbd63" strokeWidth="3"/>
        <text x="65" y="195" fill="#d9f6ff" fontSize="16" textAnchor="middle">{wind === "west" ? "Windward" : "Leeward"}</text><text x="215" y="195" fill="#d9f6ff" fontSize="16" textAnchor="middle">{wind === "east" ? "Windward" : "Leeward"}</text>
        </svg><figcaption>Reversing moist wind changes the exposed slope. Uplift can cool air toward saturation; rainfall also depends on moisture, stability and terrain.</figcaption><small>Explore a relationship; this does not predict rainfall or update mastery.</small></figure>;
    if (lesson.board.kind === "process-flow") return <figure className="unit-diagram"><svg className="flow-wide" viewBox="0 0 600 150" role="img" aria-label={`${lesson.title}: process diagram`}>
        {lesson.board.nodes?.map((node, i) => <g key={node}><rect x={10+i*200} y="15" width="178" height="110" rx="16" fill="#0b2639" stroke="#49d4ee"/>
        <text x={99+i*200} y="58" textAnchor="middle" fill="#d9f6ff" fontSize="18">{node.split(/\s+/).reduce<string[]>((rows, word) => {
            const last=rows.length-1; if(last<0||rows[last]!.length+word.length>18)rows.push(word);else rows[last]+=" "+word;return rows;
        }, []).map((row,j)=><tspan key={j} x={99+i*200} dy={j?22:0}>{row}</tspan>)}</text>
        {i<2&&<path d={`M${188+i*200} 70h20m-7-6 7 6-7 6`} fill="none" stroke="#63e6ff" strokeWidth="3"/>}</g>)}
        </svg><svg className="flow-narrow" viewBox="0 0 280 400" role="img" aria-label={`${lesson.title}: process diagram`}>
        {lesson.board.nodes?.map((node,i)=><g key={node}><rect x="20" y={10+i*130} width="240" height="108" rx="16" fill="#0b2639" stroke="#49d4ee"/>
        <text x="140" y={51+i*130} textAnchor="middle" fill="#d9f6ff" fontSize="18">{node.split(/\s+/).reduce<string[]>((rows,word)=>{const n=rows.length-1;if(n<0||rows[n]!.length+word.length>22)rows.push(word);else rows[n]+=" "+word;return rows;},[]).map((row,j)=><tspan key={j} x="140" dy={j?24:0}>{row}</tspan>)}</text>
        {i<2&&<path d={`M140 ${118+i*130}v20m-6-7 6 7 6-7`} fill="none" stroke="#63e6ff" strokeWidth="3"/>}</g>)}
        </svg><figcaption>{lesson.board.caption}</figcaption><small>Schematic mechanism, not a simulation or a graded drawing.</small></figure>;
    if (lesson.board.kind !== "river-process") return <div className="concept-board"><span>◇</span><div><strong>{lesson.title}</strong><p>{lesson.objective}</p></div></div>;
    return <details className="diagram-explorer"><summary>Explore the process on the board</summary><RiverDiagram/>
        {!["g_forces", "g_weathering"].includes(lesson.concept_id) && <><label>Flow in this simplified example: {flow}%<input type="range" min="10" max="100" value={flow} onChange={e => { setFlow(Number(e.target.value)); setRevealed(false); }} /></label>
        <fieldset><legend>What might happen as transport capacity decreases?</legend><div className="chips">{["More material settles", "Every particle keeps moving"].map(v => <button type="button" key={v} aria-pressed={prediction === v} onClick={() => { setPrediction(v); setRevealed(false); }}>{v}</button>)}</div></fieldset>
        <button type="button" className="text-button" disabled={!prediction} onClick={() => setRevealed(true)}>Explore my prediction</button>
        {revealed && <p role="status">Some sediment may settle as transport capacity decreases. Fine particles can remain suspended. Your setting is {flow}%; this slider illustrates a relationship, not a physical forecast or a graded answer.</p>}</>}
        <small>Schematic classroom illustration. Real behavior depends on sediment, turbulence and local conditions. This exploration does not update mastery.</small></details>;
}

export function SpeechControls({ text, paused }: { text: string; paused: boolean }) {
    const supported = typeof window !== "undefined" && "speechSynthesis" in window;
    const [speaking, setSpeaking] = useState(false);
    const [speechPaused, setSpeechPaused] = useState(false);
    const [rate, setRate] = useState(1);
    const [failure, setFailure] = useState("");
    function stop() { if (supported) window.speechSynthesis.cancel(); setSpeaking(false); setSpeechPaused(false); }
    useEffect(() => { stop(); return () => { if (supported) window.speechSynthesis.cancel(); }; }, [text, paused]);
    function read() {
        stop(); setFailure("");
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-IN"; utterance.rate = rate;
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = e => { setSpeaking(false); if (e.error !== "canceled" && e.error !== "interrupted") setFailure("Speech playback is unavailable. The complete lesson text is on the board."); };
        setSpeaking(true); window.speechSynthesis.speak(utterance);
    }
    return <div className="speech-controls" aria-label="Lesson speech playback"><button type="button" disabled={!supported || paused || !text} onClick={read}>Read aloud</button>
        <button type="button" disabled={!speaking} onClick={() => { speechPaused ? window.speechSynthesis.resume() : window.speechSynthesis.pause(); setSpeechPaused(!speechPaused); }}>{speechPaused ? "Resume speech" : "Pause speech"}</button>
        <button type="button" disabled={!speaking} onClick={stop}>Stop speech</button><label>Speech speed<select value={rate} onChange={e => { setRate(Number(e.target.value)); stop(); }}><option value={.8}>Slower</option><option value={1}>Normal</option><option value={1.2}>Faster</option></select></label>
        <small>{!supported ? "This browser does not support speech playback." : "Browser-provided voice · Availability and processing depend on your device/browser."}</small>{failure && <p role="status">{failure}</p>}</div>;
}
