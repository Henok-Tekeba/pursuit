import { getDb, closeDb } from "@/lib/db";
import { seedDemoData, DEMO_EMAIL } from "@/lib/db/seed";

async function main() {
  const db = await getDb();
  await seedDemoData(db, true);
  console.log(`Demo workspace reseeded for ${DEMO_EMAIL}.`);
  await closeDb();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
