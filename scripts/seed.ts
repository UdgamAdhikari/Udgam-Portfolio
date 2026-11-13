/**
 * Seed an empty database with the content that used to be hard-coded in
 * src/data/content.ts and src/content/work/*.md. Only fills what's missing,
 * so it never overwrites edits made in the dashboard.
 *
 *   DATABASE_URL=… npm run db:seed
 */
import { existsSync, readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { buildSeed } from "../src/server/content/seed-data";
import { experience, projects, settings } from "../src/server/db/schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const client = new Client({ connectionString: url });
await client.connect();
const db = drizzle(client);

const seed = buildSeed((slug) => {
  const file = `src/content/work/${slug}.md`;
  return existsSync(file) ? readFileSync(file, "utf8") : "";
});

let added = 0;
for (const [key, value] of Object.entries(seed.settings)) {
  const rows = await db.insert(settings).values({ key, value }).onConflictDoNothing().returning();
  added += rows.length;
}
if ((await db.select({ id: projects.id }).from(projects).limit(1)).length === 0) {
  await db.insert(projects).values(seed.projects);
  added += seed.projects.length;
}
if ((await db.select({ id: experience.id }).from(experience).limit(1)).length === 0) {
  await db.insert(experience).values(seed.experience);
  added += seed.experience.length;
}
await client.end();
console.log(added ? `Seeded ${added} rows.` : "Nothing to seed: the database already has content.");
