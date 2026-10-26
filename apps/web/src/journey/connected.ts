import { api, type LearningView } from "../connected/api.js";
import type { Adapter, Space, LearningAccount, KnowledgeResult } from "./model.js";
export function connectedAdapter(): Adapter {
    let token: string | null = null;
    return {
        mode: "connected",
        async authenticate(register, name, email, password) {
            const auth = await api<{
                access_token: string;
                full_name: string;
            }>(register ? "/auth/register" : "/auth/login", null, { email, password, ...(register ? { full_name: name } : {}) });
            token = auth.access_token;
            return { name: auth.full_name, spaces: await api<Space[]>("/students", token) };
        },
        async onboard(p) {
            // Reconcile an uncertain previous onboarding response before creating a duplicate.
            const existing = await api<Space[]>("/students", token);
            const matching = existing.find(s => s.name === p.name && s.goal === p.goal);
            return matching ?? api<Space>("/student/onboard", token, { name: p.name, goal: p.goal, target_exam_date: p.examDate || null });
        },
        start: (id, minutes, command) => api<LearningView>(`/learning/${id}/start`, token, { minutes, command_id: command }),
        answer: (view, choice, confidence, seconds, minutes, command) => api<LearningView>(`/learning/${view.student_id}/answer`, token, { command_id: command, minutes, revision: view.revision, item_id: view.item.id, choice, confidence, time_sec: Math.max(.1, Math.min(7200, seconds)) }),
        current: id => api<LearningAccount>(`/learning/${id}`, token),
        preferences: (id, revision, p, command) => api<LearningAccount>(`/learning/${id}/preferences`, token, { command_id: command, revision, name: p.name, examDate: p.examDate, level: p.level, style: p.style, energy: p.energy, language: p.language, humor: !!p.humor, geographyUnit: p.geographyUnit || "geomorphology", minutes: p.minutes }),
        action: (view, action, seconds, command) => api<LearningView>(`/learning/${view.student_id}/action`, token, { command_id: command, revision: view.revision, step_id: view.lesson!.step_id, action, elapsed_sec: Math.max(0, Math.min(300, seconds)), minutes: view.session?.minutes ?? 40 }),
        reflection: (id, revision, session, feeling, next, command) => api<LearningAccount>(`/learning/${id}/reflection`, token, { command_id: command, revision, session_id: session, feeling, next }),
        search: (id, query) => api<KnowledgeResult>(`/learning/${id}/knowledge?q=${encodeURIComponent(query)}`, token),
        signout() { token = null; },
    };
}
