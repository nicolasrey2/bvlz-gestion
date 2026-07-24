import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Alias "@/..." → raíz del proyecto (igual que tsconfig).
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
  resolve: {
    alias: { "@": root.replace(/\/$/, "") },
  },
});
