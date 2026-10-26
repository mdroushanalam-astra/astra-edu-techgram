import { afterEach, describe, expect, it, vi } from "vitest";
import { connectedAdapter } from "../src/journey/connected.js";
import { defaultProfile, score } from "../src/journey/model.js";
import { previewAdapter } from "../src/journey/preview.js";
import { api } from "../src/connected/api.js";
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("Journey data boundaries", () => {
    it("keeps preview offline, leaves unassessed concepts unknown, and honours time budget", async () => {
        const fetch = vi.fn();
        vi.stubGlobal("fetch", fetch);
        const a = previewAdapter();
        const v = await a.start("preview", 20, "start");
        expect(v.concepts.every(c => c.grey)).toBe(true);
        expect(v.plan.blocks.reduce((n, b) => n + b.minutes, 0)).toBe(20);
        await a.answer(v, 0, 2, 5, 20, "answer");
        expect(fetch).not.toHaveBeenCalled();
    });
    it("retries the same preview command without adding another observation", async () => {
        const a = previewAdapter();
        const v = await a.start("preview", 40, "start");
        const first = await a.answer(v, 0, 2, 5, 40, "answer");
        const retry = await a.answer(v, 0, 2, 5, 40, "answer");
        expect(retry).toEqual(first);
        expect(retry.revision).toBe(1);
        expect(retry.concepts.find(c => c.name === "Weathering")?.nEff).toBe(1);
    });
    it("rejects a stale question rather than grading a different item", async () => {
        const a = previewAdapter();
        const v = await a.start("preview", 40, "start");
        await a.answer(v, 0, 2, 5, 40, "answer");
        await expect(a.answer(v, 1, 2, 5, 40, "different")).rejects.toThrow("question changed");
    });
    it("reconciles onboarding after an uncertain response", async () => {
        const existing = { student_id: "student", name: "Mira", goal: "UPSC Polity" };
        const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([existing]), { status: 200 }));
        vi.stubGlobal("fetch", fetch);
        expect(await connectedAdapter().onboard({ ...defaultProfile, name: "Mira", goal: "UPSC Polity" })).toEqual(existing);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch.mock.calls[0][0]).toBe("/api/students");
    });
    it("clears authentication on signout", async () => {
        const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "ephemeral", full_name: "Mira" }))).mockImplementation(async () => new Response("[]"));
        vi.stubGlobal("fetch", fetch);
        const a = connectedAdapter();
        await a.authenticate(false, "", "m@example.test", "password");
        a.signout();
        await a.onboard({ ...defaultProfile, name: "Mira" });
        expect(fetch.mock.calls[2][1].headers.Authorization).toBeUndefined();
    });
    it("does not turn zero observations into an accuracy or mastery claim", () => { expect(score([])).toBeNull(); });
    it("releases a stalled request so its retained command can be retried", async () => {
        vi.useFakeTimers();
        vi.stubGlobal("fetch", vi.fn((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error("Aborted"))))));
        const request = api("/learning/student/start", null, { command_id: "retained" });
        const assertion = expect(request).rejects.toThrow("timed out");
        await vi.advanceTimersByTimeAsync(30000);
        await assertion;
    });
});
