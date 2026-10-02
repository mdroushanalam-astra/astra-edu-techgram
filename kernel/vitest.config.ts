import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // Determinism: seeds are fixed inside tests; no wall-clock, no network.
    testTimeout: 30000,
  },
});
