/** Apply SQL migrations in ./drizzle to DATABASE_URL. Safe to run repeatedly. */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const client = new Client({ connectionString: url });
await client.connect();
await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
await client.end();
console.log("Migrations applied.");
