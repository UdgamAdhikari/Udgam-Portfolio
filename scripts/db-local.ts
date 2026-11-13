/**
 * Local PostgreSQL for development: PGlite (real Postgres compiled to WASM)
 * exposed on the Postgres wire protocol, persisted to .data/pglite.
 * Production uses a normal PostgreSQL server via DATABASE_URL.
 *
 *   npm run db:local      # then, in another terminal: npm run db:migrate && npm run db:seed
 */
import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const port = Number(process.env.PGLITE_PORT ?? 5544);
// PGLITE_DIR=memory gives a throwaway database (used by the e2e tests).
const dataDir = process.env.PGLITE_DIR ?? ".data/pglite";
const inMemory = dataDir === "memory";

if (!inMemory) mkdirSync(dataDir, { recursive: true });
const db = inMemory ? await PGlite.create() : await PGlite.create(dataDir);
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 20 });
await server.start();
console.log(`PGlite listening on postgres://postgres@127.0.0.1:${port}/postgres (data: ${dataDir})`);

const stop = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
