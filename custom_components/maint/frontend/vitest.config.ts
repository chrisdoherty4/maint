import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    reporters: [
      "default",
      ["junit", { outputFile: "junit.xml" }]
    ],
    coverage: {
      enabled: true,
      reporter: ["text-summary", "lcov"],
      reportsDirectory: "coverage"
    }
  }
});
