import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/auth/helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const sessionSecretConfigured = Boolean(process.env.SESSION_SECRET);

  if (!databaseConfigured) {
    return NextResponse.json({
      ok: true,
      database: "embedded-local",
      databaseConfigured: false,
      supabaseAuth: isSupabaseConfigured(),
      sessionSecret: sessionSecretConfigured,
      hint: "Local embedded database. Set DATABASE_URL for production.",
    });
  }

  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return NextResponse.json({
      ok: true,
      database: "postgres",
      databaseConfigured: true,
      supabaseAuth: isSupabaseConfigured(),
      sessionSecret: sessionSecretConfigured,
    });
  } catch (error) {
    console.error("Health check database error", error);
    return NextResponse.json(
      {
        ok: false,
        database: "unreachable",
        databaseConfigured: true,
        supabaseAuth: isSupabaseConfigured(),
        sessionSecret: sessionSecretConfigured,
      },
      { status: 503 },
    );
  }
}
