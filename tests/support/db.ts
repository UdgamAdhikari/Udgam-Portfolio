import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { setDbForTests, type Db } from "@/server/db/client";
import * as schema from "@/server/db/schema";

/**
 * A fresh, real PostgreSQL (PGlite, in-process) with the project's actual
 * migrations applied. Integration tests run against this — not mocks.
 */
export async function createTestDb(): Promise<{ db: Db; client: PGlite; close: () => Promise<void> }> {
  const client = await PGlite.create();
  for (const file of readdirSync("drizzle").filter((f) => f.endsWith(".sql")).sort()) {
    for (const statement of readFileSync(`drizzle/${file}`, "utf8").split("--> statement-breakpoint")) {
      if (statement.trim()) await client.exec(statement);
    }
  }
  const db = drizzle(client, { schema }) as unknown as Db;
  setDbForTests(db);
  return {
    db,
    client,
    close: async () => {
      setDbForTests(undefined);
      await client.close();
    },
  };
}

/** Empty every table, keeping the schema: fast isolation between tests. */
export async function resetTestDb(client: PGlite) {
  const { rows } = await client.query<{ tablename: string }>(
    "select tablename from pg_tables where schemaname = 'public' and tablename <> '__drizzle_migrations'",
  );
  if (rows.length) await client.exec(`truncate ${rows.map((r) => `"${r.tablename}"`).join(", ")} restart identity cascade`);
}
