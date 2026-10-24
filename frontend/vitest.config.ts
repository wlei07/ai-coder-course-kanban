import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/components/**/*.{ts,tsx}", "src/lib/**/*.ts"],
      exclude: ["**/*.test.*"],
      reporter: ["text", "html"],
      thresholds: {
        lines: 90, statements: 90, functions: 90, branches: 85,
        "src/lib/board.ts": { lines: 100, statements: 100, functions: 100, branches: 100 },
      },
    },
  },
});
