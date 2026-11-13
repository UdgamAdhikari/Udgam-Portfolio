import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Runs against the production build: `npm run build` first.
// Uses the system Chrome, so no browser download is needed.
//
// The app under test gets its own throwaway database (PGlite in memory on
// port 5545, migrated and seeded on start), so e2e runs never write into
// your development data.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const E2E_DB = "postgres://postgres:postgres@127.0.0.1:5545/postgres";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://localhost:3200", channel: "chrome" },
  webServer: [
    {
      command: "tsx scripts/db-local.ts",
      port: 5545,
      env: { PGLITE_PORT: "5545", PGLITE_DIR: "memory" },
      reuseExistingServer: false,
    },
    {
      command: "npm run db:migrate && npm run db:seed && npm run start -- -p 3200",
      url: "http://localhost:3200",
      // Never send real email from tests: an empty key means "not configured".
      env: { DATABASE_URL: E2E_DB, DATABASE_POOL_MAX: "1", RESEND_API_KEY: "" },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
});
