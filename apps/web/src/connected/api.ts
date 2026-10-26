export interface LearningView {
    student_id: string;
    revision: number;
    model_version: string;
    content_version: string;
    concepts: {
        id: string;
        name: string;
        mean: number;
        lo: number;
        hi: number;
        grey: boolean;
        nEff: number;
    }[];
    plan: {
        blocks: {
            conceptName: string;
            action: string;
            reason: string;
            minutes: number;
            assumption: string;
        }[];
        personalisationApplied: string[];
    };
    item: {
        purpose?: "diagnostic" | "practice" | "check" | "transfer";
        id: string;
        stem: string;
        options: string[];
        concept_id: string;
        dimension: string;
    };
    feedback: {
        assisted?: boolean;
        correct: boolean;
        correct_option: number;
        correct_text: string;
        concept_id: string;
        explanation: {
            body: string;
            source: string;
            verified_by: string;
        } | null;
    } | null;
    teaching: {
        body: string;
        source: string;
        verified_by: string;
    } | null;
    decision: {
        directive: {
            learningAction: string;
        };
        receipt: {
            reason: string[];
            confidence: number;
        };
    };
    continuity?: string;
    session?: { id: string; status: "active" | "paused" | "completed"; minutes: number; elapsed_sec: number;
        answers: import("../journey/model.js").AnswerRecord[]; independent_answers: number; assisted_answers: number };
    lesson?: { step_id: string; move: string; body: string; title: string; concept_id: string;
        reference?: { id: string; title: string; body: string; source: string; review: string; document_version: string;
            sha256: string; line_start: number; line_end: number; assessment_ready: boolean } | null;
        input: "item_response" | "confidence_report" | "none"; hints_allowed: boolean; hint_level: number; hint_available: boolean; example_available: boolean;
        support: { body: string; source: string } | null; source: string; review: string; objective: string;
        completed_segments: number; total_segments: number; board: { kind: string; concept_id: string; nodes?: readonly string[]; caption?: string };
        communication: { verbosity: string; silenceFirst: boolean; humor: boolean; language: string; requested_language: string } };
}
export async function api<T>(path: string, token: string | null, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
        const response = await fetch(`/api${path}`, {
            method: body === undefined ? "GET" : "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: controller.signal,
        });
        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(typeof payload.detail === "string" ? payload.detail : `Request failed (${response.status})`);
        }
        return await response.json() as T;
    }
    catch (error) {
        if (controller.signal.aborted)
            throw new Error("The request timed out. Retry to safely resolve the result.");
        throw error;
    }
    finally {
        clearTimeout(timeout);
    }
}
