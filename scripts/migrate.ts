import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required. Local development uses auto-migrating PGlite.");
    process.exit(1);
  }
  const client = postgres(url, { prepare: false, max: 1 });
  await migrate(drizzle(client), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log("Migrations applied.");
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
