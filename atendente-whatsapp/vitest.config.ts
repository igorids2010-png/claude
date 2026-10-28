import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // PGlite sobe um Postgres em WASM por arquivo de teste; o primeiro boot leva alguns segundos.
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
