import path from "node:path";
import fs from "node:fs";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";
import { seedDemoData } from "./seed";

export type Database = PgliteDatabase<typeof schema>;

type DbGlobal = typeof globalThis & {
  __internshipDbPromise?: Promise<Database>;
  __internshipPgClient?: PGlite;
};

const dbGlobal = globalThis as DbGlobal;

const migrationsFolder = path.join(process.cwd(), "drizzle");

async function createLocalDatabase(): Promise<Database> {
  const dataDir = path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(dataDir, { recursive: true });
  const client = new PGlite({ dataDir });
  dbGlobal.__internshipPgClient = client;
  const db = drizzlePglite(client, { schema, casing: "snake_case" });
  await migratePglite(db, { migrationsFolder });
  if (process.env.SEED_DEMO !== "false") {
    await seedDemoData(db);
  }
  return db;
}

function normalizeDatabaseUrl(url: string) {
  // Supabase recommends the transaction pooler for serverless connections.
  // The project string may still contain the session-pooler port.
  if (url.includes("pooler.supabase.com") && url.includes(":5432")) {
    return url.replace(":5432", ":6543");
  }
  return url;
}

async function createSupabaseDatabase(url: string): Promise<Database> {
  const connectionUrl = normalizeDatabaseUrl(url);
  const client = postgres(connectionUrl, {
    prepare: false,
    max: 4,
    idle_timeout: 300,
    connect_timeout: 15,
    ssl: url.includes("supabase") || url.includes("sslmode=require") ? "require" : undefined,
  });
  const db = drizzlePostgres(client, { schema, casing: "snake_case" });
  return db as unknown as Database;
}

async function createDatabase(): Promise<Database> {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    return createSupabaseDatabase(url);
  }
  return createLocalDatabase();
}

export async function getDb(): Promise<Database> {
  if (!dbGlobal.__internshipDbPromise) {
    dbGlobal.__internshipDbPromise = createDatabase();
  }
  return dbGlobal.__internshipDbPromise;
}

export async function closeDb() {
  await dbGlobal.__internshipPgClient?.close();
  dbGlobal.__internshipPgClient = undefined;
  dbGlobal.__internshipDbPromise = undefined;
}

export { migrationsFolder };
export { migratePostgres };
