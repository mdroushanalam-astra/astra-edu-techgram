import type { LearningView } from "../connected/api.js";
export type Screen = "welcome" | "meet" | "details" | "questions" | "summary" | "home" | "plan" | "confirm" | "session" | "complete" | "debrief" | "next" | "artifacts" | "return" | "map" | "growth" | "library" | "agency" | "settings";
export const screens: Screen[] = ["welcome", "meet", "details", "questions", "summary", "home", "plan", "confirm", "session", "complete", "debrief", "next", "artifacts", "return", "map", "growth", "library", "agency", "settings"];
export const journeySteps = ["Onboard", "Understand", "Plan", "Learn", "Debrief", "Evolve"];
export interface Profile {
    geographyUnit?: "geomorphology" | "maps_motions" | "atmosphere" | "monsoon";
    name: string;
    goal: string;
    level: string;
    subjects: string[];
    style: string;
    energy: string;
    language: string;
    minutes: number;
    examDate: string;
    humor?: boolean;
}
export const defaultProfile: Profile = { name: "", goal: "UPSC Geography", level: "Graduation", subjects: ["Geography"], style: "Show me an example", energy: "Okay", language: "English", minutes: 40, examDate: "" };
export interface Space {
    student_id: string;
    name: string;
    goal: string;
}
export interface AnswerRecord {
    purpose?: "diagnostic" | "practice" | "check" | "transfer";
    command: string;
    question: string;
    selected: string;
    correct: boolean;
    answer: string;
    explanation: string;
    concept: string;
    seconds: number;
    confidence: number;
    assisted?: boolean;
}
export interface SavedSession {
    id: string;
    date: string;
    subject: string;
    results: AnswerRecord[];
    feeling: string;
    next: string;
}
export interface Adapter {
    mode: "preview" | "connected";
    authenticate(register: boolean, name: string, email: string, password: string): Promise<{
        name: string;
        spaces: Space[];
    }>;
    onboard(profile: Profile): Promise<Space>;
    start(id: string, minutes: number, command: string): Promise<LearningView>;
    answer(view: LearningView, choice: number, confidence: number, seconds: number, minutes: number, command: string): Promise<LearningView>;
    signout(): void;
    current?(id: string): Promise<LearningAccount>;
    preferences?(id: string, revision: number, profile: Profile, command: string): Promise<LearningAccount>;
    action?(view: LearningView, action: LessonAction, seconds: number, command: string): Promise<LearningView>;
    reflection?(id: string, revision: number, session: string, feeling: string, next: string, command: string): Promise<LearningAccount>;
    search?(id: string, query: string): Promise<KnowledgeResult>;
}
export type LessonAction = "continue" | "hint" | "example" | "pause" | "resume" | "finish";
export interface LearningAccount { revision: number; preferences: Partial<Profile>; history: SavedSession[]; view: LearningView | null }
export interface KnowledgeResult { results: { id: string; concept_id: string; title?: string; body: string; source: string; review: string; assessment_ready?: boolean; unit_id?: Profile["geographyUnit"] }[]; scope: string }
export function readLocal<T>(key: string, fallback: T): T { try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
}
catch {
    return fallback;
} }
export function writeLocal(key: string, value: unknown) { try {
    localStorage.setItem(key, JSON.stringify(value));
}
catch { /* Storage failure does not block the journey. */ } }
export function score(results: AnswerRecord[]) { return results.length ? Math.round(100 * results.filter(r => r.correct).length / results.length) : null; }
export function cleanReason(reason: string) { return reason.replace(/\(n_eff [^)]+\)/g, "").replaceAll("Unknown-ish", "Not enough evidence yet").replaceAll("information value", "a useful check"); }
