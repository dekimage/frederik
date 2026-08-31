import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup/loadEnv.mjs", "./tests/setup/mocks.mjs"],
    include: ["tests/integration/**/*.test.js"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    sequence: { concurrent: false },
    disableConsoleIntercept: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
