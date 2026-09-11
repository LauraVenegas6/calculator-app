import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

// If you already have a vite.config.ts, this extends it instead of replacing it.
// If you prefer a single file, move the `test` block into your existing
// vite.config.ts and delete this file.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
      css: true,
    },
  })
);