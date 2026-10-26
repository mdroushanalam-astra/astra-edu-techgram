import { useEffect, useRef, useState } from "react";
import type { ReactNode, PointerEvent } from "react";
export function Button({ children, onClick, secondary = false, disabled = false, type = "button" }: {
    children: ReactNode;
    onClick?: () => void;
    secondary?: boolean;
    disabled?: boolean;
    type?: "button" | "submit";
}) { return <button type={type} className={`button ${secondary ? "secondary" : "primary"}`} onClick={onClick} disabled={disabled}>{children}</button>; }
export function Panel({ children, className = "" }: {
    children: ReactNode;
    className?: string;
}) { return <section className={`glass ${className}`}>{children}</section>; }
export function Orb({ small = false, mood = "ready" }: {
    small?: boolean;
    mood?: string;
}) { return <div className={`astra-orb ${small ? "small" : ""} mood-${mood}`}><img src={mood === "attentive" ? "/art/astra-attentive.webp" : "/art/astra.webp"} alt="Astra, your glowing learning companion" width="1000" height="800"/><span className="orb-shadow"/></div>; }
export function Speech({ children }: {
    children: ReactNode;
}) { return <div className="speech">{children}</div>; }
export function Options({ values, value, onChange }: {
    values: string[];
    value: string;
    onChange: (v: string) => void;
}) { return <div className="options">{values.map((v, i) => <button key={v} className={`option ${value === v ? "selected" : ""}`} aria-pressed={value === v} onClick={() => onChange(v)}><span className="option-key">{String.fromCharCode(65 + i)}</span>{v}</button>)}</div>; }
export function Steps({ step }: {
    step: number;
}) { return <div className="steps" aria-label={`Step ${step} of 5`}>{[1, 2, 3, 4, 5].map(s => <span key={s} className={s <= step ? "done" : ""}/>)}</div>; }
export function Brand() { return <div className="brand"><span className="brand-mark">ϟ</span> Techgram</div>; }
export function RiverDiagram() { return <svg className="river-diagram" viewBox="0 0 620 170" role="img" aria-label="River processes: weathering breaks rock down, erosion removes it, transport moves it, deposition settles it"><defs><linearGradient id="river" x2="1" y2="1"><stop stopColor="#6feaff"/><stop offset="1" stopColor="#4e8cff"/></linearGradient></defs><path d="M10 105L55 28 100 105 140 44 183 112" fill="none" stroke="#b8d4f9" strokeWidth="2"/><path d="M55 28L65 55 52 48 43 61M140 44L153 70 139 62 130 72" fill="none" stroke="#b8d4f9"/><path d="M95 108C180 78 162 143 260 112S348 126 418 109 465 119 510 125" fill="none" stroke="url(#river)" strokeWidth="12" opacity=".75"/><path d="M510 125L582 92M510 125L594 128M510 125L583 159" stroke="#6feaff" strokeWidth="5"/><g fill="#daeaff" fontFamily="Plus Jakarta Sans" fontSize="13"><text x="8" y="19">1. Weathering</text><text x="155" y="163">2. Erosion</text><text x="258" y="72">3. Transport →</text><text x="434" y="29">4. Deposition</text><text x="546" y="77" fill="#ffc777">Delta</text></g><path d="M463 38L515 107" stroke="#ffc777" strokeDasharray="4 4" fill="none"/><g fill="#ffc777"><circle cx="473" cy="120" r="3"/><circle cx="488" cy="132" r="3"/><circle cx="461" cy="134" r="2"/></g></svg>; }
export function DrawingBoard({ enabled, undo, clear }: {
    enabled: boolean;
    undo: number;
    clear: number;
}) {
    const ref = useRef<HTMLCanvasElement>(null);
    const strokes = useRef<{
        x: number;
        y: number;
    }[][]>([]);
    const active = useRef(false);
    const [size, setSize] = useState(0);
    function render() { const cv = ref.current; if (!cv)
        return; const rect = cv.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = rect.width * dpr; cv.height = rect.height * dpr; const ctx = cv.getContext("2d")!; ctx.scale(dpr, dpr); ctx.strokeStyle = "#7feeff"; ctx.lineWidth = 2; ctx.lineCap = "round"; strokes.current.forEach(st => { ctx.beginPath(); st.forEach((p, i) => i ? ctx.lineTo(p.x * rect.width, p.y * rect.height) : ctx.moveTo(p.x * rect.width, p.y * rect.height)); ctx.stroke(); }); }
    useEffect(() => { const observer = new ResizeObserver(() => setSize(v => v + 1)); if (ref.current)
        observer.observe(ref.current); return () => observer.disconnect(); }, []);
    useEffect(render, [size]);
    useEffect(() => { strokes.current.pop(); render(); }, [undo]);
    useEffect(() => { strokes.current = []; render(); }, [clear]);
    const pos = (e: PointerEvent) => { const r = e.currentTarget.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
    return <canvas ref={ref} className={`drawing ${enabled ? "enabled" : ""}`} aria-label="Freehand annotation canvas; use Clear or Undo to remove drawings" onPointerDown={e => { if (!enabled)
        return; active.current = true; e.currentTarget.setPointerCapture(e.pointerId); strokes.current.push([pos(e)]); }} onPointerMove={e => { if (active.current) {
        strokes.current.at(-1)!.push(pos(e));
        render();
    } }} onPointerUp={() => { active.current = false; }} onPointerCancel={() => { active.current = false; }}/>;
}
