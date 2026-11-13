import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": src("./src"),
      // `server-only` throws outside the React server build; tests run server code directly.
      "server-only": src("./tests/support/empty.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "pglite://memory",
      APP_SECRET: "test-secret-test-secret-test-secret-0123",
      ADMIN_EMAIL: "owner@example.com",
      // Hash of "correct horse battery staple" (see tests/support/admin.ts).
      ADMIN_PASSWORD_HASH:
        "scrypt$32768$8$1$efb7XJjUK+uoeB1xuBwtfQ==$HPLVE1jWrEC46oBJd5StsZnIwMc7ysl5zoNeUJxY3XSv4foF8D8DCD7sw/TybCIfj8b4mr9XrPbOThgcrNAipQ==",
      CONTACT_TO_EMAIL: "owner@example.com",
    },
    testTimeout: 20_000,
  },
});
