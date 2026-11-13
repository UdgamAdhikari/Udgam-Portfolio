/**
 * Prints an ADMIN_PASSWORD_HASH for .env. The password is read from stdin
 * (not argv) so it never lands in shell history.
 *
 *   npm run admin:hash
 */
import { createInterface } from "node:readline/promises";
import { hashPassword } from "../src/server/auth/password-core";

const rl = createInterface({ input: process.stdin, output: process.stderr });
const password = (await rl.question("Admin password (min 12 characters): ")).trim();
rl.close();
if (password.length < 12) {
  console.error("Use at least 12 characters.");
  process.exit(1);
}
console.log(`ADMIN_PASSWORD_HASH='${await hashPassword(password)}'`);
